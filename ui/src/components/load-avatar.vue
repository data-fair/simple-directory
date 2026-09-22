<template>
  <div>
    <v-file-input
      v-model="file"
      :label="label"
      :disabled="disabled"
      accept="image/png, image/jpeg"
      variant="outlined"
      density="compact"
      prepend-icon=""
      hide-details="auto"
      clearable
    >
      <!-- the current avatar, the timestamp forces a reload after an upload or a reset -->
      <template #prepend>
        <v-avatar
          size="40"
          :image="`${avatarUrl}?t=${timestamp}`"
        />
      </template>
      <!-- a declared slot renders its container and margin even when empty -->
      <template
        v-if="canValidate || canReset"
        #append
      >
        <v-btn
          v-if="canValidate"
          color="primary"
          size="small"
          :icon="mdiCheck"
          :title="$t('common.validate')"
          :aria-label="$t('common.validate')"
          :loading="validate.loading.value"
          @click="validate.execute()"
        />
        <v-btn
          v-else
          color="error"
          variant="text"
          size="small"
          :icon="mdiDelete"
          :title="$t('pages.avatar.reset')"
          :aria-label="$t('pages.avatar.reset')"
          :loading="reset.loading.value"
          @click="reset.execute()"
        />
      </template>
    </v-file-input>

    <!-- square crop of the loaded image, the image itself can be dragged and zoomed under the selection -->
    <cropper-canvas
      v-if="imgSrc"
      class="load-avatar-canvas border rounded mt-2"
    >
      <cropper-image
        :src="imgSrc"
        :alt="$t('common.avatar')"
        rotatable
        scalable
        translatable
      />
      <cropper-shade />
      <cropper-selection
        ref="selection"
        aspect-ratio="1"
        initial-coverage="0.85"
        movable
        resizable
      >
        <cropper-grid
          role="grid"
          bordered
          covered
        />
        <cropper-crosshair centered />
        <cropper-handle
          action="move"
          theme-color="rgba(255, 255, 255, 0.35)"
        />
        <cropper-handle action="n-resize" />
        <cropper-handle action="e-resize" />
        <cropper-handle action="s-resize" />
        <cropper-handle action="w-resize" />
        <cropper-handle action="ne-resize" />
        <cropper-handle action="nw-resize" />
        <cropper-handle action="se-resize" />
        <cropper-handle action="sw-resize" />
      </cropper-selection>
    </cropper-canvas>
  </div>
</template>

<script setup lang="ts">
import type { AccountKeys } from '@data-fair/lib-vue/session'
import 'cropperjs'
import type { CropperSelection } from 'cropperjs'

const { owner, disabled, hideValidate, departmentName } = defineProps({
  owner: { type: Object as () => AccountKeys, required: true },
  disabled: { type: Boolean, default: false },
  // the parent triggers the upload itself through the exposed validate()
  hideValidate: { type: Boolean, default: false },
  departmentName: { type: String, default: null }
})

const { t } = useI18n()

// the label must name the owner explicitly, users used to mistake the organization
// avatar for their own
const label = computed(() => {
  if (owner.type === 'user') return t('pages.avatar.changeUser')
  if (owner.department) return t('pages.avatar.changeDepartment', { departmentName })
  return t('pages.avatar.changeOrganization')
})

const avatarUrl = computed(() => {
  let url = `${$sdUrl}/api/avatars/${owner.type}/${owner.id}`
  if (owner.department) url += `/${owner.department}`
  return url + '/avatar.png'
})

const file = ref<File | null>(null)
const imgSrc = ref<string>()
const selection = ref<CropperSelection>()
const timestamp = ref(Date.now())

// the reset button only makes sense over an uploaded avatar, not the generated initials
const isCustom = ref(false)
watch(avatarUrl, async () => {
  const res = await $fetch.raw(avatarUrl.value, { method: 'HEAD' }).catch(() => null)
  isCustom.value = res?.headers.get('x-avatar-custom') === 'true'
}, { immediate: true })

// an object URL keeps the multi-MB image out of the DOM, unlike a data URL
watch(file, (file) => {
  if (imgSrc.value) URL.revokeObjectURL(imgSrc.value)
  imgSrc.value = file ? URL.createObjectURL(file) : undefined
})
onBeforeUnmount(() => { if (imgSrc.value) URL.revokeObjectURL(imgSrc.value) })

const canValidate = computed(() => !!file.value && !hideValidate)
const canReset = computed(() => isCustom.value && !disabled)

const validate = useAsyncAction(async () => {
  if (!file.value || !selection.value) return
  const canvas = await selection.value.$toCanvas({ width: 100, height: 100 })
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  const formData = new FormData()
  formData.append('avatar', blob)
  await $fetch(avatarUrl.value, { method: 'POST', body: formData })
  file.value = null
  timestamp.value = Date.now()
  isCustom.value = true
})

const reset = useAsyncAction(async () => {
  await $fetch(avatarUrl.value, { method: 'DELETE' })
  timestamp.value = Date.now()
  isCustom.value = false
})

defineExpose({ validate: () => validate.execute() })
</script>

<style lang="css">
.load-avatar-canvas {
  height: 360px;
  max-height: 50vh;
}

/* preview the round avatar cut: a dashed circle and dimmed corners inside the selection */
.load-avatar-canvas cropper-selection::before,
.load-avatar-canvas cropper-selection::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.load-avatar-canvas cropper-selection::before {
  background: radial-gradient(circle closest-side, transparent 99%, rgba(0, 0, 0, 0.45) 100%);
}

.load-avatar-canvas cropper-selection::after {
  border: 1.5px dashed rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}
</style>
