<!-- eslint-disable vue/no-v-html -->
<template lang="html">
  <v-container
    v-if="orga"
    data-iframe-height
    style="max-width:650px;"
  >
    <h2 class="text-h4 mb-4">
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
      class="text-subtitle-2"
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
        v-if="$uiConfig.manageDepartments && $uiConfig.manageDepartmentLabel"
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
          :label="`Libellé du rôle ${role}`"
          :placeholder="$uiConfig.defaultRolesLabels?.[role]"
          :disabled="orgRole !== 'admin' || $uiConfig.readonly"
          density="compact"
          autocomplete="off"
        />
      </template>
      <v-select
        :model-value="orga['2FA']?.roles"
        :items="orga.roles"
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
          :disabled="patchOrganization.loading.value"
          @click="save"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>

    <organization-departments
      v-if="$uiConfig.manageDepartments"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      @change="fetchOrga.refresh()"
    />
    <organization-members
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
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'true'"
      :readonly="orga.orgStorage.readonly"
    />

    <organization-partners
      v-if="$uiConfig.managePartners && mainPublicUrl.host === host"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      @change="fetchOrga.refresh()"
    />
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import { getAccountRole } from '@data-fair/lib-vue/session'

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
const orgRole = computed(() => {
  const role = getAccountRole(session.state, { type: 'organization', id: orgId }, { acceptDepAsRoot: $uiConfig.depAdminIsOrgAdmin })
  if (role) return role
  if ($uiConfig.siteAdmin && session.siteRole.value === 'admin' && orga.value && orga.value.host === window.location.host && (orga.value.path || '') === ($sitePath || '')) {
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
</script>

<style lang="css">
</style>
