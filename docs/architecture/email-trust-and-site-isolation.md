# Email trust and site-level isolation

This document describes how simple-directory decides whether to trust the email
claim returned by an identity provider, and how that trust is confined to a
single *site* so that a compromise of one site's SSO configuration cannot bleed
into another. It is the reference for reviewers of any change that touches
authentication, site configuration, or the user model.

## Why email is a high-value claim

The user model keys several decisions off `user.email`:

- admin rights are derived from `config.admins` (a list of email strings) —
  see `cleanUser` in `api/src/storages/{mongo,ldap,file}.ts`.
- account linking on SSO login matches an incoming identity against an
  existing user by email (`getUserByEmail`) — see `authProviderLoginCallback`
  in `api/src/auth/service.ts`.
- invitations and organization membership are addressed by email.

An email claim we trust is therefore effectively an identity assertion. Any
identity provider that can make simple-directory accept an arbitrary email
string can impersonate the corresponding user — up to and including a
superadmin if that email appears in `config.admins`.

The trust model below defines where we accept an email claim, what verification
we demand before accepting it, and how we prevent a mistake or compromise in
one SSO configuration from having blast radius beyond its own site.

## Sites as trust boundaries

A *site* in simple-directory is identified by `(host, path)` and has its own
configuration, its own auth providers, and its own user scope.

- The **main site** is the deployment-wide identity authority. Its
  configuration lives in `api/config/default.cjs` (and overrides). Its auth
  providers are configured by the operator of the simple-directory instance,
  not by site admins.
- A **secondary site** has its own configuration stored in the `sites`
  collection, editable by its site admin. It can declare its own auth
  providers (`authProviders` on the site document).

Trust flows strictly top-down: the main site is trusted by all sites, but no
secondary site is trusted by the main site or by any other secondary site.

### User-record site scoping

User records carry an optional `host` field.

- Users with no `host` belong to the main site.
- Users with `host` set belong to a specific secondary site.

`getUserByEmail(email, site)` only returns records matching that site's
`(host, path)` — or records without `host` when called for the main site. A
secondary-site SSO login therefore cannot resolve to a main-site user record
by email collision. This is the primary site-isolation guarantee for the user
model.

### Admin rights require a main-site record

`cleanUser` computes `isAdmin` as:

```js
isAdmin = !resource.host
  && (config.admins.includes(resource.email?.toLowerCase())
      || resource.id === '_superadmin')
```

The `!resource.host` guard means that **a user record tied to a secondary site
can never carry admin status**, even if its email matches an entry in
`config.admins`. This is what prevents a compromised secondary-site SSO from
asserting an admin email and escalating to superadmin: the record it produces
is site-scoped, so `cleanUser` will never flag it as admin.

### Site-level auth providers cannot mint admin sessions

Because admin-ness requires a main-site user record, and because a site-level
SSO always creates/reuses site-scoped user records, a compromised site-level
SSO cannot mint a superadmin session. The blast radius of a bad site-level
SSO is confined to users of that site.

Org membership is *not* site-scoped today. A user created on site A cannot
automatically gain membership to an org owned by site B — because the
membership is attached to the user record, which itself belongs to site A.
A compromised site A can create an arbitrary user on A with a target email,
but that user does not inherit any membership or identity from the main site
or from any other site.

## Email verification for SSO providers

Every SSO provider in simple-directory is required to produce an email claim
that has been verified *by the provider*. The rule is opt-in, not opt-out:
absent a positive verification signal, the login is refused.

### OpenID Connect

`api/src/oauth/oidc.ts` rejects the login unless `claims.email_verified === true`.
A missing, null, or `false` claim all fail closed.

A per-provider escape hatch `ignoreEmailVerified: true` exists for operators
who trust a specific IdP to deliver pre-verified addresses outside the
standard claim. Setting it is a deliberate risk acceptance — the site-config
UI gates this field behind superadmin-level editing; it must not be exposed to
site admins.

### Standard OAuth providers

`api/src/oauth/standard-providers.ts`:

- **Google** — requires `verified_email === true` on the `v1/userinfo`
  response. Google enforces primary-email verification upstream for its
  consumer accounts; for Workspace customers the flag reflects the domain's
  configuration.
- **GitHub** — only accepts the email address that is both `primary` and
  `verified`. Unverified addresses attached to a GitHub account — including
  ones the attacker can add freely — are ignored.
- **Facebook** — refused. The Graph API does not expose an email-verification
  flag, and we cannot reconstruct one. Re-enabling Facebook would require
  implementing a dedicated email-confirmation flow at the simple-directory
  level.
- **LinkedIn** — LinkedIn's primary email is considered verified by LinkedIn
  before it is returned; no additional check.

### SAML 2

SAML does not standardize a verified-email claim. Accepting a SAML IdP is
therefore an explicit trust statement about the IdP: by adding it, the
operator declares that any email attribute it emits is trustworthy. For
secondary-site IdPs this trust is confined to that site by the user-scoping
rules above.

## Preventing SSO superadmin escalation

Even with verified-email checks in place, a main-site SSO provider is
structurally capable of asserting an admin email — the email is verified by
the IdP, not by simple-directory. A misconfigured or compromised main-site
IdP is a path to a superadmin session that we block by default.

### `allowSuperadmin` provider flag

`authProviderLoginCallback` refuses to complete an SSO login when all of the
following hold:

- the session is being minted on the main site (`site === undefined`), and
- the matched user has `isAdmin === true`, and
- the provider has not set `allowSuperadmin: true`.

The default is `false`. An operator who wants an admin to be able to log in
via a main-site SSO provider has to flip the flag explicitly, accepting that
the IdP is trusted to authenticate superadmins.

### `adminMode` is main-site only

`adminMode=1` is the privilege escalation that an admin asks for in a UI
action like "admin mode". It is now refused on any non-main-site session, both
on the password-login path (`api/src/auth/router.ts`) and on the SSO path
(`api/src/auth/service.ts`). This is redundant with the `!host` guard in
`cleanUser` — a secondary-site user cannot be `isAdmin` anyway — but it is
cheap defense in depth for any future relaxation of `cleanUser`.

## Protecting the main-site → secondary-site account transfer

Password login into a secondary site with a main-site account offers a
"change host" flow: the existing user record is relocated to the secondary
site so the user can continue with their known credentials.

This flow is a sensitive state change — after it completes, the record
carries `host`, and the `!host` admin guard drops its admin status
permanently. Two safeguards apply:

- **Admins cannot be transferred.** `api/src/auth/router.ts` refuses the
  change-host offer if the user is listed in `config.admins`. This prevents a
  phishing link ("click here to log in") pointing at an attacker-controlled
  secondary site from tricking a superadmin into detaching their own admin
  record.
- **The target host is signed into the action token.** `ActionPayload` now
  carries `host` and `path` for `action: 'changeHost'`, and
  `POST /api/users/:userId/host` applies the host taken from the decoded
  token, not the host given in the request body. A stolen action token cannot
  be replayed to relocate a user record to an arbitrary host.

## Invariants

When reviewing auth, storage, or site changes, preserve:

1. A secondary-site user record never carries admin status.
2. `adminMode=1` is only ever set on a main-site session.
3. An SSO provider never produces a superadmin session unless its
   configuration explicitly opts in via `allowSuperadmin`.
4. No SSO provider accepts an unverified email — default closed, per-provider
   opt-out only for OIDC and requiring a superadmin-level config edit.
5. A `changeHost` token's effect is bounded to the `(host, path)` bound into
   the token.

Violations of any of these unlock one of the exploit paths described in
`docs/security-review-2026-04.md` (C-0 family).
