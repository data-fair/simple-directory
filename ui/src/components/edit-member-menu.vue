<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editMember')"
        :aria-label="$t('pages.organization.editMember')"
        variant="text"
        :icon="mdiPencil"
        density="compact"
        v-bind="props"
      />
    </template>
    <v-card
      v-if="editMember"
      data-iframe-height
      width="500"
      :loading="loading"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmEditMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="member.readOnly"
          type="warning"
          border="start"
          variant="outlined"
          density="compact"
        >
          {{ $t('pages.organization.memberReadOnly') }}
        </v-alert>
        <template v-else>
          <v-select
            v-model="editMember.role"
            :items="roleItems"
            :label="$t('common.role')"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
          />
          <v-autocomplete
            v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length && !department"
            v-model="editMember.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-title="name"
            name="department"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
          />
          <v-alert
            v-if="isSelf && changed"
            :type="blocked ? 'error' : 'warning'"
            variant="outlined"
            class="mt-4"
          >
            {{ $t(blocked ? 'pages.organization.editMemberLastAdmin' : 'pages.organization.editMemberSelfWarning') }}
          </v-alert>
        </template>
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
          variant="flat"
          color="warning"
          :disabled="member.readOnly || blocked || loading"
          @click="menu = false;$emit('save', editMember)"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { orga, department, member } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  department: { type: String, default: null },
  member: { type: Object as () => Member, required: true }
})
const { roleItems } = useRoleLabels(() => orga)
defineEmits({ save: (_editMember: Member) => true })

const menu = ref(false)
const editMember = ref<any>()
const { isSelf, isLastAdmin, loading } = useLastAdmin(() => orga, () => member, menu)
const changed = computed(() => editMember.value && (editMember.value.role !== member.role || editMember.value.department !== member.department))
const blocked = computed(() => isLastAdmin.value && changed.value)

watch(menu, () => {
  if (!menu.value) return
  editMember.value = { ...member }
})
</script>

<style lang="css" scoped>
</style>
