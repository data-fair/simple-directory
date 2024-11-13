<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editMember')"
        variant="text"
        icon

        v-bind="props"
      >
        <v-icon :icon="mdiPencil" />
      </v-btn>
    </template>
    <v-card
      v-if="editMember"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
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
            :items="orga.roles"
            :label="$t('common.role')"
            density="compact"
            variant="outlined"
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
          />
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
          color="warning"
          :disabled="member.readOnly"
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
  department: { type: Object, required: true },
  member: { type: Object as () => Member, required: true }
})
defineEmits({ save: (_editMember: Member) => true })

const menu = ref(false)
const editMember = ref<any>()

watch(menu, () => {
  if (!menu.value) return
  editMember.value = { ...member }
})
</script>

<style lang="css" scoped>
</style>
