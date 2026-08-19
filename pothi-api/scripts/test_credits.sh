#!/bin/bash
# Credit-flow safety tests. The money path — run this before any change to
# credits/purchase/confirm. Requires a running API and a clean-ish DB.
API=${API:-http://localhost:4050}
cd "$(dirname "$0")/.."
j() { python3 scripts/jq.py "$1"; }
# Carries the pilot invite code so a second test account can be created while
# PILOT_MODE is on. Harmless when the pilot is off — the field is ignored.
INVITE=${PILOT_INVITE_CODE:-POTHI10}
login() { local p=$1
  local o=$(curl -s -X POST $API/noauth-api/v1/auth/otp/send -H 'content-type: application/json' -d "{\"phone\":\"$p\"}" | j results.dev_otp)
  curl -s -X POST $API/noauth-api/v1/auth/otp/verify -H 'content-type: application/json' \
    -d "{\"phone\":\"$p\",\"otp\":\"$o\",\"invite_code\":\"$INVITE\"}" | j results.token; }

TOK=$(login 9660801827); A=(-H "authorization: Bearer $TOK" -H 'content-type: application/json')
bal() { curl -s "${A[@]}" $API/api/v1/credits/balance | j results.balance; }
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✓ $1"; pass=$((pass+1)); else echo "  ✗ $1 — got '$2', want '$3'"; fail=$((fail+1)); fi }

START=$(bal)
ORD=$(curl -s -X POST $API/api/v1/credits/purchase "${A[@]}" -d '{"credits":100}' | j results.order_id)
check "purchase alone credits nothing" "$(bal)" "$START"

check "confirm credits once" "$(curl -s -X POST $API/api/v1/credits/confirm "${A[@]}" -d "{\"razorpay_order_id\":\"$ORD\"}" | j results.credited)" "True"
AFTER=$(bal); check "balance rose by 100" "$AFTER" "$((START+100))"

for i in 1 2 3 4 5; do curl -s -X POST $API/api/v1/credits/confirm "${A[@]}" -d "{\"razorpay_order_id\":\"$ORD\"}" -o /dev/null & done; wait
check "5 concurrent replays do not double-credit" "$(bal)" "$AFTER"

for i in 1 2 3; do curl -s -X POST $API/api/v1/credits/purchase "${A[@]}" -d '{"credits":500}' -o /dev/null; done
check "abandoned orders never credit" "$(bal)" "$AFTER"

TOK2=$(login 9000000001)
check "cross-account settle blocked" \
  "$(curl -s -X POST $API/api/v1/credits/confirm -H "authorization: Bearer $TOK2" -H 'content-type: application/json' -d "{\"razorpay_order_id\":\"$ORD\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["message"])')" \
  "Order not found"

check "below-minimum rejected" \
  "$(curl -s -X POST $API/api/v1/credits/purchase "${A[@]}" -d '{"credits":5}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["success"])')" "False"
check "above-maximum rejected" \
  "$(curl -s -X POST $API/api/v1/credits/purchase "${A[@]}" -d '{"credits":99999}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["success"])')" "False"

echo; echo "$pass passed, $fail failed"; exit $((fail>0))
