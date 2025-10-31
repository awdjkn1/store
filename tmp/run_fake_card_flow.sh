#!/usr/bin/env bash
set -euo pipefail
TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhY2QwYzY1LTUwMzMtNGY3Zi1iN2E5LTdiNTNhN2VlMDAyNyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYxNzI3MzI4LCJleHAiOjE3NjIzMzIxMjh9.eaup-4K18ZciTrLbvEkefxaHtdINklxs1Cv-GWD8Pw4'
OUT="outputs/fake_card_flow_test_$(date -u +%Y-%m-%dT%H-%M-%SZ).txt"
mkdir -p outputs
echo "Fake card payment test run - $(date -u --rfc-3339=seconds)" > "$OUT"
echo "Server: http://localhost:5000" >> "$OUT"

echo "=== 1) POST /api/payments/card/initiate ===" >> "$OUT"
# 2FA is no longer required; directly call card initiate
curl -s -X POST "http://localhost:5000/api/payments/card/initiate" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"amount":49.99,"currency":"USD"}' -o /tmp/card_step3.json
cat /tmp/card_step3.json >> "$OUT"

echo "" >> "$OUT"
echo "=== Server last 200 lines of backend/server.log ===" >> "$OUT"
tail -n 200 backend/server.log >> "$OUT" 2>&1 || true

echo "Saved test transcript to $OUT"
cat "$OUT"
