# Session theft protections

What protects a session whose cookies were copied (malware on the device, a
backup of a browser profile, an XSS on an integrating service...). Required
reading before changing `setSessionCookies`, `keepalive`, `logout`, or the
`ServerSession` schema.

See also [`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md)
for how `adminMode` is granted in the first place.

## The two credentials

A session is carried by two tokens with very different lifetimes:

- **`id_token`** (+ `id_token_sign`, httpOnly) — the session token read by every
  service through `@data-fair/lib-express`. Short lived (`jwtDurations.idToken`,
  15 minutes), never verified against storage: services only check its signature.
- **`id_token_ex`** (httpOnly, path restricted to `/simple-directory/`) — the
  exchange token, the long lived credential (`jwtDurations.exchangeToken`,
  30 days, or `adminExchangeToken`, 12 hours, for `adminMode`). It is only ever
  sent to `POST /api/auth/keepalive`, which renews the `id_token`.

Stealing the exchange token is what gives durable access, so the protections
below are concentrated on the keepalive route. The `id_token` remains usable
until it expires: this is the accepted 15 minute window, narrowed for
superadmins by the IP binding below.

## Server sessions

Each authentication creates a `ServerSession` (`user.sessions`, stored in mongo
for the three storages). Deleting it — from the user's session list, from the
admin UI, or by any of the mechanisms below — makes the next keepalive fail,
which is the only way to revoke a session before its token expires.

It records how the session was created (`deviceName`, `ip`, and the `country` /
`asn` / `asnOrg` enrichment headers of the reverse-proxy) and how it is used
(`lastKeepalive`, `lastIp`, `lastCountry`, `lastAsn`, `lastAsnOrg`), so that a
suspicious session can be recognized by its owner.

## IP binding of superadmin sessions

When a session gets `adminMode` and `config.adminSessionIpBinding` is enabled
(default), the IP it was created from is written in both tokens: `ip` in the
exchange token, `boundIp` in the `id_token`. Requests coming from another
address are rejected:

- by `Session.req()` in `@data-fair/lib-express`, so **every** service refuses
  the `id_token`, not only simple-directory;
- by `keepalive`, which checks the exchange token even when the `id_token`
  already expired.

The binding is decided once, at session creation: renewals (keepalive, `asAdmin`
switches) copy the original IP instead of re-reading the request, otherwise a
stolen session would simply re-bind itself to the thief. This mirrors the hard
expiry of `adminMode` sessions, decided the same way.

The client IP is the first entry of `X-Forwarded-For`, which our reverse-proxy
overwrites — it cannot be spoofed by the client, but this **requires** a
correctly configured proxy chain.

Only superadmins are bound: normal users move between networks (mobile
handovers, dual-stack IPv4/IPv6, proxy farms) often enough that binding them
would mostly produce spurious logouts.

## Single use exchange tokens

Every exchange token issued carries a `jti` recorded on the server session.
Presenting a `jti` that is not the current one means two copies of the cookie
are in circulation: the session is destroyed (`sd.auth.keepalive.reuse` alert)
and its legitimate owner has to authenticate again — losing a session is the
intended outcome, it is how the thief is locked out.

The catch is that a browser can legitimately present an outdated token: several
tabs may fire a keepalive at the same time (they coordinate through
localStorage, but not across a session restore). The previous `jti` is therefore
still accepted during `exchangeTokenGrace` (one minute), and such a request
returns the current token as is instead of rotating again, so racing tabs
converge.

Consequences to keep in mind when changing this code:

- any flow issuing an exchange token must record its `jti` on the server session
  (this is why the write lives in `setSessionCookies`), otherwise the next
  keepalive destroys the session;
- sessions created before this mechanism have no `jti`, they are tolerated and
  get one at their next keepalive.
