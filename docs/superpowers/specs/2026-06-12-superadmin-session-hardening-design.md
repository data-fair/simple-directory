# Superadmin session hardening — design

Date: 2026-06-12
Branch: feat-better-admin-sessions

## Goal

Strengthen access control around `adminMode` (superadmin privilege) sessions:

1. Always require a fresh TOTP for adminMode login when 2FA is configured —
   the long-lived 2FA cookie must not bypass it.
2. Bound the lifetime of adminMode sessions with a hard expiry instead of the
   indefinitely-renewed 30-day exchange token.
3. Force fresh authentication at the IdP for SSO adminMode logins.
4. Offer an in-login shortcut so a superadmin can enter adminMode in one login
   instead of the current double login, without weakening the above.

## Current behavior (reference)

- adminMode entry: `POST /auth/password` with `body.adminMode`
  (`api/src/auth/router.ts:197`). The login page accepts `?adminMode=true`
  with or without a prior session. SSO providers can carry `adminMode`
  through relay state.
- 2FA: required for superadmins only when `admins2FA: true`. The
  `id_token_2fa_<userId>` httpOnly cookie (`jwtDurations['2FAToken']`, 30d)
  skips the TOTP prompt for **all** logins, including adminMode
  (`api/src/auth/router.ts:216`).
- Durations: `idToken` 15m, `exchangeToken` 30d. `keepalive` re-issues the
  exchange token with a fresh 30d window on every call and preserves
  `adminMode` (`api/src/tokens/service.ts:268`), so an adminMode session is
  renewable indefinitely. `rememberMe` is already disallowed with adminMode,
  so cookies are browser-session-scoped — the only current limit.
- OIDC adminMode already sends `prompt=login`
  (`api/src/oauth/service.ts:124-126`); SAML sets no `ForceAuthn`
  (`api/src/auth/router.ts:850`).

## Design

### 1. Fresh TOTP on every adminMode login

In `POST /auth/password`, when `body.adminMode` is set and the user has 2FA
(active, or required via `storage.required2FA`), skip the `check2FASession`
cookie shortcut: an explicit `body['2fa']` TOTP code is mandatory.

- The `id_token_2fa_*` cookie keeps working for normal logins and is still
  written/refreshed on successful TOTP validation.
- If 2FA is neither configured nor required, behavior is unchanged ("always
  go through 2FA **if it is configured**").
- Recovery-token and bad-token paths unchanged.
- No UI change needed for the direct flow: the login page already shows the
  TOTP field on the `2fa-required` error.

### 2. Hard expiry for adminMode sessions

New config key `jwtDurations.adminExchangeToken`, default `12h` (same
string-duration format as the other `jwtDurations` entries, exposed through
the same env-var mechanism).

In `setSessionCookies` (`api/src/tokens/service.ts:114`), when the session
info payload carries `adminMode`:

- At session creation, sign the exchange token with
  `now + adminExchangeToken`.
- On keepalive renewals of the same adminMode session, **preserve the
  original `exp`** instead of extending it — an absolute cap from the moment
  adminMode was granted, not a rolling window.
- When the exchange token lapses, `keepalive`'s `verifyToken` fails → the
  existing logout path runs → full re-login (hard expiry, no silent
  downgrade).

Consequences accepted by design:

- `asAdmin` impersonation sessions carry `adminMode` in the exchange token
  and therefore get the same 12h cap (desirable).
- `DELETE /adminmode` (drop admin mode) returns the session to the normal
  30d exchange policy.
- `site_redirect` propagates adminMode to secondary-site sessions; those get
  the short exchange expiry there too (consistent).

### 3. SSO: force fresh IdP authentication

- SAML: add `ForceAuthn="true"` to the AuthnRequest when
  `relayState.adminMode` (via samlify SP settings at the
  `createLoginRequest` call site).
- OIDC: already covered by `prompt=login`; no change.
- SSO adminMode otherwise stays as-is: MFA is trusted to the IdP. This is a
  deployment decision — root-level OIDC/SAML providers are operator-declared
  — and is documented in the architecture doc. `prompt=login` / `ForceAuthn`
  are honored by trusted IdPs; SD does not verify `auth_time`.
- Resolve the stale `TODO: force re-submit password in this case ?` comments
  (`api/src/auth/router.ts:734`, `:840`).

### 4. In-login admin-mode shortcut

Replace the double login with an optional step inside the normal login flow:

- The SD login page sends `body.offerAdminMode: true` with normal password
  submits, only when adminMode would be permitted on that site (main site,
  or `config.adminModeOnSites`).
- API: after **full** successful validation (password + the normal-login 2FA
  rules), if the flag is set and `payload.isAdmin`, respond
  `{ step: 'adminMode' }` instead of the callback URL, creating no session.
- UI: a new login-page step — "continue in admin mode?" with a TOTP input
  (fresh-2FA rule from §1) — then resubmit with the password still held in
  form state:
  - accept → resubmit with `adminMode: 1` + TOTP code;
  - decline → resubmit without the flag → normal flow.
- Stateless; no response-shape change for existing consumers (data-fair's
  form-mode login never sends the flag). Fits the existing `step` mechanism
  in `login.vue` (`createOrga`, `plannedDeletion`).
- Cost: up to 3 password checks against the per-IP rate limiter in one login
  sequence — verify the limiter budget accommodates this.

### 5. Tests

- adminMode password login refuses the 2FA cookie and demands a fresh TOTP
  (cookie present → `2fa-required`).
- adminMode exchange token: absolute expiry — keepalive within the window
  renews the id_token but does not extend the exchange `exp`; keepalive
  after expiry returns 401 and clears the session (short duration in test
  config).
- `offerAdminMode` step: admin gets `{ step: 'adminMode' }`, non-admin gets
  the normal callback URL; accept and decline paths both produce correct
  sessions.
- SAML adminMode login request contains `ForceAuthn="true"`; non-adminMode
  does not (existing `.inproc` SAML tests).

### 6. Documentation

Update `docs/architecture/email-trust-and-site-isolation.md`:

- adminMode invariants gain the duration rule (hard 12h default cap) and the
  fresh-TOTP rule.
- State the SSO-MFA trust decision (IdP-enforced MFA, `ForceAuthn` /
  `prompt=login` on adminMode).

## Out of scope

- Periodic 2FA re-checks during an adminMode session (the hard expiry bounds
  the session instead).
- Requiring TOTP for superadmins on non-adminMode logins.
- Verifying `auth_time` / `ForceAuthn` honoring in SSO responses.
- Changing `admins2FA` default.
