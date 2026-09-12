# Main site configuration: database document vs environment

What the main site reads from a database document and what it reads from
environment variables, and why the API reports rather than refuses. Required
reading before changing `api/src/sites/main-site.ts`, the `/api/sites/_*`
presentation endpoints, `getSiteExtraParams` in `api/src/sites/spa-params.ts`,
or the mail theming path in `api/src/mails/service.ts`.

See also [`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md)
for why the main site is a load-bearing security concept.

## The problem this solves

An install whose `publicUrl` host *also* carries a site document in mongo had
two writable sources of configuration for the same host, and three resolution
paths disagreeing about which one wins.

**Path A — `reqSite(req)`** (`api/src/sites/service.ts`) is authoritative for
nearly everything:

```ts
if (siteUrl && !config.publicUrl.startsWith(siteUrl) && siteUrl !== `http://simple-directory:${config.port}`) {
  … look the site up in mongo …
}
// else: returns undefined
```

On the `publicUrl` host it returns `undefined` and the document is never even
looked up, so every consumer falls back to `config.*`.

**Path B — `getSiteByUrl` / `getSiteByHost`** is a raw mongo lookup with no
`publicUrl` exclusion. Two callers used it instead of `reqSite`: the SPA HTML
injection and the mail templating.

**Path C — `config.*`**, the environment.

With no document on the `publicUrl` host all three agree and the problem is
invisible. With one, A and B disagreed *within the same request*.

That produced a live bug: `getSiteExtraParams` read the document for
`THEME_CSS_HASH` while `GET /api/sites/:hash/_theme.css` called `reqSite` and
served the **env** CSS — under `Cache-Control: max-age=31536000, immutable`. The
hash did not describe the bytes served under it, so an env theme change never
busted the cache and a change to the ignored document busted it for nothing.

## The main site document

A **main site document** is a site doc whose `host` + `path` matches
`config.publicUrl` (`isMainSiteDoc` in `api/src/sites/service.ts`). It is
honoured for **presentation only**.

`reqSite()` still returns `undefined` on that host. This is deliberate and
load-bearing: `reqSite() === undefined` *is* the definition of "main site"
across the trust model.

- `isAdmin = !user.host` — storage rule, invariant #1
- `getUserByEmail(email, undefined)` filters `host: {$exists: false}`
- `adminMode` is refused on any session where `reqSite()` returns a site —
  invariant #2

Making `reqSite` return the document would scope every main-host account to
that host: existing unscoped users become unreachable and no session can obtain
`adminMode`. Nothing under `api/src/auth/`, `api/src/tokens/` or
`api/src/storages/` participates in this feature.

When `config.manageSites` is false there is never a main site document.

## `MAIN_SITE_FROM_DB`

`config.mainSiteFromDb` lists which categories come from the document.
Environment: `MAIN_SITE_FROM_DB='["theme","title","mails","registration"]'`. The
items are constrained by an `enum` in `api/config/type/schema.json`, so an
unknown category refuses to start.

| Category | Site fields | Env fallback |
|---|---|---|
| `theme` | `theme` (colors, logo, fonts, `preloadLinks`) | `config.theme` |
| `title` | `title` | `'Simple Directory'` |
| `mails` | `mails.from`, `mails.contact` | `config.mails.from`, `config.contact` |
| `registration` | `tosMessage`, `reducedPersonalInfoAtCreation` | none |

Fallback is per-category, not per-key: a document's `theme` is already
`fillTheme`'d against `config.theme` when written, so a stored theme is always
complete.

Logo order on the main site is `doc.theme.logo` → `config.theme.logo` → the
document owner's avatar. Unlike an ordinary site the owner avatar is the last
resort, because the main site's identity is the operator's, not the owning
organisation's.

**Never read from the document, whatever the list contains:** `authMode`,
`authOnlyOtherSite`, `authProviders`, `applications`, `isAccountMain`, `owner`,
and user scoping. `getPublicSiteInfo` for the main site forces `main: true`,
`isAccountMain: true` and `authMode: 'onlyLocal'`.

The default is `[]` in 8.x, so no existing install changes behaviour on
upgrade. 9.0 will default to the full list.

## One resolver

`api/src/sites/main-site.ts` owns the merge. Every presentation consumer goes
through it, so paths A and B can no longer disagree:

- the `/api/sites/_*` endpoints in `api/src/sites/router.ts`
- `getSiteExtraParams` in `api/src/sites/spa-params.ts`, which feeds the served
  HTML. It is routed through the resolver **unconditionally**, independent of
  `mainSiteFromDb` — with an empty list the resolver returns pure env values, so
  both sides agree. This is the cache-hash bug fix.
- `api/src/mails/service.ts`

Hashes are computed from the content actually served, never from the document's
`updatedAt` alone, so `_hashes` and `/:hash/_theme.css` cannot diverge again.

The env baseline constants (`defaultThemeCss`, `defaultPublicSiteInfo` and their
hashes) are **kept**: `ui/vite.config.ts` imports them to inject the dev
server's HTML and must not reach into mongo. The resolver returns those same
constants when no category contributes, so dev and prod inject identical hashes.

### Blast radius beyond simple-directory

`GET /api/sites/_hashes` is what every other data-fair service calls
(`@data-fair/lib-express/serve-spa.js`, with `x-forwarded-host`). Enabling the
`theme` category propagates the document's theme to data-fair, processings,
catalogs, metrics and events served on that host, not only to
simple-directory's own pages. This is intended.

## The API refuses nothing

An earlier design had `PATCH /api/sites/:id` return 400 on the main document for
the never-honoured fields. It was rejected, and should not be reintroduced:

- `ui/src/pages/admin/sites/[id].vue` builds its patch as a **full-document
  round-trip** (it clones the fetched site and deletes only `_id`,
  `colorWarnings`, `mainSiteWarnings`, `owner`, `host`, `path`). `authMode` is
  `required` in the Site schema, so it is always present. Changing a single
  colour on the main document would have returned 400. Hiding the field in the
  VJSF layout would not help — the key stays in the data.
- The guard protected nothing. The only non-UI writer is portals
  (`api/src/portals/service.ts` in the portals repo), which only `POST`s, and
  `POST`'s body schema is already limited to `_id, owner, host, path, tmp,
  title, theme` and `contact`.

The risk being managed is operator *confusion*, not privilege: these fields are
inert here. Confusion is addressed where it occurs, in the admin UI.

**Instead, `mainSiteWarnings`.** `GET /api/sites/:id` and the `showAll` list
carry it alongside `colorWarnings`, built in `prepareFullSite` and localised
through `reqI18n`: one entry per never-honoured field the document carries, one
per category stored but absent from `MAIN_SITE_FROM_DB`. The boot check in
`api/src/server.ts` logs the same report and raises an `internalError` when the
document carries an inert field.

**One side effect is suppressed, not refused.** `PATCH` runs `toggleMainSite()`
whenever `patch.isAccountMain` is truthy, rewriting every *other* site of the
owner to `authMode: 'onlyOtherSite'`. With a full-document round-trip that
re-fires on every save, so it is skipped on the main document. The request still
succeeds; only the effect is skipped, so no caller breaks.

## Admin UI

`/admin/sites` badges the main site document and folds `mainSiteWarnings` into
the existing warnings menu. Its edit page shows a banner explaining the split
and lists the warnings.

The auth sections stay **visible**: the form round-trips them, so hiding would
conceal the values the warnings refer to. Only `isAccountMain` is withheld
(`layout.if: '!context.isMainSite'` on the property in
`api/types/site/schema.js`), being the one field whose write reaches beyond the
document.

Because the patch schema is `additionalProperties: false`, the computed
`mainSiteWarnings` must be stripped from the patch body like `colorWarnings`
is — otherwise every save of the main document fails with a 400.
