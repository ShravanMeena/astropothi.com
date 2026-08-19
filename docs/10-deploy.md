# 10 · Deploying the API to GCP

Server only. The client is a static build and comes later.

## What the server actually needs

Three constraints decide the architecture. Two of them break a naive deploy:

1. **poppler-utils.** `preview.service.js` and `reader.service.js` shell out to `pdftoppm`
   and `pdftotext`. Without them, every sample image and every "Read it here" returns
   nothing — with no error. The `Dockerfile` installs it.
2. **A writable disk that survives restarts.** Generated PDFs, preview images and reader
   pages are written to `pothi-api/out/`. On an ephemeral filesystem every past order loses
   its PDF the moment the container restarts. Until S3/GCS is wired up, this must be a real
   disk.
3. **A static outbound IP.** MSG91 auth keys are IP-whitelisted. A VM has one by default; on
   Cloud Run you would need a VPC connector plus Cloud NAT to get the same thing.

Fonts are vendored (`engine/assets/fonts/*.ttf`), so no system font package is needed.

## Why a VM, not Cloud Run

Cloud Run is the better long-term answer and the wrong first move here. Its filesystem is
ephemeral, which breaks constraint 2 today, and a static egress IP costs extra plumbing.

**Start with one Compute Engine VM in `asia-south1` (Mumbai)** — closest region to your
customers — and move to Cloud Run + Cloud SQL + GCS when there is revenue to protect.

```
┌─ e2-small VM · asia-south1 · static IP ────────┐
│  Caddy      :443  TLS, auto Let's Encrypt      │
│    └─ Docker :4050  pothi-api                  │
│         └─ /app/out → persistent disk          │
│  PostgreSQL 16  (same box, localhost:5432)     │
└────────────────────────────────────────────────┘
```

## The database

Postgres 16, database name `pothi`, **12 tables**, created by Sequelize. See
[03-architecture.md](03-architecture.md) for the schema.

In development the app calls `sequelize.sync({ alter: true })` on boot, which creates and
migrates the schema for you. **That is a development convenience and must not be relied on
in production** — `alter: true` will happily drop a column it thinks is unused. For the
first deploy it is acceptable because the database is empty; after that, take a dump before
every deploy.

Two options:

| | Postgres on the VM | Cloud SQL |
|---|---|---|
| Cost | ₹0 (part of the VM) | ~₹2,000+/month for the smallest usable tier |
| Backups | your job — `pg_dump` to GCS, below | automated, point-in-time recovery |
| If the VM dies | data dies with it | data survives |

**Start on the VM.** You have no customers yet and no data worth ₹2,000/month. Move to
Cloud SQL before you take real money — not after.

---

## Steps

### 1 · Project, IP, firewall

```bash
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>
gcloud config set compute/region asia-south1

gcloud compute addresses create pothi-ip --region=asia-south1
gcloud compute addresses describe pothi-ip --region=asia-south1 --format='value(address)'
#   ↑ note this down. It is the IP you whitelist on MSG91.

gcloud compute firewall-rules create pothi-web \
  --allow=tcp:80,tcp:443 --target-tags=pothi --description="HTTP/S to the API"
```

Port 4050 is deliberately **not** opened. Caddy is the only thing the internet talks to.

### 2 · The VM

```bash
gcloud compute instances create pothi-api \
  --zone=asia-south1-a --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-balanced \
  --address=pothi-ip --tags=pothi

gcloud compute ssh pothi-api --zone=asia-south1-a
```

`e2-small` (2 vCPU burstable, 2 GB) is enough: report generation takes 0.4–3.4 s of CPU and
the traffic is low. Approximately ₹1,300/month.

### 3 · Docker, Postgres, Caddy — on the VM

```bash
sudo apt-get update && sudo apt-get install -y \
  docker.io git postgresql postgresql-contrib debian-keyring debian-archive-keyring apt-transport-https curl
sudo usermod -aG docker $USER && exec sudo su -l $USER   # so docker works without sudo

# Caddy — terminates TLS and gets certificates on its own
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

### 4 · The database

```bash
sudo -u postgres psql -c "CREATE USER pothi WITH PASSWORD '<STRONG_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE pothi OWNER pothi;"
```

Postgres listens on localhost only by default. Leave it that way.

### 5 · Code and configuration

```bash
git clone https://github.com/<you>/<repo>.git ~/pothi
cd ~/pothi/pothi-api
cp .env.example .env && nano .env
```

The values that must change from development:

```ini
NODE_ENV=production
PG_HOST=localhost
PG_USER=pothi
PG_PASSWORD=<STRONG_PASSWORD>
PG_DB=pothi

JWT_SECRET=<a long random string — not the dev one>
WEB_ORIGIN=https://api.yourdomain.com     # or the site domain once the client is up

RAZORPAY_ID=...
RAZORPAY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...               # must match the Razorpay dashboard

