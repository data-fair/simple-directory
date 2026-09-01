<template>
  <v-btn
    type="button"
    variant="text"
    density="comfortable"
    size="small"
    :icon="visible ? mdiEyeOffOutline : mdiEyeOutline"
    :title="label"
    :aria-label="label"
    @click="toggle"
  />
  <!--
    the accessible name of the button changes when it is activated, and most screen readers
    only read a changed name on the next focus. this live region states the new state right
    away, like the GOV.UK design system does. it starts empty so that nothing is announced
    on page load, and it never contains the password itself.
  -->
  <span
    class="d-sr-only"
    role="status"
  >{{ status }}</span>
</template>

<script setup lang="ts">
const visible = defineModel<boolean>({ default: false })

const { t } = useI18n()

// no automatic re-masking after a delay: an unrequested time limit works against RGAA 13.1
// (WCAG 2.2.1), and 5s is not enough to re-read a long password. the callers re-mask when
// the form is submitted instead.
const toggled = ref(false)
const toggle = () => {
  toggled.value = true
  visible.value = !visible.value
}

const label = computed(() => visible.value ? t('common.hidePassword') : t('common.showPassword'))
const status = computed(() => {
  if (!toggled.value) return ''
  return visible.value ? t('common.passwordShown') : t('common.passwordHidden')
})
</script>
