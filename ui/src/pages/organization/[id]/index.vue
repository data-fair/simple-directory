<!-- eslint-disable vue/no-v-html -->
<template lang="html">
  <v-container
    v-if="orga"
    data-iframe-height
    style="max-width:650px;"
  >
    <h2
      id="info"
      class="text-headline-medium mb-4"
    >
      <v-icon
        size="large"
        color="primary"
        style="top:-2px"
        :icon="mdiAccountGroup"
        class="mb-2"
      />
      {{ $t('common.organization') + ' ' + orga.name }}
    </h2>

    <p
      v-if="orga.created"
      class="text-label-large"
    >
      {{ $t('common.createdPhrase', {name: orga.created.name, date: $d(new Date(orga.created.date))}) }}
    </p>
    <v-form
      ref="form"
    >
      <load-avatar
        v-if="$uiConfig.avatars.orgs"
        :owner="{...orga, type: 'organization'}"
        :disabled="$uiConfig.readonly"
        class="mb-4"
      />
      <v-text-field
        v-model="orga.name"
        :label="$t('common.name')"
        :rules="[v => !!v || '', v => v.length < 150 || $t('common.tooLong')]"
        :disabled="orgRole !== 'admin' || $uiConfig.readonly"
        name="name"
        required
        variant="outlined"
        density="compact"
        autocomplete="off"
      />
      <v-textarea
        v-model="orga.description"
        :label="$t('common.description')"
        :disabled="orgRole !== 'admin' || $uiConfig.readonly"
        name="description"
        variant="outlined"
        density="compact"
        autocomplete="off"
      />
      <v-text-field
        v-if="$uiConfig.manageDepartments && $uiConfig.manageDepartmentLabel && showDetailedManagement"
        v-model="orga.departmentLabel"
        :label="$t('pages.organization.departmentLabelTitle')"
        :disabled="orgRole !== 'admin' || $uiConfig.readonly"
        :placeholder="$uiConfig.defaultDepartmentLabel"
        name="departmentLabel"
        density="compact"
        autocomplete="off"
      >
        <template #append>
          <v-tooltip

            location="left"
          >
            <template #activator="{props}">
              <v-icon
                v-bind="props"
                color="info"
                :icon="mdiInformation"
              />
            </template>
            <div v-html="$t('pages.organization.departmentLabelHelp', {defaultDepartmentLabel: $uiConfig.defaultDepartmentLabel || t('common.department')})" />
          </v-tooltip>
        </template>
      </v-text-field>
      <template v-if="$uiConfig.manageRolesLabels && orga.rolesLabels">
        <v-text-field
          v-for="role in orga.roles"
          :key="role"
          v-model="orga.rolesLabels[role]"
          :label="$t('pages.organization.roleLabel', {role})"
          :placeholder="$uiConfig.defaultRolesLabels?.[role]"
          :persistent-placeholder="!!$uiConfig.defaultRolesLabels?.[role]"
          :disabled="orgRole !== 'admin' || $uiConfig.readonly"
          density="compact"
          autocomplete="off"
        />
      </template>
      <v-select
        :model-value="orga['2FA']?.roles"
        :items="roleItems"
        :messages="[$t('pages.organization.2FARolesMsg')]"
        :placeholder="$t('pages.organization.2FARoles')"
        multiple
        name="2FARoles"
        density="compact"
        style="max-width:650px"
        @update:model-value="set2FARoles"
      />

      <v-row class="mx-0 mb-0 mt-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          class="text-uppercase"
          :disabled="patchOrganization.loading.value"
          @click="save"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>

    <organization-departments
      v-if="showDepartments"
      id="departments"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      @change="fetchOrga.refresh()"
    />
    <organization-members
      id="members"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'false'"
      :readonly="$uiConfig.readonly"
    />

    <organization-storage
      v-if="(session.user.value?.adminMode && $uiConfig.perOrgStorageTypes.length) || orga.orgStorage?.active"
      :orga="orga"
    />

    <organization-members
      v-if="orga.orgStorage?.active"
      id="org-storage-members"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'true'"
      :readonly="orga.orgStorage.readonly"
    />

    <organization-partners
      v-if="showPartners"
      id="partners"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      @change="fetchOrga.refresh()"
    />

    <organization-nhis
      v-if="$uiConfig.manageNhis && orgRole === 'admin'"
      id="nhis"
      :orga="orga"
    />

    <v-container
      v-if="isSiteAdmin"
      id="site-users"
      fluid
      class="pa-0"
    >
      <v-row class="mt-3 mx-0">
        <h2 class="text-headline-medium mt-10 mb-4">
          <v-icon
            size="small"
            color="primary"
            style="top:-2px"
            :icon="mdiAccountMultiple"
          />
          {{ $t('pages.organization.siteUsersTitle') }}
          <v-tooltip location="right">
            <template #activator="{props}">
              <v-icon
                v-bind="props"
                size="small"
                color="info"
                class="ml-1"
                :icon="mdiInformation"
              />
            </template>
            {{ $t('pages.organization.siteUsersHelp') }}
          </v-tooltip>
        </h2>
      </v-row>
      <site-users />
    </v-container>

    <layout-navigation-right>
      <df-toc :sections="tocSections" />
    </layout-navigation-right>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import { getAccountRole } from '@data-fair/lib-vue/session'
