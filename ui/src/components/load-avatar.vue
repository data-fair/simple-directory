<template>
  <v-input
    name="avatar"
    :label="$t('common.avatar')"
    :disabled="disabled"
    class="vjsf-crop-img"
  >
    <!--<v-icon
      v-if="!disabled"
      style="position: absolute; right: 0;"
      @click="on.input(null)"
      :icon="mdiClose"
    >
    </v-icon>-->
    <v-row class="mt-0 mx-0">
      <v-avatar
        class="mt-2 mr-1"
      >
        <v-img
          v-if="owner && !loading"
          :src="avatarUrl + '?t=' + getTimestamp()"
        />
      </v-avatar>
      <v-file-input
        v-if="!disabled"
        v-model="file"
        class="pt-2"
        accept="image/png, image/jpeg"
        :label="$t('pages.avatar.load')"
        variant="outlined"
        density="compact"
        prepend-icon=""
        @change="change"
      >
        <template #append>
          <v-btn
            v-if="file && !hideValidate"
            size="small"
            color="primary"
            :title="$t('common.validate')"
            style="position: relative;"
            :icon="mdiCheck"
            @click="validate"
          />
        </template>
      </v-file-input>
    </v-row>
    <vue-cropper
      v-if="file"
      ref="cropper"
      v-bind="cropperOptions"
      :src="imgSrc"
    />
  </v-input>
</template>

<script setup lang="ts">
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import type { AccountKeys } from '@data-fair/lib-vue/session'
import debugModule from 'debug'

const debug = debugModule('sd:load-avatar')

// see https://stackoverflow.com/a/5100158
function dataURItoBlob (dataURI: string) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString
  if (dataURI.split(',')[0].indexOf('base64') >= 0) { byteString = atob(dataURI.split(',')[1]) } else { byteString = unescape(dataURI.split(',')[1]) }

  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return new Blob([ia], { type: mimeString })
}

const { owner, disabled, hideValidate } = defineProps({
  owner: { type: Object as () => AccountKeys, default: null },
  disabled: { type: Boolean, default: false },
  hideValidate: { type: Boolean, default: false }
})

const cropper = ref<any>()
const loading = ref(false)
const file = ref<File | null>(null)
const imgSrc = ref('')
const cropperOptions = { aspectRatio: 1, autoCrop: true }

const avatarUrl = computed(() => {
  let url = `${$sdUrl}/api/avatars/${owner.type}/${owner.id}`
  if (owner.department) url += `/${owner.department}`
  url += '/avatar.png'
  return url
})

const change = () => {
  if (!file.value) {
    imgSrc.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    imgSrc.value = event.target?.result as string
    cropper.value?.replace(imgSrc.value)
  }
  reader.readAsDataURL(file.value)
}

const validate = withUiNotif(async () => {
  debug('validate', file.value)
  if (!file.value) return
  loading.value = true
  const croppedImg = dataURItoBlob(cropper.value?.getCroppedCanvas({ width: 100, height: 100 }).toDataURL('image/png'))
  const formData = new FormData()
  formData.append('avatar', croppedImg)
  debug('send new avatar', avatarUrl.value)
  await $fetch(avatarUrl.value, { method: 'POST', body: formData })
  loading.value = false
  file.value = null
})

defineExpose({ validate })

const getTimestamp = () => new Date().getTime()
</script>

<style lang="css">
.vjsf-crop-img>.v-input__control {
  display: block;
}
</style>
