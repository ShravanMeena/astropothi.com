#!/bin/bash
# End-to-end: login -> branding -> trial credits -> generate -> earnings.
set -e
API=${API:-http://localhost:4050}
PHONE=${PHONE:-9660801827}
J="python3 $(dirname $0)/jq.py"
AUTH() { echo "authorization: Bearer $TOK"; }

echo "1. request OTP for $PHONE"
OTP=$(curl -s -X POST $API/noauth-api/v1/auth/otp/send -H 'content-type: application/json' \
  -d "{\"phone\":\"$PHONE\"}" | $J results.dev_otp)
echo "   dev otp = $OTP"

echo "2. verify -> token"
TOK=$(curl -s -X POST $API/noauth-api/v1/auth/otp/verify -H 'content-type: application/json' \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"$OTP\"}" | $J results.token)
echo "   ${TOK:0:32}..."

echo "3. balance before branding is complete"
echo "   $(curl -s -H "$(AUTH)" $API/api/v1/credits/balance | $J results.balance) credits"

echo "4. complete branding profile -> releases trial credits"
BAL=$(curl -s -X PUT $API/api/v1/branding -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"honorific":"Pt.","display_name":"Ramesh Chandra Shastri","shop_name":"Shri Ganesh Jyotish Karyalaya",
       "phone":"9660801827","whatsapp":"9660801827","address":"Trimbakeshwar, Nashik, Maharashtra",
       "logo_url":"https://placehold.co/240x240/png","tagline":"Vedic Jyotish since 1978",
       "default_language":"en","default_design":"heritage","default_palette":"gold"}' | $J results.balance)
echo "   balance = $BAL credits"

echo "5. set his own selling prices (kundli Rs500, love Rs300)"
curl -s -X PUT $API/api/v1/earnings/prices -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"prices":[{"report_type":"kundli","sale_price_paise":50000},{"report_type":"love","sale_price_paise":30000}]}' >/dev/null

echo "6. generate Premium Kundali — heritage design, gold palette"
curl -s -X POST $API/api/v1/reports/generate -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"report_type":"kundli","design":"heritage","palette":"gold","language":"en","name":"Anjali Verma","dob":"1996-11-04",
       "tob":"18:20","pob":"Nashik, Maharashtra","lat":19.9975,"lon":73.7898,"gender":"female",
       "client_phone":"9812345678"}' | $J results

echo "7. generate Love report — editorial design, crimson palette"
curl -s -X POST $API/api/v1/reports/generate -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"report_type":"love","design":"editorial","palette":"crimson","language":"en","name":"Anjali Verma","dob":"1996-11-04",
       "tob":"18:20","lat":19.9975,"lon":73.7898,"gender":"female"}' | $J results.balance \
  | xargs -I{} echo "   ok, balance now {}"

echo "8. try a report he cannot afford (kundli = 5, has 3)"
curl -s -X POST $API/api/v1/reports/generate -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"report_type":"kundli","name":"X","dob":"1990-01-01","tob":"10:00","lat":19.9,"lon":73.7}'

echo -e "\n9. varshaphal (40 chapters) — was truncating to 6 pages, now renders in full"
curl -s -X POST $API/api/v1/reports/generate -H "$(AUTH)" -H 'content-type: application/json' \
  -d '{"report_type":"varshaphal","name":"X","dob":"1990-01-01","tob":"10:00","lat":19.9,"lon":73.7}'

echo -e "\n10. earnings dashboard"
curl -s -H "$(AUTH)" $API/api/v1/earnings/summary | $J results

echo "11. client book (the vahi)"
curl -s -H "$(AUTH)" $API/api/v1/clients | python3 -c "import sys,json;[print('   ',c['name'],c['dob'],c['phone'] or '') for c in json.load(sys.stdin)['results']]"
