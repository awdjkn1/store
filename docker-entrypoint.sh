#!/bin/sh
echo "Entrypoint script started"
# docker-entrypoint.sh - prints helpful diagnostics and execs the given command
set -e

echo "---- docker-entrypoint: START ----"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "User: $(id -un) (uid=$(id -u) gid=$(id -g))"
echo "Working dir: $(pwd)"
echo "Node version: $(node --version 2>/dev/null || echo 'node not found')"
echo "NPM version: $(npm --version 2>/dev/null || echo 'npm not found')"
echo "Environment variables (selected):"
echo "  NODE_ENV=${NODE_ENV:-unset}"
echo "  PORT=${PORT:-unset}"
echo "  PWD=$(pwd)"
echo "Environment presence checks (no values shown):"
REQUIRED_VARS="JWT_SECRET ENCRYPTION_KEY JWT_SECRET_ENCRYPTION PG_PASSWORD DATABASE_URL ADMIN_AUTOSEED_PASSWORD"
for v in $REQUIRED_VARS; do
  if [ -z "${!v}" ]; then
    echo "  $v: MISSING"
  else
    echo "  $v: present"
  fi
done
echo "Files in working dir:"
ls -la || true

echo "Checking package.json scripts..."
if [ -f package.json ]; then
  echo "--- package.json scripts ---"
  node -e "console.log(JSON.stringify(require('./package.json').scripts, null, 2))" || true
  echo "----------------------------"
else
  echo "package.json not found"
fi

echo "Health: checking port variable and write access to /app"
if [ -w "." ]; then
  echo "Writable: yes"
else
  echo "Writable: no"
fi

echo "---- docker-entrypoint: running: $@ ----"
sleep 10
exec "$@"

# End of entrypoint
