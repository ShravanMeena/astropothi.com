#!/usr/bin/env bash
#
# Ship Pothi to the production VM.
#
#   ./deploy.sh          server + site
#   ./deploy.sh api      server only
#   ./deploy.sh web      site only
#   ./deploy.sh env      after editing .env on the VM
#   ./deploy.sh status   what is live right now
#   ./deploy.sh logs     tail the API log
#
# See docs/11-redeploy.md for what each one actually does and when it is wrong.
set -euo pipefail

VM=pothi-api
ZONE=asia-south1-a
DOMAIN=https://astropothi.com
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="${TMPDIR:-/tmp}/pothi-deploy.$$"

say()  { printf '\n\033[1m→ %s\033[0m\n' "$*"; }
ssh_() { gcloud compute ssh "$VM" --zone="$ZONE" --quiet --command="$1"; }
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
mkdir -p "$TMP"

build_web() {
  say "Building the site"
  provenance
  cd "$HERE/pothi-app"
  npm run typecheck
  # prebuild writes sitemap.xml + robots.txt, and REFUSES to guess the domain:
  # with no SITE_ORIGIN it ships robots.txt Disallow:/ and deindexes the site.
  SITE_ORIGIN="$DOMAIN" npm run build
  grep -q '^Allow: /' dist/robots.txt || { echo "robots.txt is not crawlable — aborting"; exit 1; }
  tar -czf "$TMP/dist.tgz" -C dist .
}

ship_web() {
  say "Shipping the site"
  gcloud compute scp "$TMP/dist.tgz" "$VM:/tmp/dist.tgz" --zone="$ZONE" --quiet
  # Replace wholesale rather than overlay: a file deleted in this build must not
  # survive on the server, or an old hashed asset lingers and nobody notices.
  ssh_ "sudo rm -rf /var/www/pothi && sudo mkdir -p /var/www/pothi && sudo tar -xzf /tmp/dist.tgz -C /var/www/pothi && rm -f /tmp/dist.tgz"
}

# Deploys are made from the working tree, not from a commit — a deliberate choice
# while this is a one-person project. The cost is that "what is deployed" is not
# recorded anywhere, so say it out loud instead of leaving it to be guessed.
provenance() {
  cd "$HERE"
  git rev-parse --git-dir >/dev/null 2>&1 || return 0
  local n
  n=$(git status --porcelain | wc -l | tr -d ' ')
  printf '   branch %s @ %s' "$(git rev-parse --abbrev-ref HEAD)" "$(git rev-parse --short HEAD)"
  [ "$n" -gt 0 ] && printf ' + %s uncommitted file(s)' "$n"
  printf '\n'
}

ship_api() {
  say "Packing the server"
  provenance
  cd "$HERE"
  tar --exclude='node_modules' --exclude='out' --exclude='.git' --exclude='dist' \
      --exclude='.env' -czf "$TMP/api.tgz" pothi-api

  say "Shipping the server"
  gcloud compute scp "$TMP/api.tgz" "$VM:/tmp/api.tgz" --zone="$ZONE" --quiet
  # .env is excluded from the tarball above, so production credentials are never
  # overwritten by whatever happens to be on the laptop.
  ssh_ "tar -xzf /tmp/api.tgz -C ~/pothi && rm -f /tmp/api.tgz && ls ~/pothi/pothi-api/.env"

  say "Building the image on the VM"
  # Never build this on a Mac: Apple Silicon produces arm64, which will not run here.
  ssh_ "cd ~/pothi/pothi-api && sudo docker build -t pothi-api . | tail -3"
  restart_api
}

restart_api() {
  say "Recreating the container"
  # rm + run, never restart. --env-file is read once at creation and baked in, so
  # a restart silently replays the old environment. That is how GOOGLE_MAPS_API_KEY
  # looked set while every birth place was resolving against the 296-city fallback.
  ssh_ "cd ~/pothi/pothi-api \
     && sudo docker rm -f pothi-api >/dev/null 2>&1 || true; \
        cd ~/pothi/pothi-api && sudo docker run -d --name pothi-api --restart unless-stopped \
          --network host --env-file .env pothi-api >/dev/null \
     && sleep 8 && sudo docker logs --tail 3 pothi-api"
}

status() {
  say "Live check"
  printf 'health     %s\n' "$(curl -s -m 25 "$DOMAIN/health")"
  printf 'home       %s\n' "$(curl -s -m 25 -o /dev/null -w '%{http_code}' "$DOMAIN/")"
  printf 'catalogue  %s\n' "$(curl -s -m 25 -o /dev/null -w '%{http_code}' "$DOMAIN/noauth-api/v1/shop/catalogue")"
  printf 'deep link  %s\n' "$(curl -s -m 25 -o /dev/null -w '%{http_code}' "$DOMAIN/report/kundli")"
  printf 'places     %s\n' "$(curl -s -m 25 "$DOMAIN/noauth-api/v1/location/mode")"
  ssh_ "sudo docker ps --format '{{.Names}}  {{.Status}}'"
}

case "${1:-all}" in
  all)    build_web; ship_api; ship_web; status ;;
  api)    ship_api; status ;;
  web)    build_web; ship_web; status ;;
  env)    restart_api; status ;;
  status) status ;;
  logs)   ssh_ "sudo docker logs -f --tail 80 pothi-api" ;;
  *)      echo "usage: ./deploy.sh [all|api|web|env|status|logs]"; exit 1 ;;
esac

say "Done"
