# 11 · Redeploying, and keeping it alive

[10-deploy.md](10-deploy.md) built the thing once. This is the document you use every time
after that.

Everything here runs from the repository root on your laptop, and assumes
`gcloud auth login` is current — the tokens expire, and an expired token looks like a
network error rather than a login problem.

---

## The whole thing, most days

```bash
./deploy.sh
```

Builds the site, ships both halves, rebuilds the image on the VM, recreates the container,
and prints a live check. About ninety seconds.

| Command | What moves | Reach for it when |
|---|---|---|
| `./deploy.sh` | server + site | you changed both, or you are not sure |
| `./deploy.sh api` | server only | route, service, engine or schema change |
| `./deploy.sh web` | site only | anything under `pothi-app/src` |
| `./deploy.sh env` | nothing — recreates the container | you edited `.env` on the VM |
| `./deploy.sh status` | nothing | "is it up?" |
| `./deploy.sh logs` | nothing | something is wrong and you want to watch it |

The script refuses to continue when `npm run typecheck` fails, and when the built
`robots.txt` is not crawlable. Both of those are silent disasters if they ship.

---

## The three things that will bite you

**1 · `docker restart` does not reload `.env`.**
`--env-file` is read once, when the container is *created*, and baked into it. A restart
replays the values the container was born with and reports success. This already cost us
one: `GOOGLE_MAPS_API_KEY` was present in the file, the config dump said it was set, and
`/location/mode` still answered `offline` — every birth place resolving against the 296
bundled cities instead of Google. A village that does not resolve gets the wrong
coordinate, and the wrong coordinate moves the ascendant. **Always recreate:**

```bash
gcloud compute ssh pothi-api --zone=asia-south1-a --command="nano ~/pothi/pothi-api/.env"
./deploy.sh env
```

**2 · Never build the image on the Mac.**
Apple Silicon produces an arm64 image that will not run on GCP's x86 hosts. `deploy.sh`
builds on the VM. If you ever run `docker build` by hand from the laptop, pass
`--platform linux/amd64`.

**3 · `SITE_ORIGIN` is not optional.**
`npm run build` runs `scripts/build_sitemap.js` first, and it will not guess the domain.
With no `SITE_ORIGIN` it writes *no* sitemap and a `robots.txt` that disallows everything.
A production build that shipped `Disallow: /` deindexes the whole site and the failure is
invisible until traffic drops. `deploy.sh` sets it and then checks the output.

---

## `.env` on the VM

The production `.env` lives only on the VM, at `~/pothi/pothi-api/.env`, mode 600. It is
**excluded from the deploy tarball on purpose** — otherwise a laptop's development
credentials would overwrite production the first time somebody deployed in a hurry.

```bash
gcloud compute ssh pothi-api --zone=asia-south1-a --command="nano ~/pothi/pothi-api/.env"
./deploy.sh env
```

Two switches worth knowing where to find:

| | |
|---|---|
| `OTP_REQUIRED=false` | sign-in works without an OTP being delivered. **Anyone who types a number is signed in as that number.** Flip to `true` the day MSG91 dispatch ships — see OPEN-ITEMS #1. |
| `PILOT_MODE=true` | `/astrologers` is invite-only. Code is `PILOT_INVITE_CODE`, 10 seats. |

---

## Making somebody an admin

`is_admin` is deliberately not reachable from any route — promoting somebody is a shell
action, so there is no endpoint to get wrong.

**The phone must have signed in at `/astrologers` first.** The script refuses to create the
account, because a typo would otherwise mint staff access against a number nobody owns.

```bash
# 1. they sign in at https://astropothi.com/astrologers  (invite code needed while the pilot is on)
# 2. then:
gcloud compute ssh pothi-api --zone=asia-south1-a --command=\
"cd ~/pothi/pothi-api && sudo docker run --rm --network host --env-file .env pothi-api \
 node scripts/ensure_admin.js 9660801827"

# revoke:      ... ensure_admin.js 9660801827 off
# list admins: ... ensure_admin.js
```

They must sign in **again** after the grant — the admin token is issued at sign-in, so the
token in their browser from before the grant is still an ordinary pandit token.

