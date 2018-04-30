const fs = require('fs')
const flatten = require('flat')
const unflatten = flatten.unflatten
const flatOpts = {delimiter: '_'}

// Build a map of messages of this form
// {fr: {msg1: 'libellé 1'}, en: {msg1: 'label 1'}}
const messages = {}
fs.readdirSync(__dirname)
  .filter(f => f !== 'index.js')
  .map(f => f.replace('.js', '').replace('.json', ''))
  .forEach(f => {
    messages[f] = require('./' + f)
  })

exports.locales = Object.keys(messages).map(l => ({code: l}))

const flatMessages = flatten(messages, flatOpts)

// Manage overriding by environment variables of this form
// 'I18N_en_msg1="another label"'
Object.keys(process.env).forEach(k => {
  if (k.startsWith('I18N_')) {
    flatMessages[k.replace('I18N_', '')] = process.env[k]
  }
})

exports.messages = unflatten(flatMessages, flatOpts)
