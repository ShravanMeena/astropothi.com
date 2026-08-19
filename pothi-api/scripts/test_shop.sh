#!/bin/bash
# Consumer purchase: quote → order → pay → report. No account anywhere.
API=${API:-http://localhost:4050}
cd "$(dirname "$0")/.."
j() { python3 scripts/jq.py "$1"; }
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✓ $1"; pass=$((pass+1)); else echo "  ✗ $1 — got '$2' want '$3'"; fail=$((fail+1)); fi }

check "catalogue is public (no auth)" \
  "$(curl -s -o /dev/null -w '%{http_code}' $API/noauth-api/v1/shop/catalogue)" "200"

BODY='{"report_type":"kundli","design":"heritage","palette":"gold","language":"hi",
  "name":"सुनीता देवी","dob":"1996-11-04","tob":"18:20",
  "pob":"Varanasi, Uttar Pradesh, India","place_id":"local:Varanasi|Uttar Pradesh",
  "gender":"female","buyer_phone":"9812345678","buyer_name":"Sunita","state":"Uttar Pradesh"}'

ORDER=$(curl -s -X POST $API/noauth-api/v1/shop/order -H 'content-type: application/json' -d "$BODY")
PID=$(echo "$ORDER" | j results.public_id)
RZID=$(echo "$ORDER" | j results.razorpay_order_id)
check "order created without an account" "$([ -n "$PID" ] && echo yes)" "yes"

# How this order gets paid depends on whether Razorpay keys are configured:
# with keys it is a hosted payment link settled by webhook, without them it is
# the local dev order id. The test drives whichever one the server built.
LINK=$(psql -d pothi -t -A -c "select coalesce(razorpay_link_id,'') from orders where public_id='$PID';")
settle() {
  if [ -n "$LINK" ]; then
    node scripts/emit_webhook.js "$LINK" "pay_shoptest_$PID" > /dev/null
  else
    curl -s -X POST $API/noauth-api/v1/shop/confirm -H 'content-type: application/json' \
      -d "{\"razorpay_order_id\":\"$RZID\"}" -o /dev/null
  fi
}
check "priced at ₹699 for the 64-chapter kundali" "$(echo "$ORDER" | j results.amount_paise)" "69900"
check "no report before payment" "$(curl -s $API/noauth-api/v1/shop/order/$PID | j results.status)" "created"

settle
# Generation happens after the webhook is acknowledged, so give it a moment.
for i in $(seq 1 40); do
  S=$(curl -s $API/noauth-api/v1/shop/order/$PID)
  [ "$(echo "$S" | j results.status)" = "ready" ] && break
  sleep 0.5
done
check "paid → report generated" "$(echo "$S" | j results.status)" "ready"
check "pdf present" "$(echo "$S" | j results.pdf_url | grep -c pdf)" "1"
check "invoice issued" "$(echo "$S" | j results.invoice_no | grep -c 'POT-C')" "1"

# Idempotency: a second confirm must not bill or generate twice.
BEFORE=$(psql -d pothi -t -A -c "select count(*) from reports where source='consumer';")
settle
sleep 1
check "re-confirm does not generate a second report" \
  "$(psql -d pothi -t -A -c "select count(*) from reports where source='consumer';")" "$BEFORE"

check "unresolvable birth place is refused before payment" \
  "$(curl -s -X POST $API/noauth-api/v1/shop/order -H 'content-type: application/json' \
     -d '{"report_type":"kundli","name":"X","dob":"1990-01-01","tob":"10:00","pob":"zzz nowhere","buyer_phone":"9812345678"}' | j success)" "False"

# The white-label wall: a consumer report must never carry a pandit's name.
PDF=$(psql -d pothi -t -A -c "select pdf_url from reports where source='consumer' order by id desc limit 1;")
F="out${PDF#/files}"
if [ -f "$F" ]; then
  pdftotext -q "$F" /tmp/_c.txt
  check "consumer report carries no pandit branding" \
    "$(grep -c 'Ramesh Chandra Shastri\|Shri Ganesh Jyotish' /tmp/_c.txt)" "0"
  # Read the brand from config rather than hardcoding it — renaming the brand
  # should not break the test that proves the brand is applied.
  BRAND=$(curl -s $API/noauth-api/v1/shop/brand | j results.name)
  check "consumer report carries the house brand ($BRAND)" \
    "$(grep -ci "$BRAND" /tmp/_c.txt | awk '{print ($1>0)?1:0}')" "1"
fi

# The storefront's SAMPLE must also carry the house imprint — a shopper seeing a
# stranger's name on the product shot is the same bug one step earlier.
curl -s "$API/noauth-api/v1/shop/report/kundli?design=heritage&palette=gold" -o /dev/null
SP=$(ls -d out/previews/*_house__* 2>/dev/null | head -1)
if [ -n "$SP" ]; then
  pdftotext -q "$SP/sample.pdf" /tmp/_sp.txt
  check "storefront sample shows no pandit name" \
    "$(grep -c 'Ramesh Chandra\|Ganesh Jyotish' /tmp/_sp.txt)" "0"
  check "storefront sample shows the house brand" \
    "$(grep -ci "$BRAND" /tmp/_sp.txt | awk '{print ($1>0)?1:0}')" "1"
fi

echo; echo "$pass passed, $fail failed"; exit $((fail>0))
