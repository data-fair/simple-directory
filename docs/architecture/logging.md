# Logging

Everything the API logs goes through the unified logger of `@data-fair/lib-node` (pino), shared by
the whole data-fair stack:

```ts
import log from '@data-fair/lib-node/log.js'

log.info('a session was deleted', { code: 'sd.auth.session-delete' })
log.alert('a unauthorized user tried to activate admin mode', { code: 'sd.auth.password.not-admin' })
log.error('failed to rotate the signature keys', { code: 'sign-keys-rotation', err })
```

The full API (levels, output, error serialization, metrics, context rules) is the "Logging"
section of `node_modules/@data-fair/lib-node/README.md`. Only the conventions of this service are
listed here.

## Output

One JSON object per line on stdout when `NODE_ENV=production`, pretty output otherwise
(`pino-pretty`, a dev dependency of the api; `LOG_FORMAT=json|pretty` overrides). There is no
`df-event:` prefix any more: what used to be an "event" is a line with a `code`.

## Levels and codes

- `info`: normal operations and the audit trail (logins, membership changes, grants...).
- `warn`: client errors, rate limits and other expected but notable situations.
- `alert`: not a failure but deserves the same scrutiny (mostly security: admin mode refusals,
  exchange token reuse, refused SSO emails, dropped mails).
- `error`: internal failures only, never client errors.
- `debug`: through the `debug` module as before (`DEBUG=ns`), redirected into the logger.

`code` is a **static string**: audit lines keep their `sd.*` codes (`sd.auth.password.ok`...),
technical lines use short kebab-case codes (`ldap-prefill`). Ids, emails and hosts go in the message
or in other fields, never in the code. Errors go in `err`. `warn`, `alert` and `error` lines
increment `df_logs{level, code, host}`.

## Who and what

- The actor is never passed by hand: `session.middleware()` (lib-express) opens a log context per
  request with `ip`, `host`, `userId`, `userName`, `accountKey`, `accountDep`, `accountName`. The
  authorization server is mounted before it, so `app.ts` opens the `ip` / `host` part of the context
  for it.
- When the user is known but not in the session (yet) — password, passwordless, SSO logins,
  invitation acceptance, 2FA setup, the cleanup cron — the line adds `userLogFields(user)`
  (`api/src/utils/log-fields.ts`), which overrides the context.
- The organization an event is about (member changes, invitations, NHIs, partners) goes in the
  `owner*` fields, `orgLogFields(org, department?)`, like the resource owner in data-fair. The
  actor's own account stays in `account*`.
- Routes that learn the user / organization along the way fill a `logFields: LogFields` bag and
  spread it in each line.

## Rules

- eslint `no-console` applies to `api/src/**` and `api/index.ts`; `api/scripts/`, `dev/` and the
  tests keep `console`.
- Never log secrets, tokens, request headers or full documents; error objects are safe in `err`
  (whitelisted serializer).
- `withLogContext` scopes hold only small immutable values; long-lived resources (pools, intervals,
  caches) are created at startup outside any request scope.
