# Refactor Dev & Test Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge dev and test environments so that Playwright tests run against the already-running dev server (via nginx), with dev logs integrated in test output, a status script, localhost subdomains for cookie segregation, and updated CI.

**Architecture:** Tests switch from node:test with in-process `startApiServer()`/`stopApiServer()` to Playwright hitting the external dev server through nginx. A new `/api/test-env` endpoint handles cleanup and config overrides. Dev processes pipe output through `tee` into `dev/logs/` for log tailing in tests.

**Tech Stack:** Playwright, Node.js 24, Docker Compose, nginx, zellij, bash

**Reference implementation:** `../data-fair` (the data-fair repository uses this exact pattern)

---

## Key Design Decisions

### Tests run against external dev server

Currently each test file does `before(startApiServer)` / `after(stopApiServer)` and sets env vars like `STORAGE_TYPE` before import. In the new model, the dev server is already running. This requires:

1. A **test-env API** (`/api/test-env`) that tests can call to clean DB state and apply config overrides at runtime
2. The dev server runs with a **comprehensive config** (the existing `development.cjs` already covers mongo + ldap + oidc)
3. Tests that need a radically different config (e.g. `STORAGE_TYPE=file` or custom OIDC mock) apply overrides via the test-env API

### Config-dependent test grouping

Some test files set `STORAGE_TYPE=ldap` or configure custom OIDC providers. The test-env API needs a way to:
- Apply a config overlay for the duration of a test (and revert after)
- Clean DB/LDAP/file state between tests

### Cookie segregation via localhost subdomains

Like data-fair, `init-env.sh` generates `DEV_HOST=<branch>.localhost`. The nginx servers and Playwright tests use this host. This naturally segregates cookies between worktrees and prevents cookie collisions during multi-site testing.

---

## File Structure

**New files:**
- `playwright.config.ts` — Playwright configuration with projects (state-setup, state-teardown, api, e2e)
- `tests/state-setup.ts` — Pre-test checks (dev server up?) + log tailing
- `tests/state-teardown.ts` — Cleanup tail processes
- `tests/support/axios.ts` — Shared HTTP client builders pointing at nginx
- `tests/features/` — Migrated test files organized by feature (renamed `*.api.spec.ts`)
- `api/src/test-env.ts` — Test-env API router (cleanup, config overrides)
- `dev/status.sh` — Dev environment health check script

**Modified files:**
- `dev/init-env.sh` — Add `DEV_HOST` based on branch name
- `.zellij.kdl` — Use `DEV_HOST` in info pane, add `--wait` for docker deps
- `api/package.json` — Add `tee` to dev script for log capture
- `docker-compose.yml` — Add `--wait` healthchecks where missing
- `package.json` — New scripts (`test`, `test-api`, `test-e2e`), update `quality`
- `.github/workflows/reuse-quality.yml` — Start dev server, run Playwright tests against it
- `dev/resources/nginx.conf.template` — Use `DEV_HOST` in server_name
- `api/src/app.ts` — Mount test-env router in development/test mode

**Deleted files (after migration complete):**
- `test-it/` directory (all files migrated to `tests/features/`)
- `test-it/utils/index.ts` (replaced by `tests/support/axios.ts`)

---

### Task 1: Add DEV_HOST to init-env.sh and update zellij

**Files:**
- Modify: `dev/init-env.sh`
- Modify: `.zellij.kdl`

- [ ] **Step 1: Update init-env.sh to generate DEV_HOST**

Add branch-based DEV_HOST at the top of the generated `.env`, matching data-fair's pattern:

```bash
#!/bin/bash

RANDOM_NB=$((1024 + RANDOM % 48000))
echo "Use random base port $RANDOM_NB"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null | sed 's/[^a-zA-Z0-9-]/-/g')
DEV_HOST="${BRANCH:-sd}.localhost"

cat <<EOF > ".env"
DEV_HOST=${DEV_HOST}

NGINX_PORT1=$((RANDOM_NB))
NGINX_PORT2=$((RANDOM_NB + 1))
NGINX_PORT3=$((RANDOM_NB + 2))
NGINX_PORT4=$((RANDOM_NB + 3))

DEV_API_PORT=$((RANDOM_NB + 10))
DEV_UI_PORT=$((RANDOM_NB + 11))
DEV_OBSERVER_PORT=$((RANDOM_NB + 12))
MAILDEV_UI_PORT=$((RANDOM_NB + 13))
MAILDEV_SMTP_PORT=$((RANDOM_NB + 14))

MONGO_PORT=$((RANDOM_NB + 20))
LDAP_PORT=$((RANDOM_NB + 21))
LDAP_ADMIN_PORT=$((RANDOM_NB + 22))
OIDC_PROVIDER_PORT=$((RANDOM_NB + 23))
KEYCLOAK_PORT=$((RANDOM_NB + 24))

EVENTS_PORT=$((RANDOM_NB + 30))
EOF
```

