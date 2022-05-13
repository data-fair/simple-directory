const flatten = require('flat')
const unflatten = flatten.unflatten
const acceptLangParser = require('accept-language-parser')
const flatOpts = { delimiter: '_' }

// cannot be changed at runtime for now, because it impacts the build
exports.defaultLocale = 'fr'
// this the full list of available langs, the proposed list is overwritten in config.i18n.locales
exports.locales = [
  { code: 'fr' },
  { code: 'en' },
  { code: 'de' },
  { code: 'it' },
  { code: 'es' },
  { code: 'pt' }
]

// Build a map of messages of this form
// {fr: {msg1: 'libellé 1'}, en: {msg1: 'label 1'}}
const messages = {}
exports.locales.forEach(l => {
  messages[l.code] = { ...require('./' + exports.defaultLocale), ...require('./' + l.code) }
})

const flatMessages = flatten(messages, flatOpts)

// Manage overriding by environment variables of this form
// 'I18N_en_msg1="another label"'
Object.keys(process.env).forEach(k => {
  if (k.startsWith('I18N_')) {
    flatMessages[k.replace('I18N_', '')] = process.env[k]
  }
})

exports.messages = unflatten(flatMessages, flatOpts)

// A subset of messages for UI separated for performance.
exports.publicMessages = unflatten(
  Object.keys(flatMessages)
    .filter(k => ['common', 'pages', 'doc'].includes(k.split('_')[1]))
    .reduce((a, k) => { a[k] = flatMessages[k]; return a }, {})
  , flatOpts)

exports.middleware = (req, res, next) => {
  const locales = acceptLangParser.parse(req.get('Accept-Language'))
  const localeCode = req.cookies.i18n_lang || (locales && locales[0] && locales[0].code) || exports.defaultLocale
  req.messages = exports.messages[localeCode] || exports.messages[exports.defaultLocale]

  // TODO: memoize ? use standard i18n module ?

  req.__ = (key, params = {}) => {
    key = key.replace(/\./g, '_')
    let value = flatMessages[localeCode + '_' + key] || flatMessages[exports.defaultLocale + '_' + key] || ''
    Object.keys(params).forEach(key => { value = value.replace(`{${key}}`, params[key]) })
    return value
  }
  req.__all = (key, params = {}) => {
    key = key.replace(/\./g, '_')
    const res = {}
    for (const locale of exports.locales) {
      let value = flatMessages[locale.code + '_' + key]
      if (value) {
        Object.keys(params).forEach(key => { value = value.replace(`{${key}}`, params[key]) })
        res[locale.code] = value
      }
    }
    return res
  }
  next()
}
