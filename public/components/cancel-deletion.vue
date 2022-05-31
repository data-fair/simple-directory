<template>
  <div v-if="userDetails">
    <v-alert
      :value="true"
      type="warning"
      outlined
    >
      {{ $t('errors.plannedDeletion', {name: userDetails.name, plannedDeletion: $d(new Date(userDetails.plannedDeletion))}) }}
    </v-alert>

    <v-btn
      color="warning"
      text
      @click="cancelDeletion"
    >
      {{ $t('pages.login.cancelDeletion') }}
    </v-btn>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState(['userDetails'])
  },
  methods: {
    async cancelDeletion () {
      await this.$axios.$patch('api/users/' + this.userDetails.id, { plannedDeletion: null })
      this.$emit('cancelled')
    }
  }
}
</script>

<style>

</style>
