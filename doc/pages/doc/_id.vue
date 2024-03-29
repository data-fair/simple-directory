<template lang="html">
  <v-container
    v-show="ready"
    class="doc-page"
    v-html="content"
  />
</template>

<script>

const flatten = require('flat')
// Webpack way of requiring a bunch of modules at once
const context = require.context('.', true, /\.md$/)

// Used to flatten var definitions from custom-environment-variables.js
const defaults = require('../../../config/default.js')
function flattenVars (vars, flatVars = [], prefix = '') {
  Object.keys(vars).forEach(v => {
    const key = prefix + v
    let def = key.split('.').reduce((a, k) => { return a[k] }, defaults)
    if (typeof def === 'object') def = JSON.stringify(def)
    if (typeof vars[v] === 'string') flatVars.push({ key, name: vars[v], def })
    else if (typeof vars[v] === 'object' && vars[v].__name) flatVars.push({ key, name: vars[v].__name, def })
    else flattenVars(vars[v], flatVars, prefix + v + '.')
  })
  return flatVars
}
const customEnvVars = flattenVars(require('../../../config/custom-environment-variables'))

function escapeHtml (unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default {
  data: () => ({ ready: false }),
  computed: {
    content () {
      if (!this.$route) return
      const content = context(`./${this.$route.params.id}-${this.$i18n.locale}.md`) || context(`./${this.$route.params.id}-fr.md`)
      return content.replace('{{I18N_VARS}}', this.i18nVars).replace('{{CONFIG_VARS}}', this.configVars)
    },
    configVars () {
      let table = `<table><thead><tr><th>${this.$t('doc.config.varKey')}</th><th>${this.$t('doc.config.varName')}</th><th>${this.$t('doc.config.varDesc')}</th><th>${this.$t('doc.config.varDefault')}</th></tr></thead><tbody>\n`
      customEnvVars.forEach(v => {
        const description = this.$te('doc.config.varDescriptions.' + v.key) ? this.$t('doc.config.varDescriptions.' + v.key) : ''
        table += `<tr><td>${v.key}</td><td>${v.name}</td><td>${description}</td><td>${v.def}</td></tr>\n`
      })
      table += '</tbody></table>'
      return table
    },
    i18nVars () {
      const flatMessages = flatten(this.$i18n.messages[this.$i18n.locale], { delimiter: '_' })
      let table = `<table><thead><tr><th>${this.$t('doc.config.i18nKey')}</th><th>${this.$t('doc.config.i18nVar')}</th><th>${this.$t('doc.config.i18nVal')}</th></tr></thead><tbody>\n`
      table += Object.keys(flatMessages)
        .filter(k => k.indexOf('doc_') !== 0)
        .map(k => `<tr><td>${k.replace(/_/g, '.')}</td><td>I18N_${this.$i18n.locale}_${k}</td><td><pre>${escapeHtml(flatMessages[k] || 'MISSING')}</pre></td></tr>`)
        .join('\n')
      table += '</tbody></table>'
      return table
    }
  },
  mounted () {
    // Apply classes from vuetify to markdown generated HTML
    const elemClasses = {
      h2: ['display-1'],
      h3: ['title', 'mb-4', 'mt-5'],
      h4: ['subheading', 'mb-3', 'mt-4'],
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

<style>
.doc-page pre {
  white-space: pre-wrap;
}
</style>