import DfToc from '@data-fair/lib-vuetify/toc.vue'

const session = useSession()
const orgId = useRoute<'/organization/[id]/'>().params.id

const { patchOrganization, host, mainPublicUrl } = useStore()
const { t } = useI18n()

const fetchOrga = useFetch<Organization>($apiPath + `/organizations/${orgId}`)
const orga = ref<Organization | null>(null)
watch(fetchOrga.data, (freshOrga) => {
  if (!freshOrga) orga.value = null
  else {
    const editOrg = { ...freshOrga }
    if (editOrg.departmentLabel === $uiConfig.defaultDepartmentLabel) editOrg.departmentLabel = ''
    if (editOrg.rolesLabels && $uiConfig.defaultRolesLabels) {
      editOrg.rolesLabels = { ...editOrg.rolesLabels }
      for (const key in $uiConfig.defaultRolesLabels) {
        if (editOrg.rolesLabels[key] && editOrg.rolesLabels[key] === $uiConfig.defaultRolesLabels[key]) {
          editOrg.rolesLabels[key] = ''
        }
      }
    }
    orga.value = editOrg
  }
})
const { roleItems } = useRoleLabels(orga)

const orgRole = computed(() => {
  const role = getAccountRole(session.state, { type: 'organization', id: orgId }, { acceptDepAsRoot: $uiConfig.depAdminIsOrgAdmin })
  if (role) return role
  if ($uiConfig.siteAdmin && session.siteRole.value === 'admin' && !session.organization.value?.department && orga.value && orga.value.host === window.location.host && (orga.value.path || '') === ($sitePath || '')) {
    return 'admin'
  }
})
const limits = useFetch<Limits>($apiPath + `/limits/organization/${orgId}`, { watch: false })
watch(orga, () => {
  if (orgRole.value === 'admin') limits.refresh()
})

const form = ref<InstanceType<typeof VForm>>()
const save = async () => {
  await form.value?.validate()
  if (!form.value?.isValid) return
  if (!orga.value) return
  const patch: any = { name: orga.value.name, description: orga.value.description, '2FA': orga.value['2FA'] }
  if ($uiConfig.manageDepartments) patch.departmentLabel = orga.value.departmentLabel
  if ($uiConfig.manageRolesLabels) patch.rolesLabels = orga.value.rolesLabels
  patchOrganization.execute(orgId, patch, t('common.modificationOk'))
}
const set2FARoles = (roles: string[]) => {
  if (!orga.value) return
  orga.value['2FA'] = orga.value['2FA'] ?? {}
  orga.value['2FA'].roles = roles
}

const showDetailedManagement = computed(() => {
  // on the main back-office everybody can manage all parts of the org
  if (mainPublicUrl.host === host) return true
  // on account's site only the owner can manage all
  if (session.user.value?.siteOwner?.type === 'organization' && session.user.value?.siteOwner?.id === orgId) return true
  return false
})

// root admin of the organization that owns the current site (siteAdmin): manages the accounts of the site
const isSiteAdmin = computed(() => {
  if (!$uiConfig.siteAdmin || session.siteRole.value !== 'admin' || session.organization.value?.department) return false
  const siteOwner = session.user.value?.siteOwner
  return siteOwner?.type === 'organization' && siteOwner.id === orgId
})

const showDepartments = computed(() => $uiConfig.manageDepartments && showDetailedManagement.value)
const showPartners = computed(() => $uiConfig.managePartners && (showDetailedManagement.value || !!session.user.value?.adminMode))

const tocSections = computed(() => {
  if (!orga.value) return []
  const sections = [{ id: 'info', title: t('pages.organization.infoTitle') }]
  if (showDepartments.value) sections.push({ id: 'departments', title: orga.value.departmentLabel || t('common.departments') })
  sections.push({ id: 'members', title: t('common.members') })
  if (orga.value.orgStorage?.active) sections.push({ id: 'org-storage-members', title: t('common.orgStorageMembers') })
  if (showPartners.value) sections.push({ id: 'partners', title: t('common.partners') })
  // the nhis section of a normal org admin only shows up once a nhi exists, only superadmins are sure to see it
  if ($uiConfig.manageNhis && orgRole.value === 'admin' && session.user.value?.adminMode) sections.push({ id: 'nhis', title: t('pages.organization.nhisTitle') })
  if (isSiteAdmin.value) sections.push({ id: 'site-users', title: t('pages.organization.siteUsersTitle') })
  return sections
})
</script>

<style lang="css">
</style>
