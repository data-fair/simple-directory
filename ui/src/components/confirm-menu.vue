<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    max-width="600"
    
    location="top"
  >
    <template #activator="{ props }">
      <!--<v-tooltip v-if="icon" top>
        <template v-slot:activator="{ on: onTooltip }">
          <v-btn
            :color="yesColor"
            icon
            v-on="{...onTooltip, ...on}"
          >
            <v-icon>{{ icon }}</v-icon>
          </v-btn>
        </template>
        <span>{{ tooltip }}</span>
      </v-tooltip>-->
      <slot
        name="activator"
        :attrs="attrs"
        :on="on"
      >
        <v-btn
          :color="yesColor"

          v-bind="props"
        >
          {{ buttonText }}
        </v-btn>
      </slot>
    </template>
    <v-card data-iframe-height>
      <v-card-title class="text-h6">
        {{ title || $t('common.confirmTitle') }}
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="alert"
          :value="true"
          :type="yesColor"
          variant="outlined"
        >
          {{ alert }}
        </v-alert>
        <template v-if="checkText">
          <v-checkbox
            v-model="checked"
            :label="checkText"
            :color="yesColor"
          />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :color="yesColor"
          :disabled="!!checkText && !checked"
          @click="$emit('confirm'); menu= false"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    alert: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: ''
    },
    checkText: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    tooltip: {
      type: String,
      default: ''
    },
    yesColor: {
      type: String,
      default: 'primary'
    }
  },
  data () {
    return { menu: false, checked: false }
  },
  watch: {
    menu () {
      this.checked = false
    }
  }
}
</script>

<style lang="css" scoped>
</style>
