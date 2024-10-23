import config from '#config'
import { Router } from 'express'
import { reqSiteUrl, reqIp, reqUser, session } from '@data-fair/lib-express'
import { type SendMailOptions } from 'nodemailer'
import storages from '#storages'
import mongo from '#mongo'
import { RateLimiterMongo } from 'rate-limiter-flexible'
import emailValidator from 'email-validator'
import { reqI18n } from '#i18n'
import mailsTransport from './transport.ts'
import type { FindMembersParams } from '../storages/interface.ts'

const router = Router()
export default router

router.post('/', async (req, res) => {
  const key = req.query.key
  if (!config.secretKeys.sendMails || config.secretKeys.sendMails !== key) {
    return res.status(403).send('Bad secret in "key" parameter')
  }
  const storage = storages.globalStorage
  const results = []
  for (const t of req.body.to) {
    // separte mail per recipient, prevents showing email addresses from other users
    // but a single mail per orgs/members, showing emails is not a problem in this case
    const to = new Set<string>([])
    if (t.type === 'user') {
      const user = (await storage.getUser(t.id))
      if (user) to.add(user.email)
      else console.error('Trying to send an email to a user that doesn\'t exist anymore')
    }
    if (t.type === 'organization') {
      const membersParams: FindMembersParams = { size: 10000, skip: 0 }
      if (t.role) membersParams.roles = [t.role]
      if (t.department && t.department !== '*') membersParams.departments = [t.department]
      if (!t.department) membersParams.departments = ['-']
      const members = await storage.findMembers(t.id, membersParams)
      members.results.forEach(member => to.add(member.email))
    }

    const mail: SendMailOptions = {
      from: config.mails.from,
      to: [...to].join(', '),
      subject: req.body.subject,
      text: req.body.text
    }

    if (req.body.html) {
      mail.html = req.body.html
    }
    results.push(await mailsTransport.sendMail(mail))
  }
  res.send(results)
})

// protect contact route with rate limiting to prevent spam
let _contactLimiter: RateLimiterMongo | undefined
router.post('/contact', async (req, res) => {
  if (!reqUser(req) && !config.anonymousContactForm) return res.status(401).send()

  if (!emailValidator.validate(req.body.from)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)

  if (!reqUser(req)) {
    if (!req.body.token) return res.status(401).send()

    // 1rst level of anti-spam prevention, no cross origin requests on this route
    if (req.headers.origin && !reqSiteUrl(req).startsWith(req.headers.origin)) {
      return res.status(405).send('Appel depuis un domaine extérieur non supporté')
    }

    try {
      // 2nd level of anti-spam protection, validate that the user was present on the page for a few seconds before sending
      await session.verifyToken(req.body.token)
    } catch (err: any) {
      if (err.name === 'NotBeforeError') {
        return res.status(429).send('Message refusé, l\'activité ressemble à celle d\'un robot spammeur.')
      } else {
        return res.status(401).send('Invalid id_token')
      }
    }
  }
  try {
    // 3rd level of anti-spam protection, simple rate limiting based on ip
    _contactLimiter = _contactLimiter ?? new RateLimiterMongo({
      storeClient: mongo.client,
      dbName: mongo.db.databaseName,
      keyPrefix: 'sd-rate-limiter-contact',
      points: 1,
      duration: 60
    })
    await _contactLimiter.consume(reqIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /mails/contact route', reqIp(req), req.body.email, err)
    return res.status(429).send('Trop de messages dans un bref interval. Veuillez patienter avant d\'essayer de nouveau.')
  }

  const text = `Message transmis par le formulaire de contact de ${reqSiteUrl(req)}
  Adresse mail renseignée par l'utilisateur : ${req.body.from}
  
  ${req.body.text}`

  const mail: SendMailOptions = {
    from: config.mails.from,
    to: config.contact,
    subject: req.body.subject,
    text
  }

  await mailsTransport.sendMail(mail)
  res.send(req.body)
})
