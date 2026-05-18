# Email send pipeline

How simple-directory accepts, sanitizes, templates and dispatches outbound
email. Required reading before changing anything under `api/src/mails/`,
either of the two `/api/mails*` routes, the MJML templates, or
`sendMailI18n`.

See also [`./email-trust-and-site-isolation.md`](./email-trust-and-site-isolation.md)
for how SSO email *claims* are verified — orthogonal to this doc, which
covers the SMTP-send path only.

## Why this surface is sensitive

The mail pipeline takes content from three populations of callers:

- **Internal services** (events, future others) post arbitrary `html` to
  `POST /api/mails` over a shared secret.
- **Anonymous web visitors** post arbitrary `text` to
  `POST /api/mails/contact` through any portal's contact form.
- **simple-directory itself** sends i18n-templated mail via `sendMailI18n`
  (signup, login, invitations, planned-deletion, …).

All three feed a single MJML pipeline in `api/src/mails/service.ts` that
does plain `String.replace`-style substitution before MJML parses. Any value
substituted into a template is HTML in the recipient's mail client; values
that reach `href=` / `src=` attributes are URLs in the recipient's mail
client. The trust boundary therefore lives at the **values**, not at the
template.

## Pipeline

```
caller payload
   │
   ▼
endpoint                          ─ schema validation       (api/types/mail/schema.js, api/contract/contact-mail.ts)
   │                              ─ auth / rate-limit       (assertReqInternal + secret, or session+IP-rate)
   ▼
escape / sanitize at boundary     (api/src/mails/escape.ts)
   │
   ▼
sendMailI18n (optional layer 1)   microTemplate(messages.mails[key][k], i18nParams)   ─ api/src/mails/service.ts
   │                              fills {host}, {origin}, {link}, {contact} into the i18n strings
   ▼
sendMail (layer 2, always)        microTemplate(template, tmplParams)                 ─ api/src/mails/service.ts:114
   │                              fills {htmlMsg}, {htmlCaption}, {htmlButton}, {htmlAlternativeLink}, {link}, {logo}, theme.* into the MJML
   ▼
mjml2html                         (MJML → HTML)
   │
   ▼
nodemailer transport              (api/src/mails/transport.ts)
```

`microTemplate` is `@data-fair/lib-utils/micro-template.js`, a literal
`String.replace` over `{key}` patterns — **no escaping**. The escape/
sanitize step in front of it is the only thing that keeps caller-controlled
HTML from reaching the recipient.

## Endpoints

### `POST /api/mails` — internal-only, secret-key gated

- File: `api/src/mails/router.ts:20-90`.
- Body: `api/types/mail/schema.js` — `to`, `subject`, `text?`, `html?`,
  `replyTo?`, `sender?`.
- Auth: `assertReqInternalSecret(req, config.secretKeys.sendMails)` (from
  `@data-fair/lib-express`). That helper enforces both the internal-origin
  check **and** the secret in one call, accepting the secret via the
  `x-secret-key` header (preferred) or the legacy `?key=` query param
  (kept as a deprecated fallback that logs a warning, so existing callers
  keep working while they migrate). The internal-origin check is bypassed
  in dev/test by `IGNORE_ASSERT_REQ_INTERNAL=1` (set by `npm -w api run dev`
  and `tests/support/in-process-server.ts`); in production it is
  unconditional.
- Sanitization of the `htmlMsg` value substituted into the MJML template:
  - `body.html` present → `sanitizeMailHtml(body.html)` — allow-list of
    safe tags, `href` restricted to `http` / `https` / `mailto`.
  - `body.html` absent → `textToSafeHtml(body.text)` — HTML-escape + `\n`→`<br>`.
- The plain-text part sent to nodemailer is `body.text` unmodified
  (recipients on text-only clients see what the caller composed).

### `POST /api/mails/contact` — anonymous, rate-limited

- File: `api/src/mails/router.ts:94-145`.
- Body: `api/contract/contact-mail.ts` — `from` (email), `subject`,
  `text`. **No `html` field by schema.**
- Auth: enabled only if `config.anonymousContactForm`; requires
  `req.body.token` (an anonymous-action token, used as a present-on-page
  proof) plus IP-based rate limit (1 req / 60s, mongo-backed via
  `RateLimiterMongo`).
- The `text` is wrapped with a "Message transmitted by the contact form of
  …" prefix and sent both as plain-text and as
  `textToSafeHtml(...)` → `htmlMsg`. The schema accepts text only, so the
  caller never gets to inject HTML.

### Direct `sendMailI18n` (internal, no HTTP)

- File: `api/src/mails/service.ts:75-83`.
- Callers: `api/src/auth/router.ts`, `api/src/users/router.ts`,
  `api/src/users/worker.ts`, `api/src/invitations/router.ts`,
  `api/src/organizations/router.ts`.
