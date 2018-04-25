<template lang="html">
  <v-container class="doc-page" v-html="content"/>
</template>

<script>

// Webpack way of requiring a bunch of modules at once
const context = require.context('.', true, /\.md$/)

export default {
  computed: {
    content() {
      if (!this.$route) return
      return context(`./${this.$route.params.id}-${this.$i18n.locale}.md`)
    }
  }
}
</script>

<style lang="less">
.doc-page {

  // Same as display-1 from vuetify
  h2 {
    font-size: 34px!important;
    line-height: 40px!important;
    font-weight: 400;
    letter-spacing: normal!important;

    margin-top: 32px;
    margin-bottom: 32px;
  }

  // Same as title from vuetify
  h3 {
    font-size: 20px!important;
    font-weight: 500;
    line-height: 1!important;
    letter-spacing: .02em!important;

    margin-top: 32px;
    margin-bottom: 32px;
  }

  // Same as subheading from vuetify
  h4 {
    font-size: 16px!important;
    font-weight: 400;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  // Same as body-1 from vuetify
  p {
    font-weight: 400;
    font-size: 14px!important;
  }
}
</style>