---

## Schema changes

Production does **not** sync on boot (`bin/www.js` skips it deliberately), so a new column
does not appear by deploying. Write an idempotent script beside
`scripts/ensure_consumer_reports.js` and run it:

```bash
gcloud sql backups create --instance=pothi-db            # first, always
./deploy.sh api
gcloud compute ssh pothi-api --zone=asia-south1-a --command=\
"cd ~/pothi/pothi-api && sudo docker run --rm --network host --env-file .env pothi-api \
 node scripts/your_migration.js"
```

Never run `sync({ alter: true })` against a database with rows in it. Sequelize cannot tell
an existing UNIQUE constraint from one it still needs to create, so every boot adds another
— that is how the development database ended up with 402 identical unique indexes on
`orders.public_id`, each one written on every insert.

---

## When something breaks

```bash
./deploy.sh logs                                  # API, live
gcloud compute ssh pothi-api --zone=asia-south1-a --command="sudo journalctl -u caddy -n 50 --no-pager"
gcloud compute ssh pothi-api --zone=asia-south1-a --command="sudo docker logs --tail 50 sqlproxy"
```

| Symptom | Almost always |
|---|---|
| Site loads, every API call 404s in the browser | a namespace missing from the `@api` matcher in `/etc/caddy/Caddyfile` — the SPA catch-all answered instead, with a 200 |
| `502` from every API path | the `pothi-api` container is down; `./deploy.sh logs` |
| API up, database errors | the `sqlproxy` container died. `sudo docker start sqlproxy` |
| Certificate will not issue | DNS. `dig +short astropothi.com` must return **exactly one** address. A leftover parking record round-robins ACME onto the wrong host |
| A setting in `.env` seems ignored | you restarted instead of recreating. See gotcha 1 |
| PDFs 403 | the service account lost `roles/iam.serviceAccountTokenCreator` on itself; signed URLs cannot be minted |

---

## Rolling back

The image is rebuilt in place, so tag one before a risky deploy if you want a target:

```bash
gcloud compute ssh pothi-api --zone=asia-south1-a --command="sudo docker tag pothi-api pothi-api:known-good"
# ...and to go back:
gcloud compute ssh pothi-api --zone=asia-south1-a --command=\
"sudo docker rm -f pothi-api; cd ~/pothi/pothi-api && sudo docker run -d --name pothi-api \
 --restart unless-stopped --network host --env-file .env pothi-api:known-good"
```

The database is a separate question. Cloud SQL takes a nightly backup and keeps
point-in-time recovery, so there is no pre-deploy dump ritual:

```bash
gcloud sql backups list --instance=pothi-db
gcloud sql backups restore <BACKUP_ID> --restore-instance=pothi-db
```

---

## Where everything is

| | |
|---|---|
| Site | https://astropothi.com (`www` too) |
| VM | `pothi-api` · `asia-south1-a` · **34.14.166.109**, static — this is also the egress IP MSG91 whitelists |
| Code on the VM | `~/pothi/pothi-api` |
| Site on the VM | `/var/www/pothi` |
| Caddy | `/etc/caddy/Caddyfile` |
| Database | Cloud SQL `pothi-db`, reached only through the `sqlproxy` container on `127.0.0.1:5432` |
| PDFs | `gs://pothi-content`, private; `/files/reports/*` redirects to a 15-minute signed URL |
| Cache on disk | `~/pothi/pothi-api/out` — previews and reader pages. Safe to delete; it rebuilds |

## Deploying from the working tree

`deploy.sh` copies the working tree, not a commit. **What ships is whatever is on your
laptop, committed or not.** That is a deliberate choice for now — one person, and a commit
requirement in the way of a hotfix helps nobody.

What it costs: nothing records what is running. So the script prints it before every ship —

```
→ Packing the server
   branch main @ 02a956d + 23 uncommitted file(s)
```

If that number is large and you do not know why, look before you deploy.

**Revisit this the moment a second person touches the server.** Two working trees deploying
over each other has no way to tell you it happened, and no way back. The change is small:
put a read-only deploy key on the VM and swap `ship_api`'s tar for `git pull`. Nothing else
in the script moves.