- The i18n templates (`api/i18n/{en,fr,…}.js`, `mails:` section) are
  authored alongside the service and contain HTML (`<a href="{origin}">`,
  …). The substituted values are derived from a validated URL:
  `sendMailI18n` asserts `params.link` is `http(s):` before deriving
  `{host}`, `{origin}`, `{path}`.

## Known external callers

| Service | Endpoint | Caller (file:line) | What reaches the template |
|---------|----------|---------------------|---------------------------|
| portals | `POST /api/mails/contact` | `portal/app/components/page-element/basic/page-element-contact.vue:354` | `text` (the form body — schema rejects html, server escapes) |
| events  | `POST /api/mails`         | `events/api/src/notifications/service.ts:65` | `html` (notification `htmlBody`, third-party-supplied) — sanitized by `sanitizeMailHtml` |
| sd internal | `sendMailI18n` direct | auth / users / invitations / organizations routers, users worker | i18n template HTML; substituted params come from validated URLs and trusted config |

## Templates

- `api/src/mails/generic-mail.mjml` — used when `params.htmlButton` is set.
  Placeholders inside `<mj-text>` (text context): `{htmlMsg}`,
  `{htmlAlternativeLink}`, `{link}`, `{htmlCaption}`. Inside attributes
  (URL context): `{logo}` (`src`), `{link}` (`href`),
  `{theme.colors.primary}` (`background-color`).
- `api/src/mails/generic-mail-nobutton.mjml` — same shape without the
  button block.
- `api/src/mails/{mail,mail-nobutton}.mjml` — optional operator-supplied
  overrides for the main site (loaded from disk at startup).
- A legacy `/webapp/server/mails/mail.mjml` path is still read for back-
  compat with a `console.error` to nag operators to migrate.

No template uses `<mj-include>`. Substitution happens *before* MJML parses,
so a value containing `<mj-include path="/etc/passwd"/>` would still be
honoured by mjml — that is why sanitization sits at the value boundary
above, not at the template.

## Operator-trusted inputs (bypass sanitization by design)

These values flow into the MJML pipeline unfiltered. They are part of the
same trust model as the rest of operator-supplied config:

- `config.mails.extraParams` (`api/src/mails/service.ts:109`) — spread last
  into `tmplParams`, so an operator can override anything.
- `config.theme.*`, `site.theme.*` — colours and `logo` URL.
- `config.contact`, `site.mails.contact`, `config.mails.from`,
  `site.mails.from` — addresses substituted as `{contact}` and used as
  `From:` / `replyTo`.
- Operator-supplied templates `mail.mjml` / `mail-nobutton.mjml`.

This matches the broader "main-site / operator config is fully trusted"
posture in [`./email-trust-and-site-isolation.md`](./email-trust-and-site-isolation.md).

## Invariants

1. `POST /api/mails` requires both a valid `sendMails` secret **and**
   `assertReqInternal(req)` — enforced by `assertReqInternalSecret`. The
   internal-origin check is unconditional in production (no env-var bypass).
2. Caller-supplied `html` to `POST /api/mails` is run through
   `sanitizeMailHtml` (a strict tag allow-list, `href` schemes restricted
   to `http`/`https`/`mailto`) before reaching the MJML substitution.
3. Caller-supplied `text` to either endpoint reaches `htmlMsg` only via
   `textToSafeHtml` (HTML-escape + `\n`→`<br>`).
4. The contact-form schema (`api/contract/contact-mail.ts`) admits `text`
   only; the server never reads an html field from the contact-form caller.
5. `sendMailI18n` rejects a `params.link` whose protocol is not `http:` or
   `https:`, so `{link}` (button `href`) and the derived `{origin}` /
   `{host}` cannot carry a `javascript:` / `data:` payload into an i18n
   template.
6. The MJML templates contain no `<mj-include>` and are not writable at
   runtime; placeholder substitution is the only injection surface, and
   it is gated by invariants 2–5.

Violations re-open the C-class injection paths flagged in the
2026-05 portals review around `microTemplate` + `mjml2html`.

## References

- `api/src/mails/router.ts` — both endpoints
- `api/src/mails/service.ts` — `sendMail`, `sendMailI18n`, MJML rendering
- `api/src/mails/escape.ts` — `textToSafeHtml`, `sanitizeMailHtml`
- `api/src/mails/generic-mail.mjml`, `generic-mail-nobutton.mjml`
- `api/types/mail/schema.js` — `/api/mails` body schema
- `api/contract/contact-mail.ts` — `/api/mails/contact` body schema
- `api/i18n/{en,fr,es,it,pt,de}.js` — i18n mail strings under `mails:`
- `tests/features/mails.api.spec.ts` — endpoint, sanitization, escape tests
