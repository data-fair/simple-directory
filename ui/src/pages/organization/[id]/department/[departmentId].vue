<template lang="html">
  <v-container
    v-if="orga.data.value && department"
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
      {{ orga.data.value.name }} - {{ department.name }} ({{ department.id }})
    </h2>

    <load-avatar
      v-if="orga && $uiConfig.avatars.orgs"
      :owner="{type: 'organization', id: orga.data.value.id, department: department.id}"
      :disabled="$uiConfig.readonly"
    />

    <organization-members
      :orga="orga.data.value"
      :is-admin-orga="departmentRole === 'admin'"
      :nb-members-limits="limits.data.value?.store_nb_members"
      :org-storage="'false'"
      :readonly="$uiConfig.readonly"
      :admin-department="depId"
    />
  </v-container>
</template>

<script setup lang="ts">
import { getAccountRole } from '@data-fair/lib-common-types/session/index.js'

const session = useSession()
const route = useRoute<'/organization/[id]/department/[departmentId]'>()
const orgId = route.params.id
const depId = route.params.departmentId

const orga = useFetch < Organization >(`${$apiPath}/organizations/${orgId}`)
const departmentRole = computed(() => getAccountRole(session.state, { type: 'organization', id: orgId, department: depId }))
const limits = useFetch < Limits >(`${$apiPath}/limits/organization/${orgId}`, { watch: departmentRole.value === 'admin' })
const department = computed(() => {
  if (!orga.data.value) return
  return orga.data.value.departments?.find(d => d.id === depId)
})

</script>

<style lang="css">
</style>