- [ ] **Step 2: Update .zellij.kdl to show DEV_HOST**

Change the info pane to use `DEV_HOST`:

```kdl
    pane size=1 borderless=true {
        command "bash"
        args "-ic" "echo -n -e \"Dev server available at \\e[1;96mhttp://$DEV_HOST:$NGINX_PORT1\\033[0m\""
    }
```

- [ ] **Step 3: Update nginx server_name to use DEV_HOST**

In `dev/resources/nginx.conf.template`, for each server block, change `server_name _` to `server_name ${DEV_HOST}` for the primary server (port1). Secondary servers can stay with `_` or use specific names.

Only the first server block needs the change — it routes the main app:

```nginx
    server {
      listen ${NGINX_PORT1};
      server_name ${DEV_HOST};
```

- [ ] **Step 4: Update development.cjs to use DEV_HOST**

In `api/config/development.cjs`, change `publicUrl` to use `DEV_HOST`:

```javascript
  publicUrl: 'http://' + process.env.DEV_HOST + ':' + process.env.NGINX_PORT1 + '/simple-directory',
```

- [ ] **Step 5: Regenerate .env and verify**

Run: `./dev/init-env.sh`

Verify the `.env` file contains a `DEV_HOST=<branch>.localhost` line.

- [ ] **Step 6: Commit**

```bash
git add dev/init-env.sh .zellij.kdl dev/resources/nginx.conf.template api/config/development.cjs
git commit -m "feat: add DEV_HOST branch-based subdomain for cookie segregation"
```

---

### Task 2: Add dev log capture via tee

**Files:**
- Modify: `api/package.json`
- Modify: `.zellij.kdl`

- [ ] **Step 1: Update API dev script to pipe through tee**

In `api/package.json`, modify the dev script to write logs to a file via tee:

```json
"dev": "mkdir -p ../dev/logs && NODE_ENV=development DEBUG=upgrade* node --watch --experimental-strip-types index.ts 2>&1 | tee ../dev/logs/dev-api.log"
```

- [ ] **Step 2: Update zellij deps pane to log docker compose output**

In `.zellij.kdl`, update the deps pane to capture docker compose logs:

```kdl
      pane name="deps" {
        command "bash"
        args "-ic" "mkdir -p dev/logs && npm run dev-deps && docker compose --profile dev logs -f 2>&1 | tee dev/logs/docker-compose.log"
      }
```

- [ ] **Step 3: Add dev/logs to .gitignore**

Verify `dev/logs` is in `.gitignore`. If not, add it.

- [ ] **Step 4: Commit**

```bash
git add api/package.json .zellij.kdl .gitignore
git commit -m "feat: pipe dev process output through tee for log capture"
```

---

### Task 3: Create dev status script

**Files:**
- Create: `dev/status.sh`

- [ ] **Step 1: Create the status script**

Create `dev/status.sh` adapted from data-fair's version, checking simple-directory's specific services:

```bash
#!/usr/bin/env bash
# Check the status of all dev environment services.
# Read-only — never starts, stops, or restarts anything.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load port configuration
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
else
  echo "ERROR: .env file not found at $PROJECT_DIR/.env"
  exit 1
fi

NGINX1="http://${DEV_HOST:-localhost}:${NGINX_PORT1}"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' BOLD='' RESET=''
fi

check_http() {
  local name="$1" url="$2"
  local http_code
  http_code=$(curl -s -L --max-time 2 -o /dev/null -w "%{http_code}" "$url" 2>&1) || http_code="000"
  if [ "$http_code" = "000" ]; then
    printf "${RED}%-20s DOWN     %s  (connection refused)${RESET}\n" "$name" "$url"
  elif [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
    printf "${GREEN}%-20s UP       %s${RESET}\n" "$name" "$url"
  else
    printf "${YELLOW}%-20s ERROR    %s  (HTTP %s)${RESET}\n" "$name" "$url" "$http_code"
  fi
}

check_tcp() {
  local name="$1" host="$2" port="$3"
  if (echo > /dev/tcp/"$host"/"$port") 2>/dev/null; then
    printf "${GREEN}%-20s UP       %s:%s${RESET}\n" "$name" "$host" "$port"
  else
    printf "${RED}%-20s DOWN     %s:%s${RESET}\n" "$name" "$host" "$port"
  fi
}

echo -e "${BOLD}Dev environment status${RESET}"
echo ""

# --- Nginx (gateway) ---
echo -e "${BOLD}Nginx proxy:${RESET}"
check_http "nginx (port1)" "$NGINX1"
check_tcp  "nginx (port2)" "localhost" "${NGINX_PORT2}"
check_tcp  "nginx (port3)" "localhost" "${NGINX_PORT3}"
check_tcp  "nginx (port4)" "localhost" "${NGINX_PORT4}"
echo ""

# --- Dev processes ---
echo -e "${BOLD}Dev processes:${RESET}"
check_http "dev-api" "http://localhost:${DEV_API_PORT}/simple-directory/api/auth/me"
check_http "dev-ui" "http://localhost:${DEV_UI_PORT}"
echo ""

# --- Docker compose services ---
echo -e "${BOLD}Docker compose services:${RESET}"
check_tcp  "mongo" "localhost" "${MONGO_PORT}"
check_tcp  "ldap" "localhost" "${LDAP_PORT}"
check_http "maildev" "http://localhost:${MAILDEV_UI_PORT}"
check_tcp  "oidc-provider" "localhost" "${OIDC_PROVIDER_PORT}"
check_tcp  "keycloak" "localhost" "${KEYCLOAK_PORT}"
echo ""

# --- Docker compose status ---
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  echo -e "${BOLD}Container details:${RESET}"
  (cd "$PROJECT_DIR" && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null) || echo "(docker compose not available)"
  echo ""
fi

# --- Log files ---
echo -e "${BOLD}Log files:${RESET}"
found_logs=false
for log in "$PROJECT_DIR"/dev/logs/*.log; do
  [ -f "$log" ] || continue
  found_logs=true
  name=$(basename "$log")
  size=$(wc -c < "$log" 2>/dev/null || echo 0)
  mod=$(date -r "$log" "+%H:%M:%S" 2>/dev/null || echo "unknown")
  printf "  %-25s %6s bytes  (last modified: %s)\n" "$name" "$size" "$mod"
done
$found_logs || echo "  (no log files found)"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x dev/status.sh`

- [ ] **Step 3: Test it**

Run: `./dev/status.sh`

Expected: All services show DOWN (unless dev env is running). The script should not error out.

- [ ] **Step 4: Commit**

```bash
git add dev/status.sh
git commit -m "feat: add dev environment status script"
```

---

### Task 4: Add test-env API endpoint

This is the critical piece that enables tests to clean state without importing server modules directly.

**Files:**
- Create: `api/src/test-env.ts`
- Modify: `api/src/app.ts`

- [ ] **Step 1: Read app.ts to find the router mounting pattern**

Read `api/src/app.ts` to understand how routers are mounted and where to add the test-env router.

- [ ] **Step 2: Create the test-env router**

Create `api/src/test-env.ts`:

```typescript
import { Router } from 'express'
import mongo from '#mongo'
import config from '#config'

const router = Router()

// DELETE /api/test-env — clean all test data
router.delete('/', async (req, res) => {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return res.status(403).send('test-env routes are only available in development/test mode')
  }
  await mongo.organizations.deleteMany({ _id: { $ne: 'admins-org' } })
  await mongo.users.deleteMany({})
  await mongo.sites.deleteMany({})
  await mongo.oauthTokens.deleteMany()
  await mongo.ldapUserSessions.deleteMany()
  await mongo.fileUserSessions.deleteMany()
  await mongo.ldapMembersOverwrite.deleteMany()
  await mongo.ldapOrganizationsOverwrite.deleteMany()
  for (const passwordList of await mongo.passwordLists.find().toArray()) {
    try {
      await mongo.db.collection('password-list-' + passwordList._id).drop()
    } catch (err: any) {
      if (err.code !== 26) throw err
    }
  }
  await mongo.passwordLists.deleteMany()
  res.status(204).send()
})

// GET /api/test-env/ping — simple health check for test readiness
router.get('/ping', (req, res) => {
  res.send('ok')
})

export default router
```

