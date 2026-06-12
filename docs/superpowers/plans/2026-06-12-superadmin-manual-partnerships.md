# Superadmin Manual Partnership Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let superadmins directly create (against an existing organization) and delete partnerships from the org page, bypassing the email-invitation/token flow.

**Architecture:** A new superadmin-only `POST /organizations/:organizationId/partners/_create` endpoint builds a fully-established `Partner` (with `id` set to the chosen org) and persists it by reusing `storage.addPartner`. The existing `DELETE` endpoint gains an `adminMode` bypass. The UI shows the partners section to non-member superadmins and adds an org-search "add partner" dialog.

**Tech Stack:** Node.js + Express 5 + TypeScript API, JSON-schema doc codegen (`df-build-types`), Vue 3 + Vuetify UI, Playwright tests, MongoDB storage.

**Reference spec:** `docs/superpowers/specs/2026-06-12-superadmin-manual-partnerships-design.md`

---

## Task 1: Request-validation doc schema for `_create`

**Files:**
- Create: `api/doc/organizations/post-partner-create-req/schema.js`
- Create: `api/doc/organizations/post-partner-create-req/index.ts`
- Generated (by build-types): `api/doc/organizations/post-partner-create-req/.type/index.js`, `.type/validate.js`

- [ ] **Step 1: Write the schema file**

Create `api/doc/organizations/post-partner-create-req/schema.js` (mirrors `post-partner-req/schema.js`; only `id` is required, `name` and `contactEmail` are optional, `contactEmail` has no `format` so `''` is acceptable):

```js
export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/post-partner-create-req',
  'x-exports': [
    'types',
    'validate'
  ],
  title: 'Post partner create req',
  type: 'object',
  required: [
    'body'
  ],
  properties: {
    body: {
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        contactEmail: {
          type: 'string'
        }
      }
    }
  }
}
```

- [ ] **Step 2: Write the index.ts re-export**

Create `api/doc/organizations/post-partner-create-req/index.ts` (identical pattern to `post-partner-req/index.ts`):

```ts
export * from './.type/index.js'
```

- [ ] **Step 3: Generate the types + validate function**

Run: `npm run build-types`
Expected: command completes without error and creates `api/doc/organizations/post-partner-create-req/.type/validate.js` (exporting `returnValid`) and `.type/index.js`.

- [ ] **Step 4: Verify the generated validate file exists**

Run: `ls api/doc/organizations/post-partner-create-req/.type/`
Expected: lists `index.js` and `validate.js`.

- [ ] **Step 5: Commit**

```bash
git add api/doc/organizations/post-partner-create-req/
git commit -m "feat(api): add post-partner-create-req doc schema"
```

---

## Task 2: Backend `_create` endpoint + `DELETE` adminMode bypass (TDD)

**Files:**
- Modify: `api/src/organizations/router.ts` (import line 1; partner endpoints in the `if (config.managePartners)` block, ~lines 395-504)
- Test: `tests/features/organizations.api.spec.ts`

Note: run API tests with `IGNORE_ASSERT_REQ_INTERNAL=true`. The superadmin email is `admin@test.com` (configured in `api/config/test.cjs`). `createUser(email, true)` returns an `adminMode` axios client.

- [ ] **Step 1: Write the failing test**

Add this test inside the `test.describe('organizations api', …)` block in `tests/features/organizations.api.spec.ts` (after the existing `'should invite a new partner in an organization'` test):

