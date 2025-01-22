<template>
  <v-container>
    <h2 class="text-h4 mb-4">
      Theme
    </h2>
    <template
      v-for="variant of buttonVariants"
      :key="variant"
    >
      <h3 class="text-h5">
        {{ variant }}
      </h3>
      <v-card>
        <v-row>
          <template
            v-for="color of colors"
            :key="color"
          >
            <v-btn
              :color="color"
              :variant="variant"
              class="ma-4"
            >
              {{ color }}
            </v-btn>
          </template>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import type { VBtn } from 'vuetify/components/VBtn'

const buttonVariants: VBtn['variant'][] = ['flat', 'outlined', 'text']
const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'error', 'warning']
</script>

<style>
</style>
