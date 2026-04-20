# Email trust and site-level isolation

How simple-directory decides whether to trust an IdP's email claim, and how
that trust is confined to a single *site*. Required reading before changing
auth providers, `cleanUser`, `authProviderLoginCallback`, `adminMode`, or the
change-host flow.

## Why email is high-value

`user.email` drives admin rights (`config.admins`), account linking on SSO
(`getUserByEmail`), invitations, and org membership. An IdP that can make SD
accept an arbitrary email string can impersonate the corresponding user — up
to superadmin if the email is in `config.admins`.

## Sites as trust boundaries

A site is `(host, path)` with its own config, auth providers, and user scope.

- **Main site** — operator-managed, trusted by all sites.
- **Secondary site** — site-admin-editable, trusts only itself.

### User scoping

User records carry an optional `host`. `getUserByEmail(email, site)` only
matches the right scope, so a secondary-site SSO cannot resolve to a main-site
record by email collision.

### Admin rights require a main-site record

```js
isAdmin = !resource.host
  && (config.admins.includes(resource.email?.toLowerCase())
      || resource.id === '_superadmin')
```

A record tied to any secondary site can never be `isAdmin` — this is the core
guarantee preventing cross-site admin takeover.

Org membership is not site-scoped, but memberships attach to user records, so
a compromised site A cannot inherit memberships from another site.

## Email verification

Opt-in, fail-closed: absent a positive verification signal, login is refused.

- **OIDC** (`api/src/oauth/oidc.ts`) — requires `claims.email_verified === true`.
  Per-provider `ignoreEmailVerified: true` escape hatch, gated behind
  superadmin-level site-config editing.
- **Google** — requires `verified_email === true` on the v1 userinfo.
- **GitHub** — requires the address to be both `primary` and `verified`.
- **Facebook** — refused (no verification flag exposed).
- **LinkedIn** — primary email is considered verified upstream.
- **SAML 2** — no standard verified flag; adding a SAML IdP is an explicit
  trust statement. Site-level IdPs remain confined by user scoping.

### Monitoring

Rejections emit `eventsLog.alert` entries to monitor post-deployment:

- `sd.oidc.email-not-verified` — provider, raw `emailVerifiedClaim`, domain.
- `sd.oauth.email-not-verified` — provider, reason / claim value.

A non-zero rate on a previously working provider means the tightened check
(`!== true`, previously `=== false`) caught an IdP that used to pass
silently. Fix upstream, or set `ignoreEmailVerified: true` (OIDC only, as a
deliberate superadmin-level decision).

Implementation: `userInfo(accessToken, idToken?, logContext?)` takes an
optional log context; call sites with a request pass it, background paths
(e.g. token-refresh worker) omit it.

## Preventing SSO superadmin escalation

A main-site IdP is structurally capable of asserting an admin email. Two
defenses:

- **`allowSuperadmin` provider flag** — `authProviderLoginCallback` refuses
  the login when the session is on the main site, the matched user is admin,
  and the provider has not set `allowSuperadmin: true`. Default off.
- **`adminMode` is main-site only** — password and SSO login paths both
  refuse `adminMode=1` on any non-main-site session (redundant with the
  `!host` guard, kept as defense in depth).

## Change-host hardening

Password login into a secondary site with a main-site account offers a host
transfer. Sensitive: after the transfer, the record carries `host` and loses
admin status permanently. Two safeguards:

- Users in `config.admins` cannot be transferred (prevents phishing-driven
  superadmin lockout).
- Target `(host, path)` is signed into the action token; the `/host` endpoint
  applies the host from the decoded token, not the request body.

## Invariants

1. A secondary-site user record never carries admin status.
2. `adminMode=1` is only ever set on a main-site session.
3. An SSO provider never produces a superadmin session unless
   `allowSuperadmin: true`.
4. No SSO provider accepts an unverified email; the per-provider opt-out
   (OIDC only) requires a superadmin-level config edit.
5. A `changeHost` token's effect is bounded to the `(host, path)` it signs.

Violations re-open an exploit path in the C-0 family from
`docs/security-review-2026-04.md`.
