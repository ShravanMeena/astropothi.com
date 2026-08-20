# 10 · Deploying to GCP

Project `shravanmeena` · region `asia-south1` (Mumbai) · domain `astropothi.com`.

Nothing durable lives on the VM. The database is Cloud SQL, the PDFs are in GCS, and the
box itself can be deleted and rebuilt from this document in twenty minutes.

```
                        ┌──────────────────────────────┐
   astropothi.com  ───► │  e2-small VM · static IP     │
   (A record)           │                              │
                        │  Caddy :443                  │
                        │   ├─ /api /user-api          │
                        │   │  /admin-api /noauth-api  │
                        │   │  /files   → :4050 ───────┼──► pothi-api (Docker)
                        │   └─ everything else         │        │
                        │      → /var/www/pothi (SPA)  │        │
                        │                              │        ├─► Cloud SQL Auth Proxy
                        │  cloud-sql-proxy :5432 ──────┼────────┘   → Cloud SQL Postgres 16
                        └──────────────────────────────┘
                                                        └──────────► GCS  gs://pothi-content
```

**One origin, not two.** Every API call in `pothi-app` is a relative path — there is no
`VITE_API_BASE` anywhere in the source. A separately-hosted SPA would fetch its own static
host and be handed `index.html` with a 200: the exact silent failure the README warns about
for `vite.config.ts`. So Caddy serves the built client and proxies the API namespaces from
the same hostname.

---

## Step 0 · Five code edits, before any `gcloud` command

Production today assumes object storage but cannot reach it. Deploying without these gives
a site that takes money and then 404s the thing it sold.

| # | File | Change |
|---|---|---|
| 1 | `package.json` | `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` — `storage.js` already `import()`s the first one on the production path, and it is not a dependency. The first paid order crashes. |
| 2 | `config.js` | A `storage` block keyed on `GCS_BUCKET` alone. No credentials live in config: the client authenticates as the VM's attached service account. |
| 3 | `utilities/storage.js` | `@google-cloud/storage`: upload, sign, and fetch back — but keep returning `/files/reports/{owner}/{report}.pdf`. The path stored in `reports.pdf_url` stays an app path, so nothing downstream has to learn where the bytes actually live. |
| 4 | `index.js` | Serve `/files` in production too: local disk first (it is a cache), otherwise a 302 to a short-lived signed GCS URL. Today the whole mount is wrapped in `if (config.env !== "production")`, so previews and reader pages 404 in production. |
| 5 | `server/shop/reader.service.js` | If the PDF is not on this container's disk, pull it from GCS to a temp path before `pdftoppm`. |

**The bucket stays private.** `reports.id` is an autoincrementing BIGINT, so
`reports/1/1.pdf` is guessable — a public bucket would hand out every customer's chart to
anyone who counts. Signed URLs, minted per request, never stored.

---

## Step 1 · Auth, project, APIs

```bash
gcloud auth login                      # tokens expire; do this in a real terminal
gcloud config set project shravanmeena
gcloud config set compute/region asia-south1
gcloud config set compute/zone asia-south1-a

gcloud services enable compute.googleapis.com sqladmin.googleapis.com \
  storage.googleapis.com iam.googleapis.com
```

## Step 2 · A service account for the box

The VM talks to Cloud SQL and GCS as this identity, so no key file ever lands on disk.

```bash
gcloud iam service-accounts create pothi-api --display-name="Pothi API"
SA=pothi-api@shravanmeena.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding shravanmeena \
  --member="serviceAccount:$SA" --role=roles/cloudsql.client
gcloud projects add-iam-policy-binding shravanmeena \
  --member="serviceAccount:$SA" --role=roles/storage.objectAdmin
```

## Step 3 · The database — Cloud SQL

```bash
gcloud sql instances create pothi-db \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-g1-small \
  --region=asia-south1 \
  --storage-size=10GB --storage-auto-increase \
  --backup-start-time=21:00 \
  --enable-point-in-time-recovery \
  --maintenance-window-day=SUN --maintenance-window-hour=20

gcloud sql databases create pothi --instance=pothi-db
gcloud sql users create pothi --instance=pothi-db --password='<STRONG_PASSWORD>'

gcloud sql instances describe pothi-db --format='value(connectionName)'
#  → shravanmeena:asia-south1:pothi-db
```

The instance gets a public IP with **zero authorized networks**, which means nothing on the
internet can open a connection to it. The only way in is the Cloud SQL Auth Proxy, which
authenticates with IAM rather than an IP allowlist. Do not add an authorized network.