```ts
test('should let a superadmin manually create and delete a partnership', async () => {
  // org A owned by a normal user
  const { ax } = await createUser('test-screate-owner@test.com')
  const org = (await ax.post('/api/organizations', { name: 'Org A' })).data
  ax.setOrg(org.id)

  // org B owned by another normal user
  const { ax: axB } = await createUser('test-screate-partner@test.com')
  const orgB = (await axB.post('/api/organizations', { name: 'Org B' })).data

  // superadmin client
  const adminAx = await createUser('admin@test.com', true)

  // a normal org admin must NOT be able to use the superadmin endpoint
  await assert.rejects(
    ax.post(`/api/organizations/${org.id}/partners/_create`, { id: orgB.id }),
    (res: any) => res.status === 403
  )

  // superadmin creates an already-established partnership, no email sent
  await adminAx.ax.post(`/api/organizations/${org.id}/partners/_create`, { id: orgB.id })

  let orgInfo = (await ax.get(`/api/organizations/${org.id}`)).data
  assert.equal(orgInfo.partners.length, 1)
  assert.equal(orgInfo.partners[0].id, orgB.id)
  assert.equal(orgInfo.partners[0].name, 'Org B')
  assert.ok(orgInfo.partners[0].partnerId)

  // creating the same partnership again is rejected
  await assert.rejects(
    adminAx.ax.post(`/api/organizations/${org.id}/partners/_create`, { id: orgB.id }),
    (res: any) => res.status === 400
  )

  // superadmin deletes it (not a member of org A)
  await adminAx.ax.delete(`/api/organizations/${org.id}/partners/${orgInfo.partners[0].partnerId}`)
  orgInfo = (await ax.get(`/api/organizations/${org.id}`)).data
  assert.equal(orgInfo.partners.length, 0)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `IGNORE_ASSERT_REQ_INTERNAL=true npm run test-base tests/features/organizations.api.spec.ts -- -g "manually create and delete a partnership"`
Expected: FAIL — the `_create` POST returns 404/route-not-found (endpoint does not exist yet), so the assertions don't hold.

- [ ] **Step 3: Add `Partner` to the type import**

In `api/src/organizations/router.ts`, change line 1 from:

```ts
import type { Member, Organization } from '#types'
```

to:

```ts
import type { Member, Organization, Partner } from '#types'
```

- [ ] **Step 4: Add the `_create` endpoint**

In `api/src/organizations/router.ts`, inside the `if (config.managePartners) { … }` block, immediately after the `router.post('/:organizationId/partners/_accept', …)` handler (i.e. before the existing `router.delete('/:organizationId/partners/:partnerId', …)`), insert:

```ts
  // Superadmin-only: directly create an established partnership with an existing organization
  router.post('/:organizationId/partners/_create', async (req, res, next) => {
    const logContext: EventLogContext = { req }
    const user = reqUser(req)

    if (!user) return res.status(401).send()
    if (!user.adminMode) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

    const { body: partnerCreate } = (await import('#doc/organizations/post-partner-create-req/index.ts')).returnValid(req)

    const storage = storages.globalStorage

    const orga = await storage.getOrganization(req.params.organizationId)
    if (!orga) return res.status(404).send()
    logContext.account = { type: 'organization', id: orga.id, name: orga.name }

    const partnerOrga = await storage.getOrganization(partnerCreate.id)
    if (!partnerOrga) return res.status(404).send('unknown organization')

    const conflict = (orga.partners || []).find(p => p.id === partnerOrga.id)
    if (conflict) return res.status(400).send('cette organisation est déjà partenaire')

    const partner: Partner = {
      id: partnerOrga.id,
      name: partnerCreate.name ?? partnerOrga.name,
      contactEmail: partnerCreate.contactEmail ?? '',
      partnerId: nanoid(),
      createdAt: new Date().toISOString()
    }
    await storage.addPartner(orga.id, partner)

    eventsLog.info('sd.org.partner.create', `a superadmin manually created a partnership ${partnerOrga.name} (${partnerOrga.id}) of ${orga.name} (${orga.id})`, logContext)

    res.status(201).send()
  })
```

- [ ] **Step 5: Add the adminMode bypass to the DELETE handler**

In the same file, in `router.delete('/:organizationId/partners/:partnerId', …)`, change:

```ts
    if (!reqUser(req)) return res.status(401).send()
    if (!await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
```

to:

```ts
    if (!reqUser(req)) return res.status(401).send()
    if (!reqUser(req)?.adminMode && !await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `IGNORE_ASSERT_REQ_INTERNAL=true npm run test-base tests/features/organizations.api.spec.ts -- -g "manually create and delete a partnership"`
Expected: PASS.

- [ ] **Step 7: Run the full organizations spec to check for regressions**

Run: `IGNORE_ASSERT_REQ_INTERNAL=true npm run test-base tests/features/organizations.api.spec.ts`
Expected: all tests PASS (including the existing `'should invite a new partner'`).

- [ ] **Step 8: Type-check**

Run: `npm run check-types`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add api/src/organizations/router.ts tests/features/organizations.api.spec.ts
git commit -m "feat(api): superadmin direct create/delete of partnerships"
```

---

## Task 3: UI — expose partner management to superadmins

**Files:**
- Create: `ui/src/components/add-partner-superadmin-menu.vue`
- Modify: `ui/src/components/organization-partners.vue`
- Modify: `ui/src/pages/organization/[id]/index.vue` (the `<organization-partners>` `v-if`, ~line 146)

- [ ] **Step 1: Create the superadmin add-partner component**

Create `ui/src/components/add-partner-superadmin-menu.vue`. It mirrors `add-partner-menu.vue` but selects an existing organization via a remote-search autocomplete and posts to `_create`:

```vue
<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addPartner')"
        size="small"
        color="admin"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      data-iframe-height
      :width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.addPartner') }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-autocomplete
            v-model="selectedOrg"
            :label="$t('common.organization')"
            :items="orgItems"
            :loading="search.loading.value"
            item-title="name"
            item-value="id"
            return-object
            no-filter
            :rules="[v => !!v || '']"
            name="partnerOrg"
            required
            density="compact"
            variant="outlined"
            autocomplete="off"
            @update:search="onSearch"
          />
          <v-text-field
            v-model="contactEmail"
            :label="$t('common.contactEmail')"
            name="contactEmail"
            density="compact"
            variant="outlined"
            autocomplete="off"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="confirmCreate.execute()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const { orga } = defineProps({
  orga: { type: Object as () => Organization, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)
const createForm = ref<InstanceType<typeof VForm>>()
const selectedOrg = ref<{ id: string, name: string } | null>(null)
const contactEmail = ref('')
const orgItems = ref<{ id: string, name: string }[]>([])

watch(menu, () => {
  if (!menu.value) return
  selectedOrg.value = null
  contactEmail.value = ''
  orgItems.value = []
  createForm.value?.reset()
})

const search = useAsyncAction(async (q: string) => {
  const res = await $fetch('organizations', { params: { q } }) as { results: { id: string, name: string }[] }
  orgItems.value = res.results
})
const onSearch = (q: string) => {
  if (!q || (selectedOrg.value && q === selectedOrg.value.name)) return
  search.execute(q)
}

const confirmCreate = useAsyncAction(async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid && selectedOrg.value) {
    menu.value = false
    await $fetch(`organizations/${orga.id}/partners/_create`, {
      method: 'POST',
      body: { id: selectedOrg.value.id, contactEmail: contactEmail.value || undefined }
    })
    sendUiNotif({ type: 'success', msg: t('common.modificationOk') })
    emit('change')
  }
})
</script>

