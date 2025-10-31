#!/usr/bin/env bash
set -euo pipefail
TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhY2QwYzY1LTUwMzMtNGY3Zi1iN2E5LTdiNTNhN2VlMDAyNyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYxNzI3MzI4LCJleHAiOjE3NjIzMzIxMjh9.eaup-4K18ZciTrLbvEkefxaHtdINklxs1Cv-GWD8Pw4'
OUT="outputs/fake_bank_flow_test_$(date -u +%Y-%m-%dT%H-%M-%SZ).txt"
mkdir -p outputs
echo "Fake bank-transfer test run - $(date -u --rfc-3339=seconds)" > "$OUT"
echo "Server: http://localhost:5000" >> "$OUT"

echo "Bank transfer flow has been removed from the server. This script is deprecated." >> "$OUT"
echo "If you need to test card or crypto flows, use the corresponding scripts in tmp/." >> "$OUT"
echo "Exiting." >> "$OUT"
echo "Saved test transcript to $OUT"
cat "$OUT"
exit 0

echo "" >> "$OUT"
echo "=== Server last 200 lines of backend/server.log ===" >> "$OUT"
tail -n 200 backend/server.log >> "$OUT" 2>&1 || true

echo "Saved test transcript to $OUT"
cat "$OUT"