- [ ] **Step 3: Mount the test-env router in app.ts**

Add to `app.ts`, conditionally:

```typescript
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  const testEnv = (await import('./test-env.ts')).default
  app.use('/api/test-env', testEnv)
}
```

- [ ] **Step 4: Start the dev server and test the endpoint**

Run: `curl -X DELETE http://localhost:$DEV_API_PORT/api/test-env` (should return 204)
Run: `curl http://localhost:$DEV_API_PORT/api/test-env/ping` (should return "ok")

- [ ] **Step 5: Commit**

```bash
git add api/src/test-env.ts api/src/app.ts
git commit -m "feat: add test-env API for test cleanup"
```

---

### Task 5: Install Playwright and create config

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

Run: `npm i -D @playwright/test`

- [ ] **Step 2: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'dot',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://${process.env.DEV_HOST || 'localhost'}:${process.env.NGINX_PORT1}/simple-directory`,
    actionTimeout: 5_000,
    navigationTimeout: 5_000,
  },

  projects: [
    {
      name: 'state-setup',
      testMatch: /state-setup\.ts/,
      teardown: 'state-teardown'
    },
    {
      name: 'state-teardown',
      testMatch: /state-teardown\.ts/,
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      dependencies: ['state-setup'],
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      dependencies: ['state-setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

- [ ] **Step 3: Update package.json scripts**

Replace the test scripts:

```json
"test": "playwright test --max-failures=1",
"test-api": "playwright test --project api --max-failures=1",
"test-e2e": "playwright test --project e2e --max-failures=1",
```

Keep the old `test-base` and `test-deps` scripts temporarily for migration. Update `quality`:

```json
"quality": "npm run test-deps && npm run lint && npm run build-types && npm run check-types && npm run test"
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "feat: add Playwright config and test scripts"
```

---

### Task 6: Create test scaffolding (state-setup, state-teardown, support)

**Files:**
- Create: `tests/state-setup.ts`
- Create: `tests/state-teardown.ts`
- Create: `tests/support/axios.ts`

- [ ] **Step 1: Create tests/support/axios.ts**

Shared HTTP client utilities for all tests, pointing at the nginx proxy:

```typescript
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import type { AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import eventPromise from '@data-fair/lib-utils/event-promise.js'

export const directoryUrl = `http://${process.env.DEV_HOST || 'localhost'}:${process.env.NGINX_PORT1}/simple-directory`
export const devApiUrl = `http://localhost:${process.env.DEV_API_PORT}`

const axiosOpts = { baseURL: directoryUrl }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts, maxRedirects: 0 })

export const axiosAuth = async (opts: string | Omit<AxiosAuthOptions, 'password'> & { password?: string }) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = opts.password || 'TestPasswd01'
  return _axiosAuth({ password, directoryUrl, ...opts, axiosOpts: { ...axiosOpts, ...opts.axiosOpts } })
}

export const clean = async () => {
  const ax = axiosBuilder()
  await ax.delete(`${devApiUrl}/api/test-env`)
}

