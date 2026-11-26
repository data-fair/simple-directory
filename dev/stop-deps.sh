#!/usr/bin/env bash
# Stop the dev dependencies started by dev/deps.sh, every profile included.
# The env file is .env, or the one DOTENV_CONFIG_PATH names. The compose project is COMPOSE_PROJECT_NAME, the folder
# name by default.
set -euo pipefail
cd "$(dirname "$0")/.."

env_file=${DOTENV_CONFIG_PATH:-.env}
# a .env link belongs to a larger dev environment that runs this checkout: the folder name may be another checkout's
# project, whose containers must not be stopped from here
if [ -L .env ] && [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
  echo ".env is a link: set COMPOSE_PROJECT_NAME (and DOTENV_CONFIG_PATH=dev/default.env) to stop this checkout's own containers" >&2
  exit 1
fi

docker compose --env-file "$env_file" --profile '*' stop
