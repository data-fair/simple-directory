import mjml2html from 'mjml'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { join } from 'path'
import { readFileSync, existsSync } from 'node:fs'
import config from '#config'
import { flatten } from 'flat'
import EventEmitter from 'node:events'
import mailsTransport from './transport.ts'
import { getSiteByUrl, getSiteByHost } from '#services'

export const events = new EventEmitter()

const genericTplPath = join(import.meta.dirname, 'generic-mail.mjml')
const genericTemplate = readFileSync(genericTplPath, 'utf8')
let mainSiteTemplate = genericTemplate

const newTplPath = join(import.meta.dirname, 'mail.mjml')
if (existsSync(newTplPath)) mainSiteTemplate = readFileSync(newTplPath, 'utf8')
const oldTplPath = '/webapp/server/mails/mail.mjml'
if (existsSync(oldTplPath)) {
  console.error(`WARNING: found a mail template at deprecated path ${oldTplPath}, please use new path ${newTplPath}`)
  mainSiteTemplate = readFileSync(oldTplPath, 'utf8')
}

const genericNoButtonTplPath = join(import.meta.dirname, 'generic-mail-nobutton.mjml')
const genericNoButtonTemplate = readFileSync(genericNoButtonTplPath, 'utf8')

let mainSiteNoButtonTemplate = genericNoButtonTemplate
const newNoButtonTplPath = join(import.meta.dirname, 'mail-nobutton.mjml')
if (existsSync(newNoButtonTplPath)) mainSiteNoButtonTemplate = readFileSync(newNoButtonTplPath, 'utf8')
const oldNoButtonTplPath = '/webapp/server/mails/mail-nobutton.mjml'
if (existsSync(oldNoButtonTplPath)) {
  console.error(`WARNING: found a mail template at deprecated path ${oldNoButtonTplPath}, please use new path ${newNoButtonTplPath}`)
  mainSiteNoButtonTemplate = readFileSync(oldNoButtonTplPath, 'utf8')
}

type SendMailI18nParams = {
  link?: string
  host?: string
  path?: string
  origin?: string
  [key: string]: any
}

type FlatTheme = {
  'theme.colors.primary': string
  [key: string]: any
}

type I18nMailMessages = {
  subject: string
  text: string
  htmlMsg: string
  htmlCaption: string
  htmlButton?: string
  htmlAlternativeLink?: string
}

type SendMailTmplParams = SendMailI18nParams & FlatTheme & I18nMailMessages & {
  contact: string
  logo: string
}

type SendMailParams = SendMailI18nParams & I18nMailMessages

export const getI18NParams = (key: string, messages: any, params: SendMailI18nParams) => {
  const i18nParams: Record<string, any> = {}
  Object.keys(messages.mails[key]).forEach(k => {
    i18nParams[k] = microTemplate(messages.mails[key][k], params)
  })
  return i18nParams as I18nMailMessages
}

export const sendMailI18n = async (key: string, messages: any, to: string, params: SendMailI18nParams) => {
  if (params.link) {
    const linkUrl = new URL(params.link)
    params.host = linkUrl.host
    params.origin = linkUrl.origin
    params.path = linkUrl.pathname
  }
  await sendMail(to, { ...params, ...getI18NParams(key, messages, params) })
}

export const sendMail = async (to: string, params: SendMailParams, attachments?: { filename: string, path: string }[]) => {
  let site = params.link && (await getSiteByUrl(params.link))
  if (!site && params.host) {
    site = await getSiteByHost(params.host, params.path ?? '')
  }

  const flatTheme: FlatTheme = flatten({ theme: config.theme })
  let logo = config.theme.logo || 'https://cdn.rawgit.com/koumoul-dev/simple-directory/v0.12.3/public/assets/logo-150x150.png'
  let from = config.mails.from
  let template = params.htmlButton ? mainSiteTemplate : mainSiteNoButtonTemplate
  if (site && site?.mails?.from) {
    from = site.mails.from
    Object.assign(flatTheme, flatten({ theme: site.theme }))
    logo = site.theme.logo || logo
    template = params.htmlButton ? genericTemplate : genericNoButtonTemplate
  }

  const tmplParams: SendMailTmplParams = {
    ...params,
    ...flatTheme,
    contact: config.contact,
    logo,
    ...config.mails.extraParams // override with extra params from config, default to {}
  }

  events.emit('send', tmplParams)

  const mjmlRes = mjml2html(microTemplate(template, tmplParams))
  if (mjmlRes.errors && mjmlRes.errors.length) {
    console.error('Error while preparing mail body', mjmlRes.errors)
    throw new Error('Error while preparing mail body')
  }

  return await mailsTransport.sendMail({
    from,
    to,
    subject: params.subject,
    text: params.text,
    html: mjmlRes.html,
    attachments
  })
}
