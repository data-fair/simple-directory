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
      lazy-validation
    >
      <v-text-field
        v-model="message.from"
        :rules="[v => !!v || '']"
        :disabled="!!tokenError"
        label="Votre adresse email"
        name="email"
        required
      />
      <v-text-field
        v-model="message.subject"
        :rules="[v => !!v || '']"
        :disabled="!!tokenError"
        label="Sujet"
        name="subject"
        required
      />
      <v-textarea
        v-model="message.text"
        :rules="[v => !!v || '']"
        :disabled="!!tokenError"
        label="Votre demande"
        name="text"
        outlined
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

<script>
import eventBus from '../event-bus'
const newMessage = { from: '', subject: '', text: '' }
export default {
  data: () => ({
    valid: true,
    message: { ...newMessage },
    token: null,
    tokenError: null
  }),
  async mounted () {
    try {
      this.token = await this.$axios.$get('api/auth/anonymous-action')
    } catch (error) {
      this.tokenError = error
      eventBus.$emit('notification', { error })
    }
  },
  methods: {
    async send () {
      if (!this.$refs.form.validate()) return
      try {
        await this.$axios.$post('api/mails/contact', { ...this.message, token: this.token })
        this.message = { ...newMessage }
        this.$refs.form.resetValidation()
        eventBus.$emit('notification', { type: 'success', msg: 'Votre demande a été envoyée' })
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
