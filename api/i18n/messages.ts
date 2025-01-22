import { flatten, unflatten } from 'flat'
import config from '../src/config.ts'
const flatOpts = { delimiter: '_' }

// Build a map of messages of this form
// {fr: {msg1: 'libellé 1'}, en: {msg1: 'label 1'}}
const _messages: any = {}
for (const l of config.i18n.locales) {
  _messages[l] = (await import ('./' + l + '.js')).default
}
export const flatMessages = flatten(_messages, flatOpts) as Record<string, string>

// Manage overriding by environment variables of this form
// 'I18N_en_msg1="another label"'
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('I18N_') && typeof value === 'string') {
    flatMessages[key.replace('I18N_', '')] = value
  }
}
export const messages: any = unflatten(flatMessages, flatOpts)

// A subset of messages for UI separated for performance.
const flatPublicMessages = { ...flatMessages }
for (const key of Object.keys(flatPublicMessages)) {
  if (!['root', 'common', 'pages', 'errors', 'notifications'].includes(key.split('_')[1])) delete flatPublicMessages[key]
}
export const publicMessages = unflatten(flatPublicMessages, flatOpts) as any
