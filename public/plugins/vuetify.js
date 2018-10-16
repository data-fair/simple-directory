import Vue from 'vue'
import {
  Vuetify,
  VApp,
  VAlert,
  VBtn,
  VDialog,
  VGrid,
  VToolbar,
  VCard,
  VForm,
  VList,
  VIcon,
  VMenu,
  VSubheader,
  VSelect,
  VFooter,
  VSpeedDial,
  VTextarea,
  VTextField,
  VDivider,
  VSnackbar,
  VNavigationDrawer,
  VResponsive
} from 'vuetify'
require('vuetify/src/stylus/app.styl')

export default ({ env }) => {
  Vue.use(Vuetify, {
    components: {
      VApp,
      VAlert,
      VBtn,
      VDialog,
      VGrid,
      VToolbar,
      VCard,
      VForm,
      VList,
      VIcon,
      VMenu,
      VSubheader,
      VSelect,
      VFooter,
      VSpeedDial,
      VTextarea,
      VTextField,
      VDivider,
      VSnackbar,
      VNavigationDrawer,
      VResponsive
    },
    theme: env.theme.colors
  })
}