<style lang="css" scoped>
</style>
```

- [ ] **Step 2: Wire the superadmin menu + adminMode write into `organization-partners.vue`**

In `ui/src/components/organization-partners.vue`:

(a) In the `<h2>` header, after the existing `<add-partner-menu … />` block, add the superadmin menu:

```vue
        <add-partner-superadmin-menu
          v-if="adminMode"
          :orga="orga"
          @change="$emit('change')"
        />
```

(b) In the `<script setup>` block, add a session import and an `adminMode` computed, and include it in `writablePartners`. Change:

```ts
const writablePartners = computed(() => isAdminOrga && (!$uiConfig.readonly || $uiConfig.orgStorageOverwrite?.includes('partners')))
```

to:

```ts
const session = useSession()
const adminMode = computed(() => !!session.user.value?.adminMode)
const writablePartners = computed(() => (isAdminOrga && (!$uiConfig.readonly || $uiConfig.orgStorageOverwrite?.includes('partners'))) || adminMode.value)
```

- [ ] **Step 3: Show the partners section to non-member superadmins**

In `ui/src/pages/organization/[id]/index.vue`, change the `<organization-partners>` `v-if` from:

```vue
      v-if="$uiConfig.managePartners && showDetailedManagement"
```

to:

```vue
      v-if="$uiConfig.managePartners && (showDetailedManagement || session.user.value?.adminMode)"
```

- [ ] **Step 4: Lint and type-check the UI**

Run: `npm run lint && npm run check-types`
Expected: no errors. (i18n keys used — `common.organization`, `common.contactEmail`, `common.confirmCancel`, `common.confirmOk`, `common.modificationOk`, `pages.organization.addPartner` — all already exist in `api/i18n/en.js`, which is the source of UI messages.)

- [ ] **Step 5: Manual verification**

With the dev environment running, log in as the superadmin (`admin@test.com`) and enable admin mode. Navigate to an organization's page you are NOT a member of. Confirm:
- the Partners section is visible,
- the superadmin "+" button opens a dialog with an org-search autocomplete,
- selecting an org and confirming adds an established partner (avatar + name shown, no "email not confirmed" warning),
- the delete button on a partner row removes it.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/add-partner-superadmin-menu.vue ui/src/components/organization-partners.vue "ui/src/pages/organization/[id]/index.vue"
git commit -m "feat(ui): superadmin manual partnership management"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 = doc schema/types; Task 2 = `_create` endpoint, DELETE adminMode bypass, conflict check, one-directional established partner via `addPartner`, contactEmail optional/default `''`, API tests (create, delete, 403, duplicate-400); Task 3 = partners section visibility for superadmins, `writablePartners` adminMode branch, new org-search add component. All spec sections mapped.
- **Type consistency:** `Partner` is imported from `#types` and matches `api/types/partner/schema.js` (`id`, `name`, `contactEmail`, `partnerId`, `createdAt`). `returnValid` matches the existing `post-partner-req` usage. `useAsyncAction` / `$fetch` / `useUiNotif` / `useSession` match existing UI auto-imports.
- **i18n:** all keys used by the new component exist in `api/i18n/en.js` (the UI message source): `common.organization`, `common.contactEmail`, `common.confirmCancel`, `common.confirmOk`, `common.modificationOk`, `pages.organization.addPartner`.
