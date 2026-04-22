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

Per-provider, reject on an explicit negative signal. Providers that omit a
verification claim are accepted because enterprise directory-backed IdPs
(Azure AD / Entra ID, ADFS, corporate Keycloak fronting LDAP/AD) routinely
omit it while treating the directory-provisioned email as verified. A strict
opt-in check would break those integrations for a narrow residual win,
because the structural defenses below already contain the impact of a
looser IdP.

- **OIDC** (`api/src/oauth/oidc.ts`) — rejects only when
  `claims.email_verified === false`. Absent / null / non-boolean passes.
  Per-provider `ignoreEmailVerified: true` escape hatch, gated behind
  superadmin-level site-config editing, suppresses even the explicit-false
  rejection.
- **Google** — requires `verified_email === true` on the v1 userinfo
  (Google always emits this reliably, so strict opt-in is correct here).
- **GitHub** — requires the address to be both `primary` and `verified`.
- **Facebook** — refused (no verification flag exposed).
- **LinkedIn** — primary email is considered verified upstream.
- **SAML 2** — no standard verified flag; adding a SAML IdP is an explicit
  trust statement. Site-level IdPs remain confined by user scoping.

### Why OIDC is looser than the OAuth providers

The spec (OIDC Core §5.1) makes `email_verified` OPTIONAL for providers to
emit. In practice the population of providers that omit it is dominated by
enterprise directory-backed IdPs where the email is admin-provisioned and
implicitly verified, not self-asserted. The population that emits
`false` is dominated by self-registration IdPs before confirmation — those
we still reject. The thin slice in between (buggy provider that should
emit `false` but omits) is left to the structural defenses.

### Monitoring

Rejections emit `eventsLog.alert` entries to monitor post-deployment:

- `sd.oidc.email-not-verified` — provider, raw `email_verified` value, domain.
  Fires only on explicit `false`; fix upstream, or set
  `ignoreEmailVerified: true` on the provider (superadmin-level decision).
- `sd.oauth.email-not-verified` — provider, reason / claim value.

Implementation: `userInfo(accessToken, idToken?, logContext?)` takes an
optional log context; call sites with a request pass it, background paths
(e.g. token-refresh worker) omit it.

## Preventing SSO superadmin escalation

A main-site IdP is structurally capable of asserting an admin email. Defenses:

- **Standard OAuth providers cannot authenticate superadmins** —
  `authProviderLoginCallback` refuses when `provider.type === 'oauth'` and
  the matched user is admin. These providers (github / google / facebook /
  linkedin, from `config.oauth.providers`) are user-registration IdPs:
  anyone can create an account under an arbitrary email, so a collision
  with `config.admins` cannot be trusted as identity proof.
- **Root-level OIDC / SAML providers may authenticate superadmins.**
  Configured in `config.oidc.providers` / `config.saml2.providers` — these
  are operator-declared IdPs (corporate directory, SSO broker) where the
  email binding is trusted by deployment decision. Needed for on-premise
  deployments where the superadmin logs in via the company SSO.
- **Site-level providers are structurally incapable** of producing a
  superadmin session: user records on a secondary site carry `host`, and
  `isAdmin` requires `!host`.
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
3. A standard OAuth provider (`provider.type === 'oauth'`) never produces a
   superadmin session. Root-level OIDC / SAML providers may, by deployment
   decision.
4. No SSO provider accepts an unverified email; the per-provider opt-out
   (OIDC only) requires a superadmin-level config edit.
5. A `changeHost` token's effect is bounded to the `(host, path)` it signs.

Violations re-open an exploit path in the C-0 family from
`docs/security-review-2026-04.md`.
