<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :hide-overlay="true"
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('common.createOrganization')"
        color="primary"
        v-on="on"
      >
        {{ $t('common.createOrganization') }}
      </v-btn>
    </template>

    <v-card v-if="editOrganization" :width="500">
      <v-card-title class="text-h6">
        {{ $t('common.createOrganization') }}
      </v-card-title>
      <v-card-text>
        <v-form ref="createForm">
          <v-text-field
            v-model="editOrganization.name"
            :label="$t('common.name')"
            :rules="[v => !!v || '']"
            name="name"
            required
          />
          <v-textarea
            v-model="editOrganization.description"
            :label="$t('common.description')"
            name="description"
            outline
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn flat @click="menu = false">
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn color="primary" @click="confirmCreate">
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>

  import { mapActions } from 'vuex'

  export default {
    props: [],
    data: () => ({ menu: false, editOrganization: null }),
    watch: {
      menu() {
        if (!this.menu) return
        this.editOrganization = { name: '', description: '' }
        if (this.$refs.createForm) this.$refs.createForm.reset()
      },
    },
    methods: {
      ...mapActions(['fetchUserDetails']),
      ...mapActions('session', ['switchOrganization', 'keepalive']),
      async confirmCreate() {
        if (this.$refs.createForm.validate()) {
          this.menu = false
          const res = await this.$axios.$post('api/organizations', this.editOrganization, { params: { autoAdmin: true } })
          await this.keepalive()
          this.switchOrganization(res.id)
          // reloading top page, so that limits are re-fetched, etc.
          window.top.location.reload()
        }
      },
    },
  }
</script>

<style lang="css" scoped>
</style>
