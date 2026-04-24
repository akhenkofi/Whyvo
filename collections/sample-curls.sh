#!/usr/bin/env bash
BASE="http://127.0.0.1:8000/api/v1"

curl -s -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Kwame Mensah","phone":"+233201112223","country":"GH","role":"Farmer"}'

echo "\n----"
curl -s -X POST "$BASE/auth/verify-otp" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+233201112223","code":"123456"}'

echo "\n----"
curl -s -X POST "$BASE/farmer-profiles" \
  -H 'Content-Type: application/json' \
  -d '{"user_id":1,"gps_lat":6.69,"gps_lng":-1.62,"farm_size_hectares":3.5,"crops_summary":"{}","livestock_summary":"{}","photo_urls":"[]"}'

echo "\n----"
curl -s "$BASE/admin/metrics"
