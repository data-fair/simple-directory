# Superadmin manual partnership management

**Date:** 2026-06-12
**Status:** Approved design

## Problem

Adding a partner to an organization is a multi-step process: an org admin sends an
invitation by email, a signed `partnerInvitationToken` is generated, and the partner
organization's admin must accept it before the partnership is established. We want
superadmins to be able to bypass this entirely and **directly create and delete
partnerships** from the org page.

## Background — how partnerships work today

A partnership is an entry in `organization.partners[]` (see `api/types/partner/schema.js`):

```
{ id?, name, contactEmail, partnerId, createdAt }
```

- A **pending** invitation has no `id` (just `partnerId`, `name`, `contactEmail`).
- An **established** partnership has `id` set to the partner organization's id.

Normal flow (in `api/src/organizations/router.ts`, gated by `config.managePartners`):

1. `POST /:organizationId/partners` — org admin invites; `addPartner` pushes a pending
   entry and an email with a signed token is sent.
2. `POST /:organizationId/partners/_accept` — the partner org's admin accepts with the
   token; `validatePartner` sets the entry's `id` to the partner org's id.
3. `DELETE /:organizationId/partners/:partnerId` — removes the entry.

**Directionality:** the relationship is **one-directional**. Both invite and accept only
ever write to org A's `partners[]` (the entry's `id` points to org B). Nothing is written
to org B. Within simple-directory, `partners` is consumed only by
`GET /:organizationId/partners/_user-partners`, which lets a user who is a member of
partner org B act as a partner inside org A. So a partnership A→B means "B is a partner of A".

**Authorization today:** the partner endpoints use `isOrgAdmin(req)`, which deliberately
does **not** include superadmins/`adminMode` — only real org admins (or matching site
admins). A superadmin who is not a member currently cannot manage partners at all.

## Design

### Backend (`api/src/organizations/router.ts`, inside `if (config.managePartners)`)

**New endpoint `POST /:organizationId/partners/_create` — superadmin only.**

- Authorization: `reqUser(req)?.adminMode` (returns 403 otherwise). Org admins keep using
  the invite flow; this endpoint is the manual override.
- Request body validated by a new doc schema `post-partner-create-req`:
  `{ id: string, contactEmail?: string, name?: string }`.
- Behavior:
  1. Load org A (`req.params.organizationId`) → 404 if missing.
  2. Load org B (`body.id`) → 404 if missing.
  3. Reject if B is already a partner of A (mirror `_accept`'s `conflictInvitation`
     check on `p.id === B.id`).
  4. Build a fully-established `Partner`:
     ```
     { id: B.id, name: body.name ?? B.name, contactEmail: body.contactEmail ?? '',
       partnerId: nanoid(), createdAt: new Date().toISOString() }
     ```
  5. Persist by **reusing `storage.addPartner`** — it `$push`es the given partner object
     verbatim, so passing one with `id` already set yields an established partnership.
     No new storage method is required.
  6. Emit an `eventsLog.info('sd.org.partner.create', …)` entry.
- `contactEmail` is optional and defaults to `''` (it is not meaningful for a manually
  created partnership; the stored `Partner.contactEmail` schema is a plain string with no
  format constraint, so `''` is valid).

**Existing `DELETE /:organizationId/partners/:partnerId` — add adminMode bypass.**

Change the guard from `if (!await isOrgAdmin(req))` to
`if (!reqUser(req)?.adminMode && !await isOrgAdmin(req))` so a superadmin who isn't a
member can delete a partnership.

### UI

**`ui/src/pages/organization/[id]/index.vue`** — make the partners section visible to
superadmins who aren't members: change the `v-if` on `<organization-partners>` from
`$uiConfig.managePartners && showDetailedManagement` to
`$uiConfig.managePartners && (showDetailedManagement || session.user.value?.adminMode)`.

**`ui/src/components/organization-partners.vue`** — `writablePartners` gains an adminMode
branch so the superadmin gets the add action and per-row delete:
`isAdminOrga && (!readonly || …) || adminMode`. The existing `delete-partner-menu` is
reused unchanged (it calls `DELETE`).

**New component `ui/src/components/add-partner-superadmin-menu.vue`** — rendered only when
`adminMode`, in addition to the existing `add-partner-menu`:

- A menu/dialog with a `v-autocomplete` that searches `GET organizations?q=<input>`
  (debounced) and lists existing orgs by name.
- An optional `contactEmail` text field (blank allowed).
- On confirm: `POST organizations/${orga.id}/partners/_create` with
  `{ id: selectedOrg.id, contactEmail }`, then `emit('change')`.

The normal `add-partner-menu` (invite-by-email) stays for org admins.

### Types

Add `api/doc/organizations/post-partner-create-req/schema.js` following the convention of
`post-partner-req/schema.js` (with `'x-exports': ['types', 'validate']`), then run
`npm run build-types` to generate the `.type/validate.js` + types.

## Testing

API test (extend the existing partners API spec):

- Superadmin `POST …/partners/_create` against an existing org → org A's `partners[]`
  gains an entry with `id` set; no email is sent.
- Superadmin `DELETE …/partners/:partnerId` removes it.
- A non-superadmin (plain user or org admin) calling `_create` gets `403`.

## Out of scope

- Bidirectional partnerships (superadmin repeats the action the other way if needed).
- Changing the existing invite/accept flow or its authorization.
