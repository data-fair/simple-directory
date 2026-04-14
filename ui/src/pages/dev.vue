<template>
  <v-container>
    <h2 class="text-headline-medium mb-4">
      Theme
    </h2>
    <v-row v-if="defaultTheme.data.value">
      <v-col
        v-for="variant of variants"
        :key="variant.key"
        cols="12"
        md="6"
      >
        <h3 class="text-title-medium mb-2">
          {{ variant.title }}
        </h3>
        <colors-preview
          :colors-key="variant.key"
          :theme="defaultTheme.data.value"
          :dark="variant.dark"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { Theme } from '../../../api/config/type'
const defaultTheme = useFetch<Theme>(`${$apiPath}/sites/_default_theme`)

const variants: { key: 'colors' | 'darkColors' | 'hcColors' | 'hcDarkColors', dark: boolean, title: string }[] = [
  { key: 'colors', dark: false, title: 'Light' },
  { key: 'darkColors', dark: true, title: 'Dark' },
  { key: 'hcColors', dark: false, title: 'High contrast light' },
  { key: 'hcDarkColors', dark: true, title: 'High contrast dark' }
]
</script>
