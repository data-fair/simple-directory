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

Only superadmins are bound among human sessions: normal users move between
networks (mobile handovers, dual-stack IPv4/IPv6, proxy farms) often enough that
binding them would mostly produce spurious logouts.

The same `boundIp` claim, with the same `Session.req()` enforcement, is also
available to non-human identities as a per-NHI opt-in — an org admin decides,
because only they know whether that service account calls from a stable address.
Only the `id_token` half applies there: an NHI has no exchange token and cannot
renew, so the `keepalive` check below is irrelevant to it. See
[`non-human-identities.md`](non-human-identities.md).

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

This tolerance must stay bounded by time. Accepting the previous `jti` hands out
the current token, so without a time limit a thief who used a copied token first
and the owner still holding the previous one would both keep converging on each
new token, and the replay would never be detected. With the window, the owner's
next keepalive (every ten minutes in the SPA) comes too late and destroys the
session. The price is that a client which missed a rotation (aborted request,
lost response) and stays idle past the window is logged out. That is rare, since
a keepalive is fast and an active client usually sends the next one within the
window.

Concurrent keepalives need a second guarantee: several tabs restored at once all
start from the same token, and minting one successor each would leave the
browser holding a token the server did not keep — a replay at the next
keepalive, whatever the grace window. This is the likely cause of superadmins
being logged out repeatedly (they rotate most often, through `/asadmin` and
`/adminmode`). The rotation write is therefore a compare-and-swap on the token
being superseded (`updateSessionById`'s `expectedJti`). Losing the swap proves
the winner already committed, so the loser reads the winning token back and
serves it unchanged.

Consequences to keep in mind when changing this code:

- any flow issuing an exchange token must record its `jti` on the server session
  (this is why the write lives in `setSessionCookies`), otherwise the next
  keepalive destroys the session;
- the rotation write must stay a compare-and-swap: a blind `$set` lets two
  concurrent keepalives record different successors, and the next keepalive
  reports the loser's token as a theft;
- sessions created before this mechanism have no `jti`, they are tolerated and
  get one at their next keepalive.
