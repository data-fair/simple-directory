<!-- eslint-disable vue/no-v-html -->
<template lang="html">
  <v-container
    v-if="orga.data.value"
    data-iframe-height
    style="max-width:600px;"
  >
    <h2 class="text-h4 mb-4">
      <v-icon
        size="large"
        color="primary"
        style="top:-2px"
        :icon="mdiAccountGroup"
      />
      {{ $t('common.organization') + ' ' + orga.data.value.name }}
    </h2>

    <p
      v-if="orga.data.value.created"
      class="text-subtitle-2"
    >
      {{ $t('common.createdPhrase', {name: orga.data.value.created.name, date: $d(new Date(orga.data.value.created.date))}) }}
    </p>
    <v-form
      ref="form"
      @submit="save"
    >
      <load-avatar
        v-if="orga.data.value && $uiConfig.avatars.orgs"
        :owner="{...orga.data.value, type: 'organization'}"
        :disabled="$uiConfig.readonly"
      />
      <v-text-field
        v-model="orga.data.value.name"
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
        v-model="orga.data.value.description"
        :label="$t('common.description')"
        :disabled="orgRole !== 'admin' || $uiConfig.readonly"
        name="description"
        variant="outlined"
        density="compact"
        autocomplete="off"
      />
      <v-text-field
        v-if="$uiConfig.manageDepartments && $uiConfig.manageDepartmentLabel"
        v-model="orga.data.value.departmentLabel"
        :label="$t('pages.organization.departmentLabelTitle')"
        :disabled="orgRole !== 'admin' || $uiConfig.readonly"
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
            <div v-html="$t('pages.organization.departmentLabelHelp')" />
          </v-tooltip>
        </template>
      </v-text-field>
      <v-select
        :model-value="orga.data.value['2FA']?.roles"
        :items="orga.data.value.roles"
        :messages="[$t('pages.organization.2FARolesMsg')]"
        :rules="[v => !!v || '']"
        :placeholder="$t('pages.organization.2FARoles')"
        multiple
        name="2FARoles"
        density="compact"
        style="max-width:600px"
        @update:model-value="set2FARoles"
      />

      <v-row class="mx-0 mb-0 mt-4">
        <v-spacer />
        <v-btn
          color="primary"
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
      @change="orga.refresh()"
    />
    <organization-members
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'false'"
      :readonly="$uiConfig.readonly"
    />

    <organization-storage
      v-if="(session.user.value?.adminMode && $uiConfig.perOrgStorageTypes.length) || orga.data.value.orgStorage?.active"
      :orga="orga"
    />

    <organization-members
      v-if="orga.data.value.orgStorage?.active"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'true'"
      :readonly="orga.data.value.orgStorage.readonly"
    />

    <organization-partners
      v-if="$uiConfig.managePartners && mainPublicUrl.host === host"
      :orga="orga"
      :is-admin-orga="orgRole === 'admin'"
      @change="orga.refresh()"
    />
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import { getAccountRole } from '@data-fair/lib-common-types/session/index.js'

const session = useSession()
const orgId = useRoute<'/organization/[id]/'>().params.id

const { patchOrganization, host, mainPublicUrl } = useStore()
const { t } = useI18n()

const orga = useFetch<Organization>($apiPath + `/organizations/${orgId}`)
const orgRole = computed(() => getAccountRole(session.state, { type: 'organization', id: orgId }, { acceptDepAsRoot: $uiConfig.depAdminIsOrgAdmin }))
const limits = useFetch<Limits>($apiPath + `/limits/organization/${orgId}`, { watch: orgRole.value === 'admin' })

const form = ref<InstanceType<typeof VForm>>()
const save = async (e: Event) => {
  if (e.preventDefault) e.preventDefault()
  await form.value?.validate()
  if (!form.value?.isValid) return
  if (!orga.data.value) return
  const patch: any = { name: orga.data.value.name, description: orga.data.value.description, '2FA': orga.data.value['2FA'] }
  if ($uiConfig.manageDepartments) patch.departmentLabel = orga.data.value.departmentLabel
  patchOrganization(orgId, patch, t('common.modificationOk'))
}
const set2FARoles = (roles: string[]) => {
  if (!orga.data.value) return
  orga.data.value['2FA'] = orga.data.value['2FA'] ?? {}
  orga.data.value['2FA'].roles = roles
}
</script>

<style lang="css">
</style>