MSG91_AUTH_KEY=...
MSG91_WHATSAPP_NUMBER=...
MSG91_NAMESPACE=...

OTP_BYPASS=                                # MUST be empty. config.js also nulls it in production.
```

### 6 · Build and run

```bash
docker build -t pothi-api .
docker run -d --name pothi-api --restart unless-stopped \
  --network host \
  --env-file .env \
  -v /var/lib/pothi-out:/app/out \
  pothi-api

docker logs -f pothi-api      # expect: [db] synced → pothi   /   [pothi-api] :4050
```

`--network host` lets the container reach Postgres on `localhost`. The volume is what keeps
generated PDFs alive across restarts.

> Build **on the VM**, not on your Mac. Apple Silicon produces an arm64 image that will not
> run on GCP's x86 hosts. If you ever do build locally, use `--platform linux/amd64`.

### 7 · TLS and the domain

Point an `A` record for `api.yourdomain.com` at the static IP, then:

```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
api.yourdomain.com {
    reverse_proxy localhost:4050
}
CADDY
sudo systemctl reload caddy
```

Caddy fetches a Let's Encrypt certificate by itself. Verify:

```bash
curl -s https://api.yourdomain.com/noauth-api/v1/shop/catalogue | head -c 120
```

### 8 · Wire up the outside world

Only now do these, because each needs the live URL or IP:

1. **Razorpay → Settings → Webhooks → Add**
   URL `https://api.yourdomain.com/noauth-api/v1/webhook/razorpay`,
   secret = `RAZORPAY_WEBHOOK_SECRET`,
   events `payment_link.paid`, `payment.captured`, `order.paid`.
   **Until this exists, a buyer who pays and closes the tab is charged and gets nothing.**
2. **MSG91 → the auth key → whitelist the static IP** from step 1.
3. **`WEB_ORIGIN`** must be the final domain before you submit the WhatsApp template — the
   button's base URL is frozen at approval.

### 9 · Backups — do this on day one

Postgres on the VM has no safety net until you give it one.

```bash
gcloud storage buckets create gs://pothi-backups --location=asia-south1

sudo tee /usr/local/bin/pothi-backup >/dev/null <<'SH'
#!/bin/bash
set -e
f=/tmp/pothi-$(date +%F).sql.gz
sudo -u postgres pg_dump pothi | gzip > "$f"
gcloud storage cp "$f" gs://pothi-backups/ && rm "$f"
SH
sudo chmod +x /usr/local/bin/pothi-backup
echo "0 3 * * * /usr/local/bin/pothi-backup" | sudo crontab -
```

Generated PDFs in `/var/lib/pothi-out` are **not** backed up by this. They can be
regenerated from the order rows, which is why the database matters more.

## Redeploying

```bash
cd ~/pothi && git pull
cd pothi-api
sudo -u postgres pg_dump pothi | gzip > ~/pre-deploy-$(date +%F-%H%M).sql.gz   # always
docker build -t pothi-api . && docker rm -f pothi-api && docker run -d ... # as above
```

## What to move to next, and when

| Trigger | Change |
|---|---|
| Real money is flowing | Postgres → **Cloud SQL** with automated backups |
| PDFs outgrow the disk, or you want a second instance | `out/` → **GCS**, and fix `reader.service.js`, which today refuses any non-local `pdf_url` |
| Traffic becomes spiky | VM → **Cloud Run**, with a VPC connector + Cloud NAT to keep the static IP MSG91 needs |

---

## The client build: SITE_ORIGIN, sitemap and robots

`npm run build` in `pothi-app` runs `scripts/build_sitemap.js` first (a `prebuild` hook), which
writes `public/sitemap.xml` and `public/robots.txt` into the bundle.

**It will not guess the domain.** With no `SITE_ORIGIN` set it writes *no* sitemap and a
`robots.txt` that disallows everything, then warns. That is deliberate: a sitemap full of
`http://localhost:5190` submitted to Search Console is worse than no sitemap, and a preview
build that gets indexed is worse still.

```bash
SITE_ORIGIN=https://your-domain npm run build     # real sitemap + crawlable robots
npm run sitemap -- --strict                       # exit 1 instead of warning — use in CI
```

Put `--strict` in the deploy pipeline. A production build that silently shipped
`Disallow: /` would deindex the whole site, and the failure is invisible until traffic drops.

**The URL list is generated, never typed.** Report pages come from `SELLABLE` in
`pothi-api/server/catalog/catalog.js`, and the policy pages from `LEGAL_SLUGS` in
`pothi-app/src/lib/route.ts`. Adding a report or a policy page puts it in the sitemap with no
second edit — which is the only way the two stay in agreement.

`/buy/*`, `/order/*`, `/profile` and `/astrologers` are excluded from the sitemap and disallowed
in robots.txt: transactional, private, and staff-only respectively.

> The generator reads `pothi-api` by relative path, so the two repos must be checked out side
> by side. If they are not, it fails loudly rather than emitting a sitemap missing every report.
