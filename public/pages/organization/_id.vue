<template lang="html">
  <v-container>
    <h2 class="headline mb-3">{{ $t('common.organization') }}</h2>
    <v-form v-if="orga" ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :label="$t('common.name')"
        v-model="orga.name"
        :rules="[v => !!v || '']"
        name="name"
        required
        @blur="save"
      />
      <v-text-field
        :label="$t('common.description')"
        v-model="orga.description"
        name="description"
        textarea
        @blur="save"
      />
    </v-form>
  </v-container>
</template>

<script>
import {mapActions} from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({orga: null, valid: true}),
  async mounted() {
    this.orga = await this.$axios.$get(`api/organizations/${this.$route.params.id}`)
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    async save() {
      if (!this.$refs.form.validate()) return
      try {
        await this.$axios.$patch(`api/organizations/${this.$route.params.id}`,
          {name: this.orga.name, description: this.orga.description})
        this.fetchUserDetails()
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
    }
  }
}
</script>

<style lang="css">
</style>
