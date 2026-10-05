<template>
  <!-- Right-side panel teleported into App.vue's #navigation-right-local (sticky inside the v-main scroll container,
  so that the scrollbar stays on the right of the page instead of between the content and a navigation drawer).
  Same approach as data-fair's df-local/navigation-right-local.vue, a local variant of @data-fair/lib-vuetify/navigation-right.vue -->
  <Teleport
    v-if="display.lgAndUp.value"
    to="#navigation-right-local"
    defer
  >
    <v-list
      class="layout-navigation-right"
      bg-color="background"
      density="compact"
    >
      <slot />
    </v-list>
  </Teleport>

  <!-- Floating action button for smaller screens -->
  <v-fab
    v-else
    size="small"
    color="primary"
    location="top right"
    app
    icon
  >
    <v-icon :icon="mdiDotsVertical" />
    <v-menu
      activator="parent"
      :close-on-content-click="false"
    >
      <v-card
        max-width="300"
        class="mt-2"
      >
        <v-list
          class="layout-navigation-right"
          density="compact"
        >
          <slot />
        </v-list>
      </v-card>
    </v-menu>
  </v-fab>
</template>

<script setup lang="ts">
import { mdiDotsVertical } from '@mdi/js'
import { useDisplay } from 'vuetify'

const display = useDisplay()
</script>

<style>
.layout-navigation-right .v-list-item {
  border-radius: 4px;
}
</style>
