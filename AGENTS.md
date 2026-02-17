# Simple Directory - AI Agent Documentation

## Project Overview

**Simple Directory** is a user and organization management service for modern Web-oriented architectures. It provides authentication, user management, organization management, multi-site support, and various identity providers (LDAP, SAML, OIDC, OAuth).

- **Repository**: https://github.com/koumoul-dev/simple-directory
- **License**: MIT
- **Current Version**: 8.16.1

## Tech Stack

- **Backend**: Node.js with Express 5, TypeScript
- **Frontend**: Vue 3, Vuetify 3
- **Database**: MongoDB (primary storage)
- **Alternative Storage**: LDAP, File-based
- **Testing**: Node.js native test runner (`node:test`)
- **Package Manager**: npm with workspaces

## Project Structure

```
simple-directory/
├── api/                    # Express API server
│   ├── src/
│   │   ├── auth/          # Authentication routes & service
│   │   ├── users/         # User management
│   │   ├── organizations/ # Organization management
│   │   ├── invitations/   # Invitation system
│   │   ├── oauth/        # OAuth/OIDC providers
│   │   ├── saml2/         # SAML2 authentication
│   │   ├── 2fa/          # Two-factor authentication
│   │   ├── tokens/       # JWT token management
│   │   ├── mails/        # Email service
│   │   ├── avatars/      # Avatar handling
│   │   ├── sites/        # Multi-site support
│   │   ├── storages/     # Storage backends (mongo, ldap, file)
│   │   ├── password-lists/ # Password validation lists
│   │   └── utils/        # Utilities
│   ├── config/           # Configuration files
│   ├── contract/         # API contract/types
│   ├── types/            # TypeScript type definitions
│   └── i18n/             # Internationalization
├── ui/                   # Vue 3 frontend
│   ├── src/
│   └── dist/             # Built frontend
├── shared/               # Shared code between API and UI
├── test-it/              # Integration tests
│   └── utils/            # Test utilities
├── upgrade/              # Database migration scripts
└── dev/                  # Development resources
    └── resources/        # Dev config (nginx, ldap, users)
```

## Important Configuration Files

### API Configuration
- **Default**: `api/config/default.cjs`
- **Development**: `api/config/development.cjs`
- **Test**: `api/config/test.cjs`
- **Custom Environment Variables**: `api/config/custom-environment-variables.cjs`
- **Type Schema**: `api/config/type/schema.json`

Key configuration options:
- `storage.type`: `'mongo'`, `'ldap'`, or `'file'`
- `publicUrl`: Public URL of the service
- `admins`: Array of admin email addresses
- `oauth.providers`: OAuth provider configurations
- `saml2.providers`: SAML2 identity providers
- `oidc.providers`: OIDC providers

## Running the Project

### Development
```bash
# Install dependencies
npm install

# Start development dependencies (MongoDB, LDAP, maildev, etc.)
npm run dev-deps

# Start API server (port 5689)
npm run dev-api

# Start UI dev server (port 6220)
npm run dev-ui

# Or use Zellij for both
npm run dev-zellij
```

### Testing
```bash
# Start test dependencies
npm run test-deps

# Run all tests
npm test

# Run specific test file
npm run test-base test-it/users.ts
```

### Quality Checks
```bash
# Lint
npm run lint

# Type check
npm run check-types

# Full quality check
npm run quality
```

## Testing Framework

Tests use Node.js native `node:test` runner. Test utilities in `test-it/utils/index.ts`:

- `axios()`: Create unauthenticated axios instance
- `axiosAuth()`: Create authenticated axios instance
- `createUser()`: Create a test user
- `clean()`: Clean database between tests
- `startApiServer()` / `stopApiServer()`: Control API server
- `waitForMail()`: Wait for email events
- `getAllEmails()` / `deleteAllEmails()`: Manage test emails

Test files are located in `test-it/` and test the following:
- `users.ts`: User CRUD operations
- `organizations.ts`: Organization management
- `invitations.ts`: Invitation system
- `ldap-storage.ts`, `ldap-api.ts`, `ldap-per-org-*.ts`: LDAP integration
- `oidc.ts`, `oidc-ldap.ts`: OIDC authentication
- `oauth.ts`: OAuth providers
- `2fa.ts`: Two-factor authentication
- `i18n.ts`: Internationalization
- `file-storage.ts`: File-based storage
- `password-lists.ts`: Password validation
- `pseudo-session.ts`: Pseudo-session authentication

## API Endpoints

