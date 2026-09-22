import { flatten, unflatten } from 'flat'
import config from '../src/config.ts'
import fr from './fr.js'
import en from './en.js'
import es from './es.js'
import pt from './pt.js'
import it from './it.js'
import de from './de.js'
const flatOpts = { delimiter: '_' }

// static imports: this module is also bundled into the vite dev config, where a relative
// dynamic import would not resolve
const allMessages: Record<string, any> = { fr, en, es, pt, it, de }

// Build a map of messages of this form
// {fr: {msg1: 'libellé 1'}, en: {msg1: 'label 1'}}
const _messages: any = {}
for (const l of config.i18n.locales) {
  if (!allMessages[l]) throw new Error(`unsupported locale "${l}" in config i18n.locales`)
  _messages[l] = allMessages[l]
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
