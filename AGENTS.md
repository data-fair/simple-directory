# Simple Directory - Agent Guidelines

## Project Overview

Simple Directory is an authentication and user/organization management service. Node.js + Express 5 + TypeScript API, Vue 3 frontend, MongoDB storage with optional LDAP backend.

## Dev environment

Docker runs the containers (nginx, mongo, maildev, ldap, oidc-provider, keycloak; optional profiles `events`,
`saml-provider` and `ldap-admin`); the api, the ui and the mock OIDC servers run as node processes.

- `npm run dev` — the containers (`npm run dev-deps`), then the api, the ui and the mock OIDC servers in the terminal
  (Ctrl+C stops them), at `http://localhost:6050/simple-directory/`. Their logs are in `dev/logs/` (`DEV_LOG_DIR`,
  `DEV_LOG_PREFIX`); `npm run dev` accepts docker compose arguments (`npm run dev -- --profile events`).
- `npm run dev-deps` — the containers only, plus `npm run dev-setup`.
- `npm run dev-setup` — idempotent builds (types, ui), no container.
- `npm run dev:api`, `dev:ui`, `dev:mock-oidc` — one process each, with the variables of `.env` exported.
- `npm run stop-dev-deps` — stops the containers.

Default ports (6050-6069) are in `dev/default.env`, copied to `.env` the first time: `.env` overrides it and is
never overwritten. The 4 nginx ports (`NGINX_PORT1`..`NGINX_PORT4`) serve the multi-site tests. Production names
(`MONGO_URL`, `PUBLIC_URL`, `ADMINS`, `OIDC_PROVIDERS`...) override `api/config/development.cjs`. Optional
containers: `events` (notifications: set `EVENTS_PORT=6069` in `.env`, an empty one turns the integration off),
`saml-provider` and `ldap-admin`. The API fetches the OIDC discovery of oidc-provider and keycloak at startup.

- Read the logs before restarting: nodemon (api, mock-oidc) and vite (ui) already reload on file changes.
- Do not start, stop or restart the dev processes or containers of the user: ask.
- Never `npm ci` / `npm install` while the env runs.
- If a service is down, do not try to fix the infrastructure: read its logs (`dev/logs/`, or
  `docker compose logs <service>` for a container) and report the problem to the user with the relevant lines.

### Fixtures

`npm run dev-fixtures` seeds the running dev env (`dev/fixtures.ts`) with demo accounts,
organizations with departments and role labels, a partnership, org limits and a themed
secondary site. It is idempotent, and its ids and emails deliberately avoid the test
cleanup patterns (`^test_` ids, `@test.com` emails) so the accounts survive `npm test`.
The site does not: the test cleanup wipes the whole sites collection, because sites have
a unique index on host and tests must stay free to claim any dev host.

### Test sub-space

The file fixtures (`dev/resources/users.json` and `organizations.json`, seeded by `POST /api/test-env/seed` without
a body) have ids under `test_sd_`. The tests still clean the whole directory (`DELETE /api/test-env` without a
prefix) and change the server's config: they run only against this checkout's own dev environment. The prefixed
`POST /api/test-env/seed` and `DELETE /api/test-env?prefix=` serve the test suites of other services.

### Testing

Test framework: Playwright. Tests live in `tests/` with naming conventions:
- `.api.spec.ts` -- API tests (require state-setup project)
- `.unit.spec.ts` -- unit tests
- `.inproc.spec.ts` -- in-process tests (LDAP, OIDC)
- `.e2e.spec.ts` -- browser tests

```bash
npm test                                    # all tests
npm run test-unit                           # unit tests only
npm run test-api                            # API tests only (test-api-fast stops at the first failure)
npm run test-inproc                         # in-process tests only
npm run test-e2e                            # e2e tests only
npm test -- tests/features/file.api.spec.ts # specific file
```

The pre-push hook runs a light gate (`dev/pre-push.sh`: check-types, unit, the `@smoke` set and the spec files the push changes); the full suite runs on pull requests, releases and nightly on master. On a failure, `npx playwright show-trace test-results/<test>/trace.zip`. When iterating on changes, always run only the related test cases.

Set `IGNORE_ASSERT_REQ_INTERNAL=true` to bypass internal secret validation in tests.

