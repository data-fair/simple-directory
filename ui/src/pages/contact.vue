<template lang="html">
  <v-container
    data-iframe-height
    :fluid="$route.query.fluid === 'true'"
    :class="{'pa-0': $route.query.fluid === 'true'}"
  >
    <h2 class="text-h5 mb-3">
      {{ $t('common.createOrganization') }}
    </h2>
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent
    >
      <v-text-field
        v-model="message.from"
        :rules="[v => !!v || '']"
        :disabled="token.loading.value"
        label="Votre adresse email"
        name="email"
        required
      />
      <v-text-field
        v-model="message.subject"
        :rules="[v => !!v || '']"
        :disabled="token.loading.value"
        label="Sujet"
        name="subject"
        required
      />
      <v-textarea
        v-model="message.text"
        :rules="[v => !!v || '']"
        :disabled="token.loading.value"
        label="Votre demande"
        name="text"
        variant="outlined"
        required
      />
      <v-row>
        <v-spacer />
        <v-btn
          :disabled="!valid"
          color="primary"
          @click="send"
        >
          Envoyer
        </v-btn>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const newMessage = { from: '', subject: '', text: '' }

const message = ref({ ...newMessage })
const valid = ref(false)

const token = useFetch<string>($apiPath + 'auth/anonymous-action')

const form = ref<InstanceType<typeof VForm>>()
const send = withUiNotif(async () => {
  await form.value?.validate()
  if (form.value?.isValid) {
    if (!token.data) return
    await $fetch('mails/contact', { method: 'POST', body: { ...message.value, token: token.data } })
    message.value = { ...newMessage }
    form.value?.resetValidation()
  }
}, undefined, 'Votre demande a été envoyée')
</script>

<style lang="css">
</style>