export const createUser = async (email: string, adminMode = false, password = 'TestPasswd01', _directoryUrl?: string) => {
  const baseUrl = _directoryUrl ?? directoryUrl
  const localAxiosOpts = { baseURL: baseUrl }
  const anonymAx = await axios(localAxiosOpts)

  // Create user and poll maildev for the confirmation mail
  await anonymAx.post('/api/users', { email, password })
  const maildevUrl = `http://localhost:${process.env.MAILDEV_UI_PORT}`
  const mailAx = axiosBuilder()

  // Poll for the mail (maildev REST API)
  let mail: any
  for (let i = 0; i < 50; i++) {
    const emails = (await mailAx.get(`${maildevUrl}/email`)).data
    mail = emails.find((m: any) => m.to?.[0]?.address === email)
    if (mail) break
    await new Promise(r => setTimeout(r, 200))
  }
  if (!mail) throw new Error(`No mail received for ${email}`)

  // Extract token_callback link from mail HTML
  const linkMatch = mail.html.match(/href="([^"]*token_callback[^"]*)"/)
  if (!linkMatch) throw new Error('No token_callback link found in mail')
  const link = linkMatch[1].replace(/&amp;/g, '&')

  await anonymAx(link).catch((err: any) => { if (err.status !== 302) throw err })

  // Delete the processed mail
  await mailAx.delete(`${maildevUrl}/email/${mail.id}`)

  const ax = await axiosAuth({ email, adminMode, password, axiosOpts: localAxiosOpts, directoryUrl: baseUrl })
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}

export const getAllEmails = async () => {
  const ax = axiosBuilder()
  return (await ax.get(`http://localhost:${process.env.MAILDEV_UI_PORT}/email`)).data
}

export const deleteAllEmails = async () => {
  const ax = axiosBuilder()
  const emails = (await ax.get(`http://localhost:${process.env.MAILDEV_UI_PORT}/email`)).data
  for (const email of emails) {
    await ax.delete(`http://localhost:${process.env.MAILDEV_UI_PORT}/email/` + email.id)
  }
}
```

**Note:** The biggest change from the old `test-it/utils/index.ts` is:
- No more `startApiServer()` / `stopApiServer()` — the server is already running
- `clean()` calls the test-env API instead of importing mongo directly
- `createUser()` polls maildev REST API instead of using in-process event emitters
- `waitForMail()` is replaced by maildev polling (works cross-process)

- [ ] **Step 2: Create tests/state-setup.ts**

```typescript
import { strict as assert } from 'node:assert'
import { spawn } from 'child_process'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { test as setup } from '@playwright/test'
import { devApiUrl } from './support/axios.ts'

const ax = axiosBuilder()

setup('Stateful tests setup', async () => {
  // Check that the dev API server is up
  await assert.doesNotReject(
    ax.get(`${devApiUrl}/api/test-env/ping`),
    `Dev API server seems to be unavailable at ${devApiUrl}.
If you are an agent do not try to start it. Instead check for a startup failure at the end of dev/logs/dev-api.log and report this problem to your user.`
  )

  // More visible dev server logs straight in the test output
  try {
    const { existsSync, mkdirSync } = await import('node:fs')
    if (!existsSync('dev/logs')) mkdirSync('dev/logs', { recursive: true })
    const tailApi = spawn('tail', ['-n', '0', '-f', 'dev/logs/dev-api.log'], { stdio: 'inherit', detached: true })
    process.env.TAIL_PIDS = [tailApi.pid].filter(Boolean).join(',')
  } catch {
    // log tailing is optional
  }
})
```

- [ ] **Step 3: Create tests/state-teardown.ts**

```typescript
import { test as teardown } from '@playwright/test'

teardown('Stateful tests teardown', () => {
  const pids = process.env.TAIL_PIDS
  if (pids) {
    for (const pid of pids.split(',')) {
      try {
        process.kill(parseInt(pid))
      } catch {
        // process may have already exited
      }
    }
  }
})
```

- [ ] **Step 4: Run Playwright to verify scaffolding works**

Run: `npx playwright test --project state-setup` (with dev server running)

Expected: Setup passes, checks dev server is available.

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "feat: add Playwright test scaffolding with state-setup, support utils"
```

---

### Task 7: Migrate test files to Playwright format

This is the bulk of the work. Each test file in `test-it/` needs to be converted from node:test format to Playwright format. The conversion pattern is mechanical:

