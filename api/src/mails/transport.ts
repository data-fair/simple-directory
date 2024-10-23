import { promisify } from 'node:util'
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer'
import config from '#config'
import { internalError } from '@data-fair/lib-node/observer.js'

const maildevTransport = {
  port: config.maildev.smtp,
  ignoreTLS: true,
  host: '127.0.0.1'
}

class MailsTransport {
  private transport: Transporter | undefined
  private sendMailAsync: ((opts: SendMailOptions) => Promise<unknown>) | undefined

  get sendMail () {
    if (!this.sendMailAsync) throw new Error('mails transport was not initialized')
    return this.sendMailAsync
  }

  async start () {
    this.transport = nodemailer.createTransport(config.maildev.active ? maildevTransport : config.mails.transport)
    this.sendMailAsync = promisify(this.transport.sendMail).bind(this.transport)
    // we check the connection but in a none blocking way, most of SD services can work even
    // if the mails service is down
    const verifyAsync = promisify(this.transport.verify).bind(this.transport)
    try {
      await verifyAsync()
    } catch (err) {
      internalError('mails-transport-verify', err)
    }
  }

  stop () {
    if (this.transport) this.transport.close()
  }
}

const mailsTransport = new MailsTransport()
export default mailsTransport
