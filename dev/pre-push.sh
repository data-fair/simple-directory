#!/usr/bin/env bash
# The light pre-push gate, run by .husky/pre-push (lint already ran in pre-commit). The full
# gate (static checks + the whole unit/api/inproc/e2e suite) runs on pull requests, releases and
# nightly on master; `npm run quality` still runs it locally on demand.
#
# api/e2e tests need the dev env up (npx --no df-dev status).
set -euo pipefail
cd "$(dirname "$0")/.."

npm run check-types

npm run test -- --project=unit --max-failures=1

# the smoke set: a few fast api/e2e tests over the core flows, tagged @smoke
npm run test -- --project=api --project=e2e --grep @smoke --max-failures=1

# plus every api/inproc/e2e spec file this push adds or modifies. Only the spec files themselves:
# these tests reach the code over HTTP, so an import graph (--only-changed) would not tie
# them to the api/src or ui/src files they exercise.
base=$(git merge-base HEAD origin/master 2>/dev/null || true)
if [ -n "$base" ]; then
  mapfile -t changed < <(git diff --name-only --diff-filter=d "$base" HEAD -- 'tests/**/*.api.spec.ts' 'tests/**/*.inproc.spec.ts' 'tests/**/*.e2e.spec.ts')
  if [ ${#changed[@]} -gt 0 ]; then
    echo "changed api/inproc/e2e spec files: ${changed[*]}"
    npm run test -- --project=api --project=api-inproc-ldap --project=api-inproc-oidc --project=e2e --max-failures=1 "${changed[@]}"
  fi
fi