`--edition=ENTERPRISE` is not optional: POSTGRES_16 defaults to Enterprise Plus, which
rejects every shared-core tier with a message that suggests `db-perf-optimized-N-*` — eight
times the machine and roughly eight times the bill.

Backups are on from the first minute, with point-in-time recovery. That is the whole reason
this is not Postgres on the VM.

## Step 4 · Assets — the GCS bucket

```bash
gcloud storage buckets create gs://pothi-content \
  --location=asia-south1 --uniform-bucket-level-access

# Signed URLs without a key file: the service account signs as itself, through
# the IAM API. Skipping this makes every /files/reports/* request 403.
gcloud services enable iamcredentials.googleapis.com
gcloud iam service-accounts add-iam-policy-binding \
  pothi-api@shravanmeena.iam.gserviceaccount.com \
  --member="serviceAccount:pothi-api@shravanmeena.iam.gserviceaccount.com" \
  --role=roles/iam.serviceAccountTokenCreator
```

**There are no HMAC keys and no key file.** `gcloud storage hmac create` is refused outright
by the org policy `constraints/iam.disableServiceAccountKeyCreation`, which is the right
answer — a long-lived credential in a `.env` is a credential that leaks. The bucket is
reached through the VM's attached identity instead, so there is nothing to rotate.

No `allUsers` binding, ever. See the note in Step 0.

## Step 5 · Static IP and firewall

```bash
gcloud compute addresses create pothi-ip --region=asia-south1
gcloud compute addresses describe pothi-ip --region=asia-south1 --format='value(address)'
#  ↑ this is the IP you whitelist on MSG91, and the A record for astropothi.com

gcloud compute firewall-rules create pothi-web \
  --allow=tcp:80,tcp:443 --target-tags=pothi
```

Port 4050 is never opened. Caddy is the only thing the internet talks to.

## Step 6 · The VM

```bash
gcloud compute instances create pothi-api \
  --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-balanced \
  --address=pothi-ip --tags=pothi \
  --service-account=pothi-api@shravanmeena.iam.gserviceaccount.com \
  --scopes=cloud-platform

gcloud compute ssh pothi-api
```

`e2-small` is enough — a report costs 0.4–3.4 s of CPU. 30 GB is plenty now that the disk
holds only a cache.

## Step 7 · Docker, Caddy, the SQL proxy — on the VM

```bash
sudo apt-get update && sudo apt-get install -y docker.io git curl \
  debian-keyring debian-archive-keyring apt-transport-https
sudo usermod -aG docker $USER && exec sudo su -l $USER

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy

docker run -d --name sqlproxy --restart unless-stopped --network host \
  gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest \
  --address 127.0.0.1 --port 5432 shravanmeena:asia-south1:pothi-db

docker logs sqlproxy      # expect: "ready for new connections"
```

The proxy is what lets `PG_HOST=127.0.0.1` stay true. No connection-string change, no SSL
config, no code edit.

## Step 8 · Code and `.env`

```bash
git clone git@github.com:ShravanMeena/astropothi.com.git ~/pothi
cd ~/pothi/pothi-api && cp .env.example .env && nano .env
```

```ini
NODE_ENV=production
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DB=pothi
PG_USER=pothi
PG_PASSWORD=<STRONG_PASSWORD>

JWT_SECRET=<openssl rand -hex 32 — not the dev one>
WEB_ORIGIN=https://astropothi.com

# No OTP dispatch yet, so sign-in runs without one. See OPEN-ITEMS #1.
OTP_REQUIRED=false
OTP_BYPASS=2262

GCS_BUCKET=pothi-content
GCS_SIGNED_URL_TTL=900

RAZORPAY_ID=...
RAZORPAY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
MSG91_AUTH_KEY=...
MSG91_WHATSAPP_NUMBER=...
MSG91_NAMESPACE=...
GOOGLE_MAPS_API_KEY=...

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<Bedrock only — GCS needs no keys>
AWS_SECRET_ACCESS_KEY=<Bedrock only — GCS needs no keys>
```

`chmod 600 .env`.

## Step 9 · Create the schema — once

`bin/www.js` deliberately does **not** sync in production, so a fresh Cloud SQL database
stays empty until you say so:

```bash
docker build -t pothi-api .

docker run --rm --network host --env-file .env pothi-api node -e \
  "import('./database/index.js').then(async d => { await d.default.sequelize.sync(); console.log('schema ok'); process.exit(0) })"

docker run --rm --network host --env-file .env pothi-api node scripts/ensure_consumer_reports.js
docker run --rm --network host --env-file .env pothi-api node scripts/ensure_admin.js 9660801827
```

Never run this with `{ alter: true }` against a database that has rows in it — see the
comment in `bin/www.js` about the 402 duplicate unique indexes.

> Build **on the VM**. An image built on Apple Silicon is arm64 and will not run here.
> If you must build on the Mac, `--platform linux/amd64`.

## Step 10 · Run the API

```bash
docker run -d --name pothi-api --restart unless-stopped \
  --network host --env-file .env \
  -v pothi-out:/app/out \
  pothi-api

docker logs -f pothi-api        # expect: [pothi-api] :4050 (production)
curl -s localhost:4050/health
```

## Step 11 · The client, Caddy, DNS

On the Mac:

```bash
cd pothi-app
SITE_ORIGIN=https://astropothi.com npm run build:deploy
gcloud compute scp --recurse dist pothi-api:/tmp/dist
```

`build:deploy` is four steps, and none of them is optional:

| step | what it does | why it must not be skipped |
|---|---|---|
| `build_og.js` | renders `public/og/astropothi-og.png` in headless Chrome | a missing og:image is a grey box in every WhatsApp forward |
| `npm run build` | `prebuild` writes sitemap + robots, then vite builds | with no `SITE_ORIGIN` it writes no sitemap and a Disallow-all robots.txt, on purpose |
| `prerender.js --strict` | loads all 18 public routes in Chrome and writes real HTML | **this is the whole point.** Bing barely runs JavaScript and GPTBot, PerplexityBot and ClaudeBot do not run it at all — without this they see a 1.3KB empty `<div id="root">` |
| `seo_check.js --strict` | 580+ assertions against `dist/` | a dropped route, a stale canonical or a placeholder price all still return 200; nothing else notices |

`postbuild` runs the prerenderer after a plain `npm run build` too, so a build is
never accidentally shipped as a bare shell. `--strict` is what makes it fail the
deploy rather than warn.

The prerenderer needs a Chrome. It looks in the Playwright and Puppeteer caches
and in `/Applications`; set `PUPPETEER_EXECUTABLE_PATH` if it cannot find one. It
also needs the catalogue API for prices and chapter counts — it tries
`localhost:4050` first, then the live site. Override with `PRERENDER_API`.

On the VM:

```bash
sudo rm -rf /var/www/pothi && sudo mkdir -p /var/www/pothi
sudo cp -r /tmp/dist/* /var/www/pothi/

# The Caddyfile lives in the repo at deploy/Caddyfile — copy it, do not retype it.
gcloud compute scp deploy/Caddyfile pothi-api:/tmp/Caddyfile   # from the Mac
sudo cp /tmp/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Four things in that config are load-bearing:

- `try_files {path} {path}/index.html` — serves the prerendered page. With the
  old `try_files {path} /index.html` every URL got the SPA shell and the
  prerendering did nothing.
- `handle_errors` → `404.html` — an unknown path returns a real 404. It used to
  return the homepage with a 200, which is a soft 404 and an unbounded set of
  duplicates.
- The `@private` block serves `app.html` for `/buy/*`, `/order/*`, `/profile`
  and `/astrologers`. Those are never prerendered — an order page snapshot
  would put a buyer's birth details in a file on a public web root — and
  `app.html` carries no canonical, so they cannot claim to be the homepage.
- `www.astropothi.com` redirects to the apex instead of serving it, so the two
  hostnames are not indexed as competing copies.


DNS: `A` records for `astropothi.com` and `www` → the Step 5 address. Caddy fetches the
certificate itself once the record resolves.

## Live state — 20 Aug 2026

Everything below Step 11 is built and running. What is left is listed under
"Still to do" at the end.

| | |
|---|---|
| Project | `shravanmeena`, billing `Main DreamyHook Account` |
| VM | `pothi-api`, `asia-south1-a`, e2-small, **34.14.166.109** |
| Database | `pothi-db`, POSTGRES_16 ENTERPRISE, db-g1-small, backups + PITR on, **0 authorized networks** |
| Bucket | `gs://pothi-content`, private, uniform access |
| Identity | `pothi-api@shravanmeena.iam.gserviceaccount.com` — cloudsql.client, storage.objectAdmin, tokenCreator on itself |
| Schema | 16 tables created, `ensure_consumer_reports.js` applied |
| Domain | **https://astropothi.com** + `www`, Let's Encrypt cert issued, HTTP → HTTPS 308 |

Proven end to end from the public internet: catalogue, SPA deep links, `robots.txt`,
a 16-URL sitemap, and a 58-page Hindi Kundali rendered live in 11 s, rasterised by poppler
and served from `/files`. A round trip through the bucket returns **200 on a signed URL and
403 on the unsigned one**.

Credentials are the development set, copied over deliberately: **Razorpay in TEST mode**,
MSG91 live, Bedrock live, Google Places live (`/location/mode` → `google`, real place ids).
Swap Razorpay for live keys before the first real rupee.

**A stale apex A record will silently halve the site.** Hostinger's parking record
(`2.57.91.91`) survived alongside the new one, so DNS round-robined between the real server
and a parking page — and every ACME challenge failed with `remote error: tls: no
application protocol`, because Let's Encrypt kept landing on the parking IP. Deleting the
old record and restarting Caddy issued both certificates within a minute. Check
`dig +short <domain>` returns exactly ONE address before blaming Caddy.

## Step 12 · The outside world

Each of these needs the live URL or IP, so they come last:

1. **Razorpay → Settings → Webhooks →** `https://astropothi.com/noauth-api/v1/webhook/razorpay`,
   secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment_link.paid`, `payment.captured`,
   `order.paid`. *Until this exists, a buyer who pays and closes the tab is charged and
   never gets a report.*
2. **MSG91 → the auth key → whitelist the Step 5 static IP.**
3. `WEB_ORIGIN` must be final before the WhatsApp template is submitted — the button's base
   URL is frozen at approval.

## Step 13 · Prove it

```bash
curl -s https://astropothi.com/health
curl -s https://astropothi.com/noauth-api/v1/shop/catalogue | head -c 200
curl -sI https://astropothi.com/report/kundli | head -3     # 200 + text/html, not 404
```

Then, by hand: buy one report end to end with a real ₹1 price override, confirm the PDF
opens from `/files/...`, confirm "Read it here" renders pages, and confirm the row landed in
Cloud SQL. Do this before the first ad rupee is spent.

---

## Redeploying

```bash
cd ~/pothi && git pull
cd pothi-api
docker build -t pothi-api . \
  && docker rm -f pothi-api \
  && docker run -d --name pothi-api --restart unless-stopped --network host --env-file .env \
       -v pothi-out:/app/out pothi-api
```

**`docker restart` is not enough after editing `.env`.** `--env-file` is read once, when the
container is created, and baked into it; a restart replays the old values. Nothing errors —
the app simply keeps running with the environment it was born with. That cost us a silent
regression here: with `GOOGLE_MAPS_API_KEY` apparently set, `/location/mode` still answered
`offline`, meaning every birth place was being resolved against the 296 bundled cities. A
village that does not resolve gets the wrong coordinate, and the wrong coordinate moves the
ascendant. Always `docker rm -f` and `docker run` again.

Cloud SQL takes an automatic backup nightly and keeps point-in-time recovery, so there is no
pre-deploy dump ritual. For a schema change, take an on-demand backup first:
`gcloud sql backups create --instance=pothi-db`.

## Rolling back

```bash
docker images pothi-api                       # tag before you rebuild if you want a target
gcloud sql backups list --instance=pothi-db
gcloud sql backups restore <BACKUP_ID> --restore-instance=pothi-db
```

## What this costs

| | approx / month |
|---|---|
| e2-small + 30 GB | ₹1,300 |
| Cloud SQL db-g1-small + 10 GB, PITR | ₹2,200–2,700 |
| GCS 100 GB + egress | ₹200–400 |
| Static IP (attached) | ₹0 |
| **Total** | **₹3,700–4,400** |

Figures are approximate and worth re-checking against the pricing calculator before you
commit to them.

## What to change later, and when

| Trigger | Change |
|---|---|
| Traffic gets spiky | VM → Cloud Run. Nothing durable is on the box any more, so the only remaining blocker is the static egress IP MSG91 needs: Direct VPC egress + Cloud NAT. |
| Two instances | Reader page PNGs are cached per-container. Upload them to GCS as well, or accept one `pdftoppm` per page per instance. |
| Real volume | `db-g1-small` → a dedicated tier, and turn on HA. |
