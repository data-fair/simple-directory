import config from '#config'
import { type Request } from 'express'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { flatten, unflatten } from 'flat'
import acceptLangParser from 'accept-language-parser'
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import 'dayjs/locale/en.js'
import 'dayjs/locale/de.js'
import 'dayjs/locale/it.js'
import 'dayjs/locale/es.js'
import 'dayjs/locale/pt.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'

dayjs.extend(localizedFormat)

export const localizedDayjs = dayjs

const flatOpts = { delimiter: '_' }

// cannot be changed at runtime for now, because it impacts the build
export const defaultLocale = config.i18n.defaultLocale

// this the full list of available langs, the proposed list is overwritten in config.i18n.locales
export const locales = [
  { code: 'fr' },
  { code: 'en' },
  { code: 'de' },
  { code: 'it' },
  { code: 'es' },
  { code: 'pt' }
]

// Build a map of messages of this form
// {fr: {msg1: 'libellé 1'}, en: {msg1: 'label 1'}}
const _messages: any = {}
for (const l of locales) {
  _messages[l.code] = (await import ('./' + l.code + '.js')).default
}
const flatMessages = flatten(_messages, flatOpts) as Record<string, string>

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
  if (!['common', 'pages'].includes(key.split('_')[1])) delete flatPublicMessages[key]
}
export const publicMessages = unflatten(flatPublicMessages, flatOpts)

const reqI18nKey = Symbol('reqI18n')

const getReqI18n = (req: Request) => {
  const locales = acceptLangParser.parse(req.get('Accept-Language'))
  const localeCode = (req.cookies.i18n_lang || locales[0]?.code || defaultLocale) as string
  return { localeCode, messages: messages[localeCode] ?? messages[defaultLocale] }
}

export const reqI18n = (req: Request) => {
  const reqAny = req as any
  if (!reqAny[reqI18nKey]) reqAny[reqI18nKey] = getReqI18n(req)
  return reqAny[reqI18nKey] as ReturnType<typeof getReqI18n>
}

export const __ = (req: Request, key: string, params: Record<string, string> = {}) => {
  const myI18n = reqI18n(req)
  return microTemplate(flatMessages[myI18n.localeCode + '_' + key] ?? flatMessages[defaultLocale + '_' + key], params)
}

export const __all = (key: string, params: Record<string, string> = {}) => {
  const res: Record<string, string> = {}
  for (const locale of locales) {
    const value = flatMessages[locale.code + '_' + key]
    if (value) {
      res[locale.code] = microTemplate(value, params)
    }
  }
  return res
}

export const __date = (req: Request, date: string) => {
  const myI18n = reqI18n(req)
  return dayjs(date).locale(myI18n.localeCode)
}
