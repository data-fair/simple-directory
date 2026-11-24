#!/usr/bin/env bash
# Start the dev dependencies (nginx, mongo, maildev, ldap) with docker compose.
# Usage: npm run dev-deps [-- <docker compose args, e.g. --profile events>]
# The env file is .env, or the one DOTENV_CONFIG_PATH names. The compose project is COMPOSE_PROJECT_NAME, the folder
# name by default.
set -euo pipefail
cd "$(dirname "$0")/.."

env_file=${DOTENV_CONFIG_PATH:-.env}
if [ "$env_file" = .env ] && [ ! -e .env ] && [ ! -L .env ]; then
  cp dev/default.env .env
  echo "created .env from dev/default.env (edit .env to override, it is never overwritten)"
fi
# a .env link belongs to a larger dev environment that runs this checkout: these containers need a project name of
# their own, the folder name may be another checkout's
if [ -L .env ] && [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
  echo ".env is a link: set COMPOSE_PROJECT_NAME (and DOTENV_CONFIG_PATH=dev/default.env) to start this checkout's own containers" >&2
  exit 1
fi

# generated types and ui build needed by the api, the ui and the tests, built once
npm run dev-setup

docker compose --env-file "$env_file" --progress quiet "$@" up -d --wait
