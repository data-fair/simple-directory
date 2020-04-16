<template>
  <v-list-tile avatar>
    <v-list-tile-avatar size="50">
      <v-img v-if="owner && !loading" :src="owner.avatarUrl" />
    </v-list-tile-avatar>
    <v-list-tile-content>

      <input type="file" accept="image/png, image/jpeg" @change="openFile($event)">

      <v-dialog v-model="dialog" :loading="loading" persistent max-width="700">
        <v-card>
          <v-card-title class="headline" v-text="$t('pages.avatar.prepare')"/>
          <v-card-text>
            <vue-cropper
              ref="cropper"
              :src="imgSrc"
              :aspect-ratio="1"
              :auto-crop="true"
              alt="Avatar"/>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn flat @click="dialog = false" v-text="$t('common.confirmCancel')" />
            <v-btn :disabled="loading" color="primary" @click="validate" v-text="$t('common.validate')" />
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-list-tile-content>
  </v-list-tile>
</template>

<script>
import { mapState } from 'vuex'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'

// see https://stackoverflow.com/a/5100158
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString
  if (dataURI.split(',')[0].indexOf('base64') >= 0) { byteString = atob(dataURI.split(',')[1]) } else { byteString = unescape(dataURI.split(',')[1]) }

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length)
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return new Blob([ia], { type: mimeString })
}

export default {
  components: {
    VueCropper
  },
  props: {
    owner: { type: Object, default: null }
  },
  data() {
    return {
      dialog: false,
      loading: false,
      imgSrc: null
    }
  },
  computed: {
    ...mapState(['env'])
  },
  methods: {
    openFile(event) {
      const target = event.target
      const reader = new FileReader()
      reader.onload = (event) => {
        this.imgSrc = event.target.result
        this.dialog = true
        this.$refs.cropper.replace(this.imgSrc)
        target.value = '' // empty the file input right after
      }
      reader.readAsDataURL(event.target.files[0])
    },
    async validate() {
      this.loading = true
      const croppedImg = dataURItoBlob(this.$refs.cropper.getCroppedCanvas({ width: 100, height: 100 }).toDataURL('image/png'))
      const formData = new FormData()
      formData.append('avatar', croppedImg)
      await this.$axios.$post(`${this.env.publicUrl}/api/avatars/${this.owner.type}/${this.owner.id}/avatar.png`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      this.dialog = false
      this.loading = false
    }
  }
}
</script>

<style lang="css" scoped>
</style>
