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
    >
      mdi-close
    </v-icon>-->
    <v-row class="mt-0 mx-0">
      <v-avatar
        class="mt-1 mr-1"
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
        :placeholder="$t('pages.avatar.load')"
        variant="outlined"
        density="compact"
        prepend-icon=""
        @change="change"
      >
        <template #append>
          <v-fab
            v-if="file && !hideValidate"
            size="x-small"
            color="primary"
            :title="$t('common.validate')"
            style="position: relative; top: -4px;"
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
import { mapState } from 'vuex'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'

// see https://stackoverflow.com/a/5100158
function dataURItoBlob (dataURI) {
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

export default {
  components: {
    VueCropper
  },
  props: {
    owner: { type: Object, default: null },
    disabled: { type: Boolean, default: false },
    hideValidate: { type: Boolean, default: false }
  },
  data () {
    return {
      dialog: false,
      loading: false,
      file: null,
      imgSrc: null,
      cropperOptions: { aspectRatio: 1, autoCrop: true }
    }
  },
  computed: {
    ...mapState(['env']),
    avatarUrl () {
      let url = `${this.$sdUrl}/api/avatars/${this.owner.type}/${this.owner.id}`
      if (this.owner.department) url += `/${this.owner.department}`
      url += '/avatar.png'
      return url
    }
  },
  methods: {
    change (event) {
      if (!this.file) {
        this.imgSrc = null
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        this.imgSrc = event.target.result
        if (this.$refs.cropper) this.$refs.cropper.replace(this.imgSrc)
      }
      reader.readAsDataURL(this.file)
    },
    async validate () {
      if (!this.file) return
      this.loading = true
      const croppedImg = dataURItoBlob(this.$refs.cropper.getCroppedCanvas({ width: 100, height: 100 }).toDataURL('image/png'))
      const formData = new FormData()
      formData.append('avatar', croppedImg)
      await this.$axios.$post(this.avatarUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      this.loading = false
      this.file = null
    },
    getTimestamp () {
      return new Date().getTime()
    }
  }
}
</script>

<style lang="css">
.vjsf-crop-img>.v-input__control>.v-input__slot {
  display: block;
}
</style>
