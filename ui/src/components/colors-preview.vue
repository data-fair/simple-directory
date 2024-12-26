<template>
  <v-theme-provider
    :theme="'preview-' + colorsKey"
    with-background
  >
    <v-container fluid>
      <h2>Preview</h2>
      <v-card title="An example of card">
        <v-card-text>
          It uses the "surface" color.
        </v-card-text>
      </v-card>
      <template
        v-for="variant of buttonVariants"
        :key="variant"
      >
        <v-row class="ma-0">
          <template
            v-for="color of buttonColors"
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
      </template>
      <v-row class="ma-0">
        <template
          v-for="color of alertColors"
          :key="color"
        >
          <v-alert
            :color="color"
            class="ma-4"
          >
            {{ color }}
          </v-alert>
        </template>
      </v-row>
      <v-row class="ma-0">
        <template
          v-for="color of iconColors"
          :key="color"
        >
          <v-icon
            :icon="mdiEmoticonKissOutline"
            :color="color"
            class="ma-4"
          />
        </template>
      </v-row>
    </v-container>
  </v-theme-provider>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import type { VBtn } from 'vuetify/components/VBtn'
import type { Colors } from '../../../api/config/type'
import { mdiEmoticonKissOutline } from '@mdi/js'

const theme = useTheme()
const { colorsKey, colors, dark } = defineProps({
  colorsKey: { type: String, required: true },
  colors: { type: Object as () => Colors, required: true },
  dark: { type: Boolean, default: false }
})

watch(() => colors, () => {
  theme.themes.value['preview-' + colorsKey] = {
    dark,
    colors,
    variables: dark ? theme.themes.value.dark.variables : theme.themes.value.light.variables
  }
}, { immediate: true })

const buttonVariants: VBtn['variant'][] = ['flat', 'text']
const buttonColors = ['primary', 'secondary', 'accent']
const alertColors = ['info', 'success', 'error', 'warning']
const iconColors = ['primary', 'secondary', 'accent', 'info', 'success', 'error', 'warning']
</script>
