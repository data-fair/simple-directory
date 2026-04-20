# Simple Directory - Agent Guidelines

## Project Overview

Simple Directory is an authentication and user/organization management service. Node.js + Express 5 + TypeScript API, Vue 3 frontend, MongoDB storage with optional LDAP backend.

## Dev environment

The dev environment is managed by zellij (terminal multiplexer) and docker compose. **Never start, stop, or restart dev processes yourself** -- the user manages them through zellij panes.

### Log files

Dev processes write to `dev/logs/`:
- `dev-api.log` -- API server
- `docker-compose.log` -- docker compose services (mongo, ldap, maildev, etc.)

### Port assignments

Port numbers are defined in `.env`. Do not modify port assignments.

### Testing

Test framework: Playwright. Tests live in `tests/` with naming conventions:
- `.api.spec.ts` -- API tests (require state-setup project)
- `.unit.spec.ts` -- unit tests
- `.inproc.spec.ts` -- in-process tests (LDAP, OIDC)
- `.e2e.spec.ts` -- browser tests

```bash
npm test                                    # all tests
npm run test-unit                           # unit tests only
npm run test-api                            # API tests only
npm run test-e2e                            # e2e tests only
npm run test-base tests/path/to/file.ts     # specific file
```

The full test suite is run by a git hook on push. When iterating on changes, always run only the related test cases.

Set `IGNORE_ASSERT_REQ_INTERNAL=true` to bypass internal secret validation in tests.

`/api/test-env` is gated behind `ENABLE_TEST_API=1` (in addition to `NODE_ENV ∈ {development, test}`). The `npm run dev` script sets it; tests using `tests/support/in-process-server.ts` set it too. Never set it in production — the server refuses to start if `NODE_ENV=production` and `ENABLE_TEST_API=1`.

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