**Conversion rules:**
1. `import { it, describe, before, beforeEach, after } from 'node:test'` → `import { test, expect } from '@playwright/test'`
2. `before(startApiServer)` / `after(stopApiServer)` → **remove** (server is external)
3. `beforeEach(async () => await clean())` → `test.beforeEach(async () => { await clean() })`
4. `describe('...', () => { ... })` → `test.describe('...', () => { ... })`
5. `it('...', async () => { ... })` → `test('...', async () => { ... })`
6. `assert.equal(a, b)` → `expect(a).toBe(b)` (or keep assert — Playwright supports both)
7. `assert.ok(x)` → `expect(x).toBeTruthy()`
8. `assert.rejects(promise, ...)` → keep as-is or use try/catch with expect
9. Import paths: `'./utils/index.ts'` → `'../support/axios.ts'`
10. `process.env.STORAGE_TYPE = 'mongo'` → **remove** (server already configured)
11. `process.env.STORAGE_TYPE = 'ldap'` → tests call test-env API to request LDAP mode (Task 8)
12. Rename files: `test-it/users.ts` → `tests/features/users.api.spec.ts`

**Files to migrate** (23 files):

| Old path | New path | Storage | Notes |
|----------|----------|---------|-------|
| `test-it/users.ts` | `tests/features/users.api.spec.ts` | mongo | Standard |
| `test-it/organizations.ts` | `tests/features/organizations.api.spec.ts` | mongo | Standard |
| `test-it/invitations.ts` | `tests/features/invitations.api.spec.ts` | mongo | Standard |
| `test-it/session.ts` | `tests/features/session.api.spec.ts` | file (default) | Uses default config |
| `test-it/pseudo-session.ts` | `tests/features/pseudo-session.api.spec.ts` | file | Uses default config |
| `test-it/sites.ts` | `tests/features/sites.api.spec.ts` | mongo | Multi-port nginx |
| `test-it/mails.ts` | `tests/features/mails.api.spec.ts` | mongo | Needs maildev |
| `test-it/jwks.ts` | `tests/features/jwks.api.spec.ts` | — | Standard |
| `test-it/i18n.ts` | `tests/features/i18n.api.spec.ts` | — | Standard |
| `test-it/password-lists.ts` | `tests/features/password-lists.api.spec.ts` | mongo | Standard |
| `test-it/admin-credentials.ts` | `tests/features/admin-credentials.api.spec.ts` | file | Standard |
| `test-it/file-storage.ts` | `tests/features/file-storage.api.spec.ts` | file | Needs file storage config |
| `test-it/single-membership.ts` | `tests/features/single-membership.api.spec.ts` | mongo | Standard |
| `test-it/external-apps-authorization.ts` | `tests/features/external-apps-authorization.api.spec.ts` | — | Standard |
| `test-it/unescape-dn.ts` | `tests/features/unescape-dn.api.spec.ts` | — | Unit-style (pure function) |
| `test-it/ldap-api.ts` | `tests/features/ldap-api.api.spec.ts` | ldap | Needs LDAP running |
| `test-it/ldap-storage.ts` | `tests/features/ldap-storage.api.spec.ts` | ldap | Needs LDAP running |
| `test-it/ldap-storage-single-org.ts` | `tests/features/ldap-storage-single-org.api.spec.ts` | ldap | Needs LDAP running |
| `test-it/ldap-per-org-mongo.ts` | `tests/features/ldap-per-org-mongo.api.spec.ts` | mongo+ldap | Per-org LDAP overlay |
| `test-it/ldap-per-org-file.ts` | `tests/features/ldap-per-org-file.api.spec.ts` | file+ldap | Per-org LDAP overlay |
| `test-it/oidc.ts` | `tests/features/oidc.api.spec.ts` | mongo | Custom OIDC mock server |
| `test-it/oidc-core-id.ts` | `tests/features/oidc-core-id.api.spec.ts` | mongo | Uses keycloak |
| `test-it/oidc-ldap.ts` | `tests/features/oidc-ldap.api.spec.ts` | ldap | OIDC + LDAP |

- [ ] **Step 1: Start with a simple test file migration (session.ts)**

This file uses the default file storage config and doesn't set `STORAGE_TYPE`, making it the simplest to convert.

Read `test-it/session.ts` fully, then create `tests/features/session.api.spec.ts` with Playwright format. Keep `assert` usage (Playwright supports it). Replace `describe`/`it`/`before`/`after`/`beforeEach` with Playwright equivalents. Remove `startApiServer`/`stopApiServer`. Replace `clean` import.

- [ ] **Step 2: Run the migrated test**

Run: `npx playwright test tests/features/session.api.spec.ts --max-failures=1`

Expected: Tests pass against the running dev server.

