# Per-recipient email rate limiting

## Problem

A bug in the code, a runaway webhook (e.g. emitted in a large loop), or another form of server abuse can cause Simple Directory to send a huge number of emails to the same user. There is currently no safeguard inside `sendMail` itself — only the `/mails/contact` form has an IP-based limiter, and the auth routes have their own limiter. Everything else (the `/mails` webhook fan-out, `sendMailI18n` from invitations / auth / users / organizations workers) goes straight to the SMTP transport.

The goal is to put a single, simple guard at the central chokepoint that protects a recipient's mailbox from being flooded, without breaking legitimate bulk sending patterns (org-wide announcements, batches of invitations).

## Goal

Add a daily per-recipient rate limit at the central `sendMail` function in `api/src/mails/service.ts`. When a recipient exceeds the limit, drop the email to that recipient silently and log via `internalError` for admin investigation.

## Non-goals

- No per-IP or per-sender limiting inside `sendMail`. The mailbox-protection use case is fully covered by per-recipient limiting.
- No retry / backoff / queueing. Silent skip is sufficient for the abuse cases we're guarding against.
- No change to the existing `/mails/contact` per-IP limiter or the auth limiter — they serve different purposes and remain in place.

## Design

### Defaults

- 500 emails per rolling 24h window, per recipient email address.
- Configurable via `config.mailsRateLimit.points` and `config.mailsRateLimit.duration` (seconds), following the pattern of `config.authRateLimit`.
- Environment overrides through `api/config/custom-environment-variables.cjs` (e.g. `MAILS_RATE_LIMIT_POINTS`, `MAILS_RATE_LIMIT_DURATION`).

### Behavior

1. Inside `sendMail(to, params, attachments)`, before any template rendering or transport call:
   - Parse `to` into individual addresses by splitting on `,`, trimming, and lowercasing each. The `/mails` webhook router joins organization members with `[...to].join(', ')`, so a single `sendMail` call can have many recipients.
   - For each address, consume 1 point from the mail rate limiter (`keyPrefix: 'sd-rate-limiter-mail'`).
   - Build a list of allowed addresses. For each rejected address, call `internalError('mail-rate-limited', ...)` with the address and the email subject so the source can be investigated.
2. If at least one address is allowed:
   - Rebuild `to` from the allowed addresses joined with `, ` and continue with the existing template-rendering + transport-sending logic unchanged.
3. If all addresses are rejected:
   - Log via `internalError` and return without invoking `mailsTransport.sendMail`. The caller does not see an error.

### Why silent skip rather than throw

Throwing from `sendMail` would surface to the calling route as a 5xx error. A buggy webhook in a loop would then keep retrying on failure, making the abuse worse. By skipping silently and logging at `internalError` level, the abuser stops being amplified, and the operator gets the signal they need to find the source.

### Why per-recipient and not per-sender

The threat model is "a single user's mailbox gets flooded". The sender is sometimes an internal worker (planned deletion notices, invitations cron) where per-sender limiting would break legitimate fan-out. Per-recipient limiting cleanly addresses the threat regardless of how many distinct call sites trigger sends.

### Why 500 / 24h

- An org-wide announcement to 100 members costs each recipient 1 / 500 of their daily quota — no interference with normal usage.
- A user invited to many orgs, receiving action emails from several workflows, or going through 2FA flows is well under this in any realistic scenario.
- A loop bug or runaway webhook emitting one mail per iteration hits the limit within minutes and stops being amplified to that mailbox.
- The value is configurable, so operators with unusual usage patterns can tune it.

## Components

### 1. Config

Add to `api/config/default.cjs` near the existing `authRateLimit`:

```js
mailsRateLimit: {
  points: 500,
  duration: 86400
},
```

Add to `api/config/custom-environment-variables.cjs` so the values can be overridden by environment variables, matching how other rate-limit / numeric values are exposed.

Test config (`api/config/test.cjs`): leave `mailsRateLimit` at production defaults (or higher) so existing mail-touching tests are unaffected. The rate-limit test exercises the limit by overriding the limiter directly in the test (see Testing below) rather than relying on a global low limit.

### 2. Limiter factory

Extend `api/src/utils/limiter.ts` (the file that already exports the auth limiter) with a second lazy-initialized `RateLimiterMongo`:

- `keyPrefix: 'sd-rate-limiter-mail'`
- `points: config.mailsRateLimit.points`
- `duration: config.mailsRateLimit.duration`

Export a named function (e.g. `mailLimiter()`) that returns the same shape as the existing auth limiter: `(key: string) => Promise<boolean>` — resolves to `true` if a point was consumed, `false` if the recipient is over the limit. Any other error from `RateLimiterMongo` rethrows, matching the existing pattern.

### 3. `sendMail` integration

In `api/src/mails/service.ts`, at the top of `sendMail`:

- Parse the recipient list (split on `,`, trim, lowercase).
- For each recipient address, call `mailLimiter()(address)`.
- If the limiter returns `false`, push the address into a `rejected` list; otherwise into an `allowed` list.
- For each rejected address, call `internalError('mail-rate-limited', { to: address, subject: params.subject })`.
- If `allowed.length === 0`, call one summary `internalError` and `return` (no transport call). Return `undefined`.
- Otherwise replace the local `to` with `allowed.join(', ')` and proceed with the existing logic unchanged.

The `events.emit('send', ...)` call (used by the maildev preview integration) should fire only for the actual send, after rate-limiting — so it stays where it is, just after the recipient filtering.

## Testing

New test file: `tests/mail-rate-limit.unit.spec.ts` (in-process server). The limiter is exercised at low `points` (e.g. 3) by injecting / monkey-patching at the test boundary — either by stubbing the exported limiter factory in `api/src/utils/limiter.ts`, or by constructing a fresh `RateLimiterMongo` with a unique `keyPrefix` and replacing the module-level reference in `sendMail` for the duration of the test. Pick whichever fits the existing test patterns best.

Cases:

1. **Single recipient over the limit:** call `sendMail` 4 times in a row to the same address with `points: 3`. Assert the SMTP transport (`mailsTransport.sendMail`) was invoked exactly 3 times, and `internalError` was logged for the 4th.
2. **Multi-recipient mixed:** pre-exhaust one recipient's bucket, then call `sendMail` with a comma-separated `to` containing both the exhausted address and a fresh one. Assert the transport is called once with `to` equal to only the fresh address.
3. **All recipients exhausted:** pre-exhaust two recipients, send to both. Assert the transport is not called and the function returns without throwing.

Existing mail-touching tests must continue to pass unchanged.

## Risks and edge cases

- **The `events.emit('send', ...)`** is used by the maildev preview / observability hooks. It should not fire for skipped recipients. Keep it after rate-limit filtering.
- **Address normalization:** lowercased + trimmed only — no full RFC 5321 normalization. Good enough for limiting; an attacker crafting case variations is not the threat model (this is a defense against accidental loops, not adversarial bypass).
- **MongoDB unavailable at startup:** `RateLimiterMongo` is created lazily on first use; same behavior as the existing auth and contact limiters.
