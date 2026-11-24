#!/usr/bin/env bash
# Start the dev dependencies (nginx, mongo, maildev, ldap) with docker compose.
# Usage: npm run dev-deps [-- <docker compose args, e.g. --profile events>]
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp dev/default.env .env
  echo "created .env from dev/default.env (edit .env to override, it is never overwritten)"
fi

# generated types and ui build needed by the api, the ui and the tests, built once
npm run dev-setup

docker compose --progress quiet "$@" up -d --wait
