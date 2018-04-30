<template lang="html">
  <v-container v-show="ready" class="doc-page" v-html="content"/>
</template>

<script>

// Webpack way of requiring a bunch of modules at once
const context = require.context('.', true, /\.md$/)
const flatten = require('flat')

export default {
  data: () => ({ready: false}),
  computed: {
    content() {
      if (!this.$route) return
      const content = context(`./${this.$route.params.id}-${this.$i18n.locale}.md`) || context(`./${this.$route.params.id}-fr.md`)
      return content.replace('{{I18N_VARS}}', this.i18nVars)
    },
    i18nVars() {
      const flatMessages = flatten(this.$i18n.messages[this.$i18n.locale], {delimiter: '_'})
      let table = `<table><thead><tr><th>${this.$t('doc.config.i18nKey')}</th><th>${this.$t('doc.config.i18nVar')}</th><th>${this.$t('doc.config.i18nVal')}</th></tr></thead><tbody>`
      table += Object.keys(flatMessages)
        .filter(k => k.indexOf('doc_') !== 0)
        .map(k => `<tr><td>${k.replace('_', '.')}</td><td>I18N_${this.$i18n.locale}_${k}</td><td>${flatMessages[k]}</td></tr>`)
        .join('\n')
      table += '</tbody></table>'
      return table
    }
  },
  mounted() {
    // Apply classes from vuetify to markdown generated HTML
    const elemClasses = {
      h2: ['display-1', 'my-4'],
      h3: ['title', 'my-3'],
      h4: ['subheading', 'my-2'],
      p: ['body1'],
      table: ['datatable', 'table', 'card']
    }
    Object.keys(elemClasses).forEach(k => {
      this.$el.querySelectorAll(k).forEach(e => {
        elemClasses[k].forEach(c => e.classList.add(c))
      })
    })
    this.ready = true
  }
}
</script>

<style lang="less">
/*.doc-page {

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
*/
</style>