The API is mounted at `/api/`:
- `/api/auth/*` - Authentication (login, password, OAuth, SAML, OIDC)
- `/api/users` - User management
- `/api/organizations` - Organization management
- `/api/invitations` - Invitation system
- `/api/2fa` - Two-factor authentication
- `/api/oauth-tokens` - OAuth token management
- `/api/sites` - Multi-site configuration
- `/api/password-lists` - Password validation
- `/api/avatars` - Avatar upload/retrieval
- `/api/mails` - Email configuration
- `/api/limits` - Rate limiting
- `/api/admin` - Admin operations

## Storage Backends

### MongoDB (Default)
Primary storage with collections:
- `users`
- `organizations`
- `invitations`
- `sites`
- `oauthTokens`
- `passwordLists`

### LDAP
Supports read-only or read-write LDAP directories. Configured in `api/config/default.cjs` under `storage.ldap`.

### File-based
Simple JSON file storage. Configured under `storage.file`.

## Authentication Methods

1. **Password**: Email/password authentication
2. **Passwordless**: Email magic links
3. **OAuth**: GitHub, Facebook, Google, LinkedIn
4. **OIDC**: Any OIDC-compliant provider
5. **SAML2**: SAML2 identity providers
6. **LDAP**: Direct LDAP authentication
7. **2FA**: TOTP-based two-factor authentication
8. **Pseudo-session**: Backend-to-backend session simulation

## Key Services

- **JWT Tokens**: `api/src/tokens/service.ts`, `api/src/tokens/keys-manager.ts`
- **Mail Service**: `api/src/mails/service.ts`
- **Storage Interface**: `api/src/storages/interface.ts`
- **Auth Service**: `api/src/auth/service.ts`

## Development Notes

1. **Node.js Version**: Uses `.nvmrc` for version management
2. **TypeScript**: Strict mode enabled, uses NodeNext module resolution
3. **ESM**: Project uses ES modules (`"type": "module"`)
4. **Path Aliases**: Defined in `api/package.json` imports section
5. **Multi-site**: Supports multiple sites with different themes/hosts
6. **Webhooks**: Configurable webhooks for identity events

## Common Tasks

### Add a new OAuth provider
1. Configure in `api/config/default.cjs` under `oauth.providers`
2. Provider must implement standard OAuth 2.0 flow

### Add a new storage backend
1. Implement `StorageInterface` from `api/src/storages/interface.ts`
2. Register in `api/src/storages/index.ts`
3. Configure in `api/config/default.cjs`

### Add a new API endpoint
1. Create router in appropriate `api/src/*/router.ts`
2. Add route to `api/src/app.ts`
3. Add types to `api/types/`
4. Add tests in `test-it/`

## Environment Variables

Key environment variables:
- `NODE_ENV`: `development`, `test`, or `production`
- `PORT`: Server port (default 8080)
- `STORAGE_TYPE`: Override storage type for tests
- `NODE_CONFIG_DIR`: Config directory path
- `IGNORE_ASSERT_REQ_INTERNAL`: Set to `'true'` to bypass internal request validation in tests

## Secret Keys Configuration

The `secretKeys` config option provides secrets for internal service-to-service communication:
- `identities`: For identity webhook events
- `events`: For event webhooks
- `sendMails`: For mail sending service
- `limits`: For rate limiting
- `readAll`: For admin read operations
- `sites`: For site management
- `pseudoSession`: For pseudo-session authentication (see below)

## Pseudo-Sessions

Pseudo-sessions allow backend-to-backend calls to simulate a user session (e.g., for search engine indexing or screenshot capture with Puppeteer).

### Configuration
Add `pseudoSession` to `secretKeys` in your config, or set the `SECRET_PSEUDO_SESSION` environment variable:
```javascript
secretKeys: {
  pseudoSession: 'your-secret-key'
}
```

### Usage
Call the endpoint with internal secret validation:
```bash
curl -X POST http://localhost:5689/api/auth/pseudo?key=your-secret-key \
  -H "Content-Type: application/json" \
  -d '{"type": "user", "id": "user-id"}'
```

Or for an organization:
```bash
curl -X POST http://localhost:5689/api/auth/pseudo?key=your-secret-key \
  -H "Content-Type: application/json" \
  -d '{"type": "organization", "id": "org-id", "role": "admin"}'
```

### Response
Returns session cookies (`id_token`, `id_token_sign`) but NOT `id_token_ex` (exchange token), which prevents keepalive. The session includes a `pseudoSession: true` flag in the payload.

### Testing Internal Routes
When testing routes that use `assertReqInternalSecret`, set the environment variable at the top of your test file:
```typescript
process.env.IGNORE_ASSERT_REQ_INTERNAL = 'true'
```
