<template>
  <div v-if="userDetailsFetch.data.value?.plannedDeletion">
    <v-alert
      :value="true"
      type="warning"
      variant="outlined"
      class="mb-2"
    >
      {{ $t('errors.plannedDeletion', {name: userDetailsFetch.data.value.name, plannedDeletion: $d(new Date(userDetailsFetch.data.value.plannedDeletion))}) }}
    </v-alert>

    <v-btn
      color="warning"
      variant="text"
      @click="cancelDeletion"
    >
      {{ $t('pages.login.cancelDeletion') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['cancelled'])

const { userDetailsFetch } = useStore()

if (!userDetailsFetch.initialized.value) userDetailsFetch.refresh()
const cancelDeletion = withUiNotif(async () => {
  if (!userDetailsFetch.data.value) return
  await $fetch('users/' + userDetailsFetch.data.value.id + '/plannedDeletion', { method: 'DELETE' })
  emit('cancelled')
})

</script>

<style>

</style>
