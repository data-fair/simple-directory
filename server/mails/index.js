const mjml2html = require('mjml')
const util = require('util')
const path = require('path')
const fs = require('fs')
const config = require('config')
const nodemailer = require('nodemailer')
const flatten = require('flat')

const mjmlTemplate = fs.readFileSync(path.join(__dirname, 'mail.mjml'), 'utf8')
const mjmlNoButtonTemplate = fs.readFileSync(path.join(__dirname, 'mail-nobutton.mjml'), 'utf8')

const maildevTransport = {
  port: config.maildev.smtp,
  ignoreTLS: true,
  default: 'localhost'
}

exports.init = async () => {
  const transport = nodemailer.createTransport(config.maildev.active ? maildevTransport : config.mails.transport)
  transport.sendMailAsync = util.promisify(transport.sendMail)
  return transport
}

// Custom micro templating to inject params into textual content with {param} syntax
const escapeRegExp = (str) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
function applyParams(txt, params) {
  Object.keys(params).forEach(p => {
    txt = txt.replace(new RegExp(escapeRegExp(`{${p}}`), 'g'), params[p])
  })
  return txt
}

exports.send = async ({ transport, key, messages, to, params }) => {
  params = {
    ...params,
    ...flatten({ theme: config.theme }),
    contact: config.contact,
    logo: config.theme.logo || 'https://cdn.rawgit.com/koumoul-dev/simple-directory/v0.12.3/public/assets/logo-150x150.png'
  }
  Object.keys(messages.mails[key]).forEach(k => {
    params[k] = applyParams(messages.mails[key][k], params)
  })
  const mjmlRes = mjml2html(applyParams(params.htmlButton ? mjmlTemplate : mjmlNoButtonTemplate, params))
  if (mjmlRes.errors && mjmlRes.errors.length) {
    console.error('Error while preparing mail body', mjmlRes.errors)
    throw new Error('Error while preparing mail body')
  }

  await transport.sendMailAsync({
    from: config.mails.from,
    to,
    subject: applyParams(messages.mails[key].subject, params),
    text: applyParams(messages.mails[key].text, params),
    html: mjmlRes.html
  })
}