- [ ] **Step 3: Migrate all mongo-storage test files**

Migrate these files (they all use `STORAGE_TYPE = 'mongo'` which matches the dev config):
- `users.ts`, `organizations.ts`, `invitations.ts`, `sites.ts`, `mails.ts`, `password-lists.ts`, `single-membership.ts`

For each: read the original, create the new file in `tests/features/`, remove `process.env.STORAGE_TYPE` line, update imports, remove server lifecycle.

- [ ] **Step 4: Run all migrated tests**

Run: `npx playwright test --project api --max-failures=1`

- [ ] **Step 5: Migrate config-independent test files**

Migrate: `jwks.ts`, `i18n.ts`, `external-apps-authorization.ts`, `admin-credentials.ts`, `unescape-dn.ts`

For `unescape-dn.ts`: if it tests a pure function without server interaction, consider making it a unit test (`.unit.spec.ts`) and add a `unit` project to playwright config.

- [ ] **Step 6: Run and verify**

Run: `npx playwright test --project api --max-failures=1`

- [ ] **Step 7: Commit batch**

```bash
git add tests/features/
git commit -m "feat: migrate standard test files to Playwright format"
```

---

### Task 8: Handle config-dependent tests (LDAP, file storage, OIDC)

These tests need the server to run with a different config than the default. Two approaches:

**Approach A (recommended):** The dev server already runs with `storage.type: 'mongo'` and `perOrgStorageTypes: ['ldap']`. LDAP tests that test per-org LDAP overlay work as-is. Tests that need `storage.type: 'ldap'` as primary storage need the test-env API to support config overrides.

**Approach B (simpler fallback):** Keep these tests using in-process server startup (the old pattern) temporarily, via a Playwright test that spawns its own server.

**Files:**
- Modify: `api/src/test-env.ts` — add config override endpoint
- Create: LDAP and OIDC test files in `tests/features/`

- [ ] **Step 1: Evaluate which tests can run without config changes**

Read each LDAP/file/OIDC test file. Determine if the test exercises behavior that is available with the dev config's `perOrgStorageTypes: ['ldap']`, or if it truly needs `storage.type: 'ldap'`.

Tests like `ldap-per-org-mongo.ts` should work with the dev config since it uses mongo with per-org LDAP overlay.

Tests like `ldap-storage.ts` and `ldap-api.ts` test LDAP as the primary storage — these genuinely need a different config.

- [ ] **Step 2: Add config overlay support to test-env API**

Extend `api/src/test-env.ts` to allow temporary config overrides:

```typescript
// POST /api/test-env/config — apply temporary config overlay
router.post('/config', express.json(), async (req, res) => {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return res.status(403).send('test-env routes are only available in development/test mode')
  }
  // Store overlay in a global that config.ts checks
  // This requires a small change to how config is read
  ;(globalThis as any).__testConfigOverlay = req.body
  res.status(200).send('ok')
})

// DELETE /api/test-env/config — clear config overlay
router.delete('/config', (req, res) => {
  delete (globalThis as any).__testConfigOverlay
  res.status(204).send()
})
```

**Important:** This approach has limits — changing `storage.type` at runtime means reinitializing the storage layer. This may not be feasible without server restart. In that case, fall back to Approach B for these specific tests.

- [ ] **Step 3: Migrate LDAP per-org tests (should work without config changes)**

Migrate `ldap-per-org-mongo.ts` and `ldap-per-org-file.ts` — these use per-org LDAP overlay which the dev config supports.

- [ ] **Step 4: Migrate OIDC tests**

`oidc.ts` starts its own `OAuth2Server` on port 8998. In Playwright, the test can still do this — spawn the mock server in `test.beforeAll()` and shut it down in `test.afterAll()`. But the dev server needs to know about the OIDC provider at startup, which is configured in `development.cjs`.

Check if `development.cjs` already has an OIDC provider configured. If not, add one pointing at port 8998.

Alternatively, the test can use the keycloak provider already running in docker compose.

- [ ] **Step 5: For tests requiring primary LDAP storage — keep in-process or skip**

If the test-env config overlay approach doesn't work for `storage.type` changes, these tests should keep the old in-process pattern but wrapped in Playwright's test runner. Create a helper:

