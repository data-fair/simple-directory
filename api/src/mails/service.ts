import mjml2html from 'mjml'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { join } from 'path'
import { readFileSync, existsSync } from 'node:fs'
import config from '#config'
import { flatten } from 'flat'
import EventEmitter from 'node:events'
import mailsTransport from './transport.ts'

export const events = new EventEmitter()

const newTplPath = join(import.meta.dirname, 'mail.mjml')
let mjmlTemplate = readFileSync(newTplPath, 'utf8')
const oldTplPath = '/webapp/server/mails/mail.mjml'
if (existsSync(oldTplPath)) {
  console.error(`WARNING: found a mail template at deprecated path ${oldTplPath}, please use new path ${newTplPath}`)
  mjmlTemplate = readFileSync(oldTplPath, 'utf8')
}

const newNoButtonTplPath = join(import.meta.dirname, 'mail-nobutton.mjml')
let mjmlNoButtonTemplate = readFileSync(newNoButtonTplPath, 'utf8')
const oldNoButtonTplPath = '/webapp/server/mails/mail-nobutton.mjml'
if (existsSync(oldNoButtonTplPath)) {
  console.error(`WARNING: found a mail template at deprecated path ${oldNoButtonTplPath}, please use new path ${newNoButtonTplPath}`)
  mjmlNoButtonTemplate = readFileSync(oldNoButtonTplPath, 'utf8')
}

export const sendMail = async (key: string, messages: any, to: string, params: Record<string, string>) => {
  params = {
    ...params,
    ...flatten({ theme: config.theme }),
    contact: config.contact,
    logo: config.theme.logo || 'https://cdn.rawgit.com/koumoul-dev/simple-directory/v0.12.3/public/assets/logo-150x150.png',
    ...config.mails.extraParams // override with extra params from config, default to {}
  }
  if (params.link) {
    const linkUrl = new URL(params.link)
    params.host = linkUrl.host
    params.origin = linkUrl.origin
  }
  Object.keys(messages.mails[key]).forEach(k => {
    params[k] = microTemplate(messages.mails[key][k], params)
  })
  events.emit('send', params)
  const mjmlRes = mjml2html(microTemplate(params.htmlButton ? mjmlTemplate : mjmlNoButtonTemplate, params))
  if (mjmlRes.errors && mjmlRes.errors.length) {
    console.error('Error while preparing mail body', mjmlRes.errors)
    throw new Error('Error while preparing mail body')
  }

  await mailsTransport.sendMail({
    from: config.mails.from,
    to,
    subject: microTemplate(messages.mails[key].subject, params),
    text: microTemplate(messages.mails[key].text, params),
    html: mjmlRes.html
  })
}
