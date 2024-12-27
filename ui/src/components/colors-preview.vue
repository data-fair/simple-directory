<template>
  <v-theme-provider
    :theme="'preview-' + colorsKey"
    with-background
  >
    <component :is="'style'">
      {{ getTextColorsCss(colors, 'preview-' + colorsKey) }}
    </component>
    <v-container fluid>
      <h2>Aperçu du rendu des couleurs</h2>
      <v-card title="Un exemple de carte">
        <v-card-text>
          Elle utilise la couleur des "surfaces".
        </v-card-text>
      </v-card>
      <template
        v-for="color of colorKeys"
        :key="color"
      >
        <v-row class="ma-0">
          <template
            v-for="variant of buttonVariants"
            :key="variant"
          >
            <v-btn
              :color="color"
              :variant="variant"
              class="ma-4"
            >
              {{ color }}
            </v-btn>
          </template>
          <v-icon
            :icon="mdiEmoticonKissOutline"
            :color="color"
            class="ma-4"
          />
        </v-row>
      </template>
    </v-container>
  </v-theme-provider>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import type { VBtn } from 'vuetify/components/VBtn'
import type { Colors } from '../../../api/config/type'
import { mdiEmoticonKissOutline } from '@mdi/js'
import { getTextColorsCss } from '../../../api/shared/site.ts'

const theme = useTheme()
const { colorsKey, colors, dark } = defineProps({
  colorsKey: { type: String, required: true },
  colors: { type: Object as () => Colors, required: true },
  dark: { type: Boolean, default: false }
})

watch(() => colors, () => {
  const key = 'preview-' + colorsKey
  if (theme.themes.value[key]) {
    Object.assign(theme.themes.value[key].colors, colors)
  } else {
    theme.themes.value[key] = { dark, colors, variables: dark ? theme.themes.value.dark.variables : theme.themes.value.light.variables }
  }
}, { immediate: true })

const buttonVariants: VBtn['variant'][] = ['flat', 'text']
const colorKeys = ['primary', 'secondary', 'accent', 'info', 'success', 'error', 'warning']
</script>