```typescript
// tests/support/in-process-server.ts
export const withServer = (envOverrides: Record<string, string>) => {
  test.beforeAll(async () => {
    for (const [k, v] of Object.entries(envOverrides)) {
      process.env[k] = v
    }
    process.env.NODE_CONFIG_DIR = './api/config/'
    const server = await import('../../api/src/server.ts')
    await server.start()
  })
  test.afterAll(async () => {
    const server = await import('../../api/src/server.ts')
    await server.stop()
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add api/src/test-env.ts tests/features/ tests/support/
git commit -m "feat: migrate config-dependent tests to Playwright"
```

---

### Task 9: Update CI workflow

**Files:**
- Modify: `.github/workflows/reuse-quality.yml`

- [ ] **Step 1: Update the workflow to match data-fair's pattern**

The CI needs to:
1. Generate `.env` with `init-env.sh`
2. Override `DEV_HOST=localhost` (subdomains don't work in CI)
3. Start docker services with `--wait`
4. Start the dev API server in background
5. Run Playwright tests
6. Clean up

```yaml
name: Quality checks

on:
  workflow_call:
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout git repository
      uses: actions/checkout@v4

    - uses: actions/setup-node@v3
      with:
        node-version: 24
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Lint
      run: npm run lint

    - name: Build types
      run: npm run build-types

    - name: Type check
      run: npm run check-types

    - name: Init .env
      run: ./dev/init-env.sh

    - name: Use localhost as DEV_HOST in CI
      run: sed -i 's/^DEV_HOST=.*/DEV_HOST=localhost/' .env

    - name: Start test services
      run: docker compose --profile test up -d --wait

    - name: Start dev API
      run: dotenv -- npm run dev-api &

    - name: Wait for API to be ready
      run: |
        for i in $(seq 1 30); do
          curl -s http://localhost:$(grep DEV_API_PORT .env | cut -d= -f2)/api/test-env/ping && break
          sleep 2
        done

    - name: Run tests
      run: npm run test-api

    - name: Audit
      run: npm audit --omit=dev --audit-level=critical

    - name: Stop test services
      if: always()
      run: docker compose --profile test down
```

- [ ] **Step 2: Verify the workflow syntax**

Run: `cat .github/workflows/reuse-quality.yml` — make sure YAML is valid.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/reuse-quality.yml
git commit -m "feat: update CI to start dev server and run Playwright tests"
```

---

### Task 10: Clean up old test infrastructure

Only do this after all tests are migrated and passing.

**Files:**
- Delete: `test-it/` directory
- Modify: `package.json` — remove old `test-base` script
- Modify: `tsconfig.tests.json` — update to point at `tests/` instead of `test-it/`

- [ ] **Step 1: Verify all tests pass with Playwright**

Run: `npx playwright test --max-failures=1`

Expected: All tests pass.

- [ ] **Step 2: Remove old test directory**

Run: `rm -rf test-it/`

- [ ] **Step 3: Update package.json**

Remove `test-base` script. The `test` script now runs Playwright.

- [ ] **Step 4: Update tsconfig.tests.json**

Change `test-it` references to `tests`.

- [ ] **Step 5: Remove old test dependencies if unused**

Check if `@reporters/bail` is still needed (it was for node:test). If not, remove it.

- [ ] **Step 6: Run quality checks**

Run: `npm run quality`

Expected: Full quality pipeline passes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old node:test infrastructure, complete migration to Playwright"
```

---

## Summary of changes by area

| Area | What changes |
|------|-------------|
| **Cookie segregation** | `DEV_HOST=<branch>.localhost` in `.env`, nginx uses it as `server_name` |
| **Dev logs** | API dev script pipes through `tee` to `dev/logs/dev-api.log` |
| **Log integration** | `state-setup.ts` tails `dev/logs/dev-api.log` into test output via `stdio: 'inherit'` |
| **Test framework** | node:test → Playwright, tests hit external dev server via nginx |
| **Test cleanup** | Direct mongo import → `/api/test-env` HTTP endpoint |
| **Mail verification** | In-process event emitter → maildev REST API polling |
| **Status script** | New `dev/status.sh` checks all services |
| **CI** | Starts dev server in background, runs Playwright against it |
| **Zellij** | Shows `DEV_HOST` URL, captures docker compose logs |
