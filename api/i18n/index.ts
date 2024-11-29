import config from '../src/config.ts'
import { type Request } from 'express'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import acceptLangParser from 'accept-language-parser'
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import 'dayjs/locale/en.js'
import 'dayjs/locale/de.js'
import 'dayjs/locale/it.js'
import 'dayjs/locale/es.js'
import 'dayjs/locale/pt.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import { messages, flatMessages } from './messages.ts'

export { messages } from './messages.ts'

dayjs.extend(localizedFormat)

export const localizedDayjs = dayjs

// cannot be changed at runtime for now, because it impacts the build
export const defaultLocale = config.i18n.defaultLocale

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

export const getMessage = (localeCode: string, key: string, params: Record<string, string> = {}) => {
  const flatKey = key.replace(/\./g, '_')
  return microTemplate(flatMessages[localeCode + '_' + flatKey] ?? flatMessages[defaultLocale + '_' + flatKey], params)
}

export const __ = (req: Request, key: string, params: Record<string, string> = {}) => {
  const myI18n = reqI18n(req)
  return getMessage(myI18n.localeCode, key, params)
}

export const __all = (key: string, params: Record<string, string> = {}) => {
  const res: Record<string, string> = {}
  for (const locale of config.i18n.locales) {
    const value = flatMessages[locale + '_' + key]
    if (value) {
      res[locale] = microTemplate(value, params)
    }
  }
  return res
}

export const __date = (req: Request, date: string) => {
  const myI18n = reqI18n(req)
  return dayjs(date).locale(myI18n.localeCode)
}