`/api/test-env` is gated behind `ENABLE_TEST_API=1` (in addition to `NODE_ENV ∈ {development, test}`). The `dev:api` script (used by `npm run dev` and CI) sets it; tests using `tests/support/in-process-server.ts` set it too. Never set it in production — the server refuses to start if `NODE_ENV=production` and `ENABLE_TEST_API=1`.

### Linting & Type Checking

```bash
npm run lint             # ESLint
npm run check-types      # TypeScript type checking
npm run quality          # Full quality check (lint + types + tests)
```

## Architecture

- **Monorepo** with 3 workspaces: `api/`, `ui/`, `shared/`
- **Import aliases**: `#mongo`, `#config`, `#services`, `#storages` (defined in api/package.json)
- **Config**: `api/config/default.cjs` (main), `api/config/test.cjs` (test overrides)
- **Storage abstraction**: `api/src/storages/interface.ts` defines the storage interface, implemented for MongoDB, LDAP, and file backends
- **Auth**: `api/src/auth/service.ts` -- multi-provider support (OAuth2, SAML2, LDAP, local passwords)
- **Test utilities**: `tests/support/` -- axios helpers, fixtures, in-process server setup

### Architecture references

Read before changing anything in the corresponding area:

- [`docs/architecture/email-trust-and-site-isolation.md`](docs/architecture/email-trust-and-site-isolation.md) -- how SSO email claims are verified and how site-level SSO trust is confined so a compromised site config cannot escalate to superadmin or cross-site takeover. Required reading for changes to auth providers, `cleanUser`, `authProviderLoginCallback`, `adminMode`, or the change-host flow.
- [`docs/architecture/session-theft-protections.md`](docs/architecture/session-theft-protections.md) -- what protects a session whose cookies were copied: the split between the short lived `id_token` and the exchange token, server sessions and their recorded origin, the IP binding of superadmin sessions, and single use exchange tokens with reuse detection. Required reading for changes to `setSessionCookies`, `keepalive`, `logout`, or the `ServerSession` schema.
- [`docs/architecture/emails.md`](docs/architecture/emails.md) -- the outbound email pipeline: the two `/api/mails*` endpoints, sanitization/escape at the trust boundary, MJML template substitution, and `sendMailI18n`. Required reading for changes under `api/src/mails/`, the MJML templates, the mail schemas, or any caller that posts to `/api/mails`.
- [`docs/architecture/main-site-config.md`](docs/architecture/main-site-config.md) -- what the main site reads from its database document versus from environment variables, the `MAIN_SITE_FROM_DB` category list, and why the API reports rather than refuses. Required reading for changes to `api/src/sites/main-site.ts`, the `/api/sites/_*` presentation endpoints, `getSiteExtraParams` in `api/src/sites/spa-params.ts`, or the mail theming path.
- [`docs/architecture/non-human-identities.md`](docs/architecture/non-human-identities.md) -- how NHI (service account) JWT exchange is verified and confined to a single org with short-lived non-refreshable sessions. Required reading for changes to the nhi-token exchange (including its `scope` parameter and the `at+jwt` access token), `api/src/nhis/`, NHI-related guards, scopes (`api/src/utils/scope-gate.ts`, `api/src/scopes/`) or the scoped key set in `api/src/tokens/keys-manager.ts`.
- [`docs/architecture/oauth-authorization-server.md`](docs/architecture/oauth-authorization-server.md) -- the OAuth authorization server (M1 machine grants for NHIs, M2 authorization code flow with SD consent, refresh rotation, site clients and dynamic clients bound to NHIs): issuer sites and realm, grants, resource audiences, claims, flags, routes and invariants. Required reading for changes under `api/src/oauth-server/`, the token endpoint, the consent screens or discovery.
- [`docs/architecture/oidc-client.md`](docs/architecture/oidc-client.md) -- the OIDC client (relying party) side: login flow, browser binding cookie, PKCE and nonce, id_token / userinfo / logout token verification, the `strict` and `rpInitiatedLogout` provider flags, discovery and JWKS caches, handoff to the server session, RP-initiated and back-channel logout, ProConnect settings. Required reading for changes under `api/src/oauth/`, `api/src/auth/login-binding.ts`, the OAuth/OIDC/SAML login and logout routes of `api/src/auth/router.ts` or `token_callback`.
- [`docs/architecture/logging.md`](docs/architecture/logging.md) -- the unified logger of `@data-fair/lib-node` (levels, static codes, actor from the implicit request context, `userLogFields` / `orgLogFields`, no `console` in server code). Required reading before adding or changing a log line in `api/`.
