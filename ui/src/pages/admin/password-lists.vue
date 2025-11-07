<template lang="html">
  <v-container
    data-iframe-height
  >
    <v-row class="mt-3 mb-6 mx-0">
      <h2 class="text-h6">
        {{ $t('common.passwordLists') }}
      </h2>
    </v-row>
    <p class="my-3">
      Vous pouvez charger des listes de mots de passe à partir de fichiers CSV. Ces mots de passe trop connus seront alors rejetés si des utilisateurs tentent de les utiliser.
    </p>
    <p class="my-3">
      Vous pouvez trouver des fichiers de listes de mots de passe sur internet, par exemple sur le <a
        href="https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials"
        class="simple-link"
      >projet SecLists</a> ou le <a
        href="https://github.com/tarraschk/richelieu"
        class="simple-link"
      >projet Richelieu</a> pour une liste française.
    </p>
    <v-file-input
      v-model="file"
      v-container
      accept=".csv,.txt"
      label="Nouveau fichier de mots de passe (un mot de passe par ligne)"
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
          {{ $t('charger') }}
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
        :subtitle="(passwordList.active ? 'actif' : 'inactif') + ' - ' + dayjs(passwordList.createdAt).format('LLL') + ' - ' + passwordList.count + ' mots de passe'"
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
            title="Supprimer cette liste de mots de passe ?"
            @confirm="deletePasswordList.execute(passwordList)"
          >
            <template #activator="{props}">
              <v-btn
                :title="$t('common.delete')"
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
