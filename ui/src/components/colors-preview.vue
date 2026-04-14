<template>
  <lib-colors-preview
    v-if="defaultTheme.data.value"
    :colors-key="colorsKey"
    :theme="theme"
    :default-theme="defaultTheme.data.value"
    :dark="dark"
    :csp-nonce="$cspNonce"
  />
</template>

<script setup lang="ts">
import LibColorsPreview from '@data-fair/lib-vuetify/colors-preview.vue'
import type { Theme } from '../../../api/config/type'

defineProps({
  colorsKey: { type: String as () => 'colors' | 'darkColors' | 'hcColors' | 'hcDarkColors', required: true },
  theme: { type: Object as () => Theme, required: true },
  dark: { type: Boolean, default: false }
})

const defaultTheme = useFetch<Theme>(`${$apiPath}/sites/_default_theme`)
</script>
