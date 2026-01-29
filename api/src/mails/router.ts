import config from '#config'
import { Router } from 'express'
import { reqSiteUrl, reqIp, reqUser, session, httpError, reqIsInternal } from '@data-fair/lib-express'
import { internalError } from '@data-fair/lib-node/observer.js'
import storages from '#storages'
import mongo from '#mongo'
import { RateLimiterMongo } from 'rate-limiter-flexible'
import emailValidator from 'email-validator'
import multer from 'multer'
import { reqI18n } from '#i18n'
import { sendMail } from './service.ts'
import type { FindMembersParams } from '../storages/interface.ts'
import { reqSite } from '#services'

const router = Router()
export default router

const upload = multer({ storage: multer.diskStorage({}) })

router.post('/', async (req, res, next) => {
  const key = req.query.key
  if (!config.secretKeys.sendMails || config.secretKeys.sendMails !== key) {
    throw httpError(403, 'Bad secret in "key" parameter')
  }
  if (!reqIsInternal(req)) {
    internalError('mails-send', 'Trying to send mails from an external request')
    // TODO: make this blocking in a coming release
    // throw httpError(403, 'Forbidden')
  }
  next()
}, upload.any(), async (req, res) => {
  const mailBody = (await import('#types/mail/index.ts')).returnValid(typeof req.body.body === 'string' ? JSON.parse(req.body.body) : req.body)
  const storage = storages.globalStorage
  const results = []
  for (const t of mailBody.to) {
    // separte mail per recipient, prevents showing email addresses from other users
    // but a single mail per orgs/members, showing emails is not a problem in this case
    const to = new Set<string>([])
    if (typeof t === 'string') {
      to.add(t)
    } else if (t.type === 'user') {
      const user = (await storage.getUser(t.id))
      if (user) to.add(user.email)
      else console.error('Trying to send an email to a user that doesn\'t exist anymore')
    } else if (t.type === 'organization') {
      const membersParams: FindMembersParams = { size: 10000, skip: 0 }
      if (t.role) membersParams.roles = [t.role]
      if (t.department && t.department !== '*') membersParams.departments = [t.department]
      if (!t.department) membersParams.departments = ['-']
      const members = await storage.findMembers(t.id, membersParams)
      members.results.forEach(member => to.add(member.email))
    }
    let attachments: { filename: string, path: string }[] = []
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path
      }))
    }

    let host, path
    if (mailBody.sender) {
      if (mailBody.sender.type === 'organization') {
        const org = await storage.getOrganization(mailBody.sender.id)
        if (org) {
          host = org.host
          path = org.path
        }
      }
      if (mailBody.sender.type === 'user') {
        const user = await storage.getUser(mailBody.sender.id)
        if (user) {
          host = user.host
          path = user.path
        }
      }
    }

    results.push(await sendMail([...to].join(', '), {
      replyTo: mailBody.replyTo,
      host,
      path,
      subject: mailBody.subject,
      text: mailBody.text ?? '',
      htmlMsg: mailBody.html ?? mailBody.text ?? '',
      htmlCaption: ''
    }, attachments))
  }
  res.send(results)
})

// protect contact route with rate limiting to prevent spam
let _contactLimiter: RateLimiterMongo | undefined
router.post('/contact', async (req, res) => {
  if (!reqUser(req) && !config.anonymousContactForm) return res.status(401).send('anonymous contact form functionality is not activated')

  if (req.body.from) req.body.from = req.body.from.trim()
  if (!emailValidator.validate(req.body.from)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)

  if (!reqUser(req)) {
    if (!req.body.token) return res.status(401).send()

    try {
      // 1rst level of anti-spam protection, validate that the user was present on the page for a few seconds before sending
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
    // 2nd level of anti-spam protection, simple rate limiting based on ip
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
  
  ${req.body.text}`

  const site = await reqSite(req)

  await sendMail(site?.mails?.contact ?? config.contact, {
    replyTo: req.body.from,
    host: site?.host,
    path: site?.path,
    subject: req.body.subject,
    text,
    htmlMsg: text,
    htmlCaption: ''
  })
  res.send(req.body)
})
