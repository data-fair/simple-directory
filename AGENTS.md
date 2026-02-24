# Simple Directory

Node.js + Express 5 + TypeScript, Vue 3 frontend, MongoDB storage.

## Commands

```bash
npm install                    # Install deps
npm run dev-deps               # Start MongoDB, LDAP, maildev
npm run dev-api                # API server (port 5689)
npm run dev-ui                 # UI dev server (port 6220)
npm run dev-zellij             # Both in Zellij
npm run test-deps              # Start test deps
npm test                       # Run tests
npm run test-base test-it/x.ts # Run specific test
npm run lint                   # Lint
npm run check-types            # Type check
npm run quality                 # Full quality check
```

## Config

- `api/config/default.cjs` - main config
- `api/config/test.cjs` - test config

## Tests

Set `IGNORE_ASSERT_REQ_INTERNAL=true` to bypass internal secret validation in tests.

## Key Files

- `api/src/auth/service.ts` - Auth logic
- `api/src/storages/interface.ts` - Storage interface
- `test-it/utils/index.ts` - Test utilities (axios, axiosAuth, createUser, clean)
