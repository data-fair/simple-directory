<!-- eslint-disable vue/no-v-html -->
<template lang="html">
  <v-container
    data-iframe-height
  >
    <v-row class="mt-3 mb-6 mx-0">
      <h2 class="text-title-large">
        {{ $t('common.passwordLists') }}
      </h2>
    </v-row>
    <p class="my-3">
      {{ $t('pages.admin.passwordLists.help1') }}
    </p>
    <p
      class="my-3"
      v-html="$t('pages.admin.passwordLists.help2', {secLists, richelieu})"
    />
    <v-file-input
      v-model="file"
      v-container
      accept=".csv,.txt"
      :label="$t('pages.admin.passwordLists.newFile')"
      variant="outlined"
      density="compact"
      style="max-width:650px;"
    >
      <template #append>
        <v-btn
          color="primary"
          :disabled="!file"
          :loading="upload.loading.value"
          @click="upload.execute()"
        >
          {{ $t('common.load') }}
        </v-btn>
      </template>
    </v-file-input>

    <v-list
      v-if="passwordLists.data.value"
      :loading="true"
      border
    >
      <v-list-item
        v-for="passwordList of passwordLists.data.value"
        :key="passwordList._id"
        :title="passwordList.name"
        :subtitle="$t('pages.admin.passwordLists.subtitle', {state: passwordList.active ? $t('common.active') : $t('common.inactive'), date: dayjs(passwordList.createdAt).format('LLL'), count: passwordList.count})"
      >
        <template #prepend>
          <v-list-item-action start>
            <v-checkbox-btn
              :model-value="passwordList.active"
              color="primary"
              @change="togglePasswordList.execute(passwordList)"
            />
          </v-list-item-action>
        </template>
        <template #append>
          <confirm-menu
            yes-color="warning"
            :title="$t('pages.admin.passwordLists.confirmDelete')"
            @confirm="deletePasswordList.execute(passwordList)"
          >
            <template #activator="{props}">
              <v-btn
                :title="$t('common.delete')"
                :aria-label="$t('common.delete')"
                v-bind="props"
                variant="text"
                icon
                color="warning"
              >
                <v-icon :icon="mdiDelete" />
              </v-btn>
            </template>
          </confirm-menu>
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
import type { PasswordList } from '@sd/api/types'

const { dayjs } = useLocaleDayjs()

// the two project names are injected as links into the help sentence, so that each
// translation keeps its own word order around them
const secLists = '<a href="https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials" class="simple-link">SecLists</a>'
const richelieu = '<a href="https://github.com/tarraschk/richelieu" class="simple-link">Richelieu</a>'

const passwordLists = useFetch<PasswordList[]>($apiPath + '/password-lists')

const file = ref<File | null>(null)

const upload = useAsyncAction(async () => {
  if (!file.value) return
  const formData = new FormData()
  formData.append('passwords', file.value)
  await $fetch($apiPath + '/password-lists', { method: 'POST', body: formData })
  passwordLists.refresh()
}, () => {
  file.value = null
})

const deletePasswordList = useAsyncAction(async (passwordList: PasswordList) => {
  await $fetch($apiPath + '/password-lists/' + passwordList._id, { method: 'DELETE' })
  passwordLists.refresh()
})

const togglePasswordList = useAsyncAction(async (passwordList: PasswordList) => {
  await $fetch($apiPath + '/password-lists/' + passwordList._id, {
    method: 'PATCH',
    body: { active: !passwordList.active },
  })
  passwordLists.refresh()
})
</script>
