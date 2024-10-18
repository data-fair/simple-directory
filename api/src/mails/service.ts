import mjml2html from 'mjml'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer'
import { promisify } from 'node:util'
const path = require('path')
const fs = require('fs')
import config from '#config'
const flatten = require('flat')
const EventEmitter = require('events')

export const events = new EventEmitter()

const mjmlTemplate = fs.readFileSync(path.join(__dirname, 'mail.mjml'), 'utf8')
const mjmlNoButtonTemplate = fs.readFileSync(path.join(__dirname, 'mail-nobutton.mjml'), 'utf8')

const maildevTransport = {
  port: config.maildev.smtp,
  ignoreTLS: true,
  host: '127.0.0.1'
}

let transport: Transporter | undefined
let sendMailAsync: ((opts: SendMailOptions) => Promise<unknown>) | undefined
export const start = async () => {
  transport = nodemailer.createTransport(config.maildev.active ? maildevTransport : config.mails.transport)
  sendMailAsync = promisify(transport.sendMail).bind(transport)
}

export const stop = () => {
  if (transport) transport.close()
}

export const sendMail = async (key: string, messages: any, to: string, params: Record<string, string>) => {
  if (!sendMailAsync) throw new Error('mail transport was not initialized')

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

  await sendMailAsync({
    from: config.mails.from,
    to,
    subject: microTemplate(messages.mails[key].subject, params),
    text: microTemplate(messages.mails[key].text, params),
    html: mjmlRes.html
  })
}

export const sendMailRaw = async (opts: SendMailOptions) => {
  if (!sendMailAsync) throw new Error('mail transport was not initialized')
  await sendMailAsync(opts)
}
