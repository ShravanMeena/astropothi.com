#!/bin/bash
# Pilot gate: invite required, seats capped, ten free reports, flat 1/report.
API=${API:-http://localhost:4050}
cd "$(dirname "$0")/.."
j() { python3 scripts/jq.py "$1"; }
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✓ $1"; pass=$((pass+1)); else echo "  ✗ $1 — got '$2' want '$3'"; fail=$((fail+1)); fi }
otp() { curl -s -X POST $API/noauth-api/v1/auth/otp/send -H 'content-type: application/json' -d "{\"phone\":\"$1\"}" | j results.dev_otp; }
verify() { curl -s -X POST $API/noauth-api/v1/auth/otp/verify -H 'content-type: application/json' \
    -d "{\"phone\":\"$1\",\"otp\":\"$2\",\"invite_code\":\"$3\"}"; }

# $RANDOM is 1–5 digits, so "90000$RANDOM" truncated to 10 could be short and
# fail phone validation — the test then passed or failed by luck.
P=9$(printf "%09d" $(( (RANDOM * 32768 + RANDOM) % 1000000000 )))
O=$(otp $P)
check "new phone without a code is refused" \
  "$(verify $P $O '' | j needs_invite)" "True"
check "wrong code is refused" \
  "$(verify $P $O WRONGCODE | j message)" "That invite code is not valid."
TOK=$(verify $P $O POTHI10 | j results.token)
check "correct code lets him in" "$([ -n "$TOK" ] && echo yes)" "yes"

A=(-H "authorization: Bearer $TOK" -H 'content-type: application/json')
check "no free reports before branding is complete" \
  "$(curl -s "${A[@]}" $API/api/v1/credits/balance | j results.balance)" "0"

curl -s -X PUT $API/api/v1/branding "${A[@]}" \
  -d '{"display_name":"Test Pandit","phone":"9000000000","logo_url":"https://placehold.co/240x240/png"}' >/dev/null
check "completing branding grants 10 free reports" \
  "$(curl -s "${A[@]}" $API/api/v1/credits/balance | j results.balance)" "10"

curl -s -X POST $API/api/v1/reports/generate "${A[@]}" \
  -d '{"report_type":"kundli","name":"X","dob":"1990-01-01","tob":"10:00","pob":"Delhi","place_id":"local:Delhi|Delhi"}' >/dev/null
check "a 5-credit Premium Kundali costs 1 during the pilot" \
  "$(curl -s "${A[@]}" $API/api/v1/credits/balance | j results.balance)" "9"

check "returning pandit signs in with no code" \
  "$(O2=$(otp $P); verify $P $O2 '' | j results.pilot_seat | grep -q '[0-9]' && echo yes)" "yes"

# Release the seat this run consumed so repeated test runs cannot fill the pilot.
# Quoting here was broken and silently matched nothing, so every run burned a
# real pilot seat until all ten were gone. Fail loudly if the release fails.
released=$(psql -d pothi -t -A -c "DELETE FROM pandits WHERE phone = '$P';" 2>&1)
case "$released" in DELETE\ 1) ;; *) echo "  ! seat release failed: $released";; esac

echo; echo "$pass passed, $fail failed"; exit $((fail>0))
