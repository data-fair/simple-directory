const config = require('config')
const express = require('express')
const emailValidator = require('email-validator')
const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible')
const requestIp = require('request-ip')
const asyncWrap = require('../utils/async-wrap')
const jwt = require('../utils/jwt')

const router = module.exports = express.Router()

// Used by the users' directory to notify name updates
router.post('/', asyncWrap(async (req, res) => {
  const key = req.query.key
  if (!config.secretKeys.sendMails || config.secretKeys.sendMails !== key) {
    return res.status(403).send('Bad secret in "key" parameter')
  }
  const storage = req.app.get('storage')
  const transport = req.app.get('mailTransport')

  const to = []
  for (const t of req.body.to) {
    if (t.type === 'user') {
      const user = (await storage.getUser({ id: t.id }))
      if (user) to.push(user.email)
      else console.error('Trying to send an email to a user that doesn\'t exist anymore')
    }
    if (t.type === 'organization') {
      const members = await storage.findMembers(t.id, { roles: t.role && [t.role], size: 10000, skip: 0 })
      members.results.forEach(member => to.push(member.email))
    }
  }

  const mail = {
    from: config.mails.from,
    bcc: to.join(', '),
    subject: req.body.subject,
    text: req.body.text,
  }

  if (req.body.html) {
    mail.html = req.body.html
  }

  res.send(await transport.sendMailAsync(mail))
}))

// protect contact route with rate limiting to prevent spam
let _limiter
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-contact',
  points: 1,
  duration: 60,
}
const limiter = (req) => {
  if (config.storage.type === 'mongo') {
    _limiter = _limiter || new RateLimiterMongo({ storeClient: req.app.get('storage').client, ...limiterOptions })
  } else {
    _limiter = _limiter || new RateLimiterMemory(limiterOptions)
  }
  return _limiter
}

router.post('/contact', asyncWrap(async (req, res) => {
  if (!req.user && !config.anonymousContactForm) return res.status(401).send()

  if (!emailValidator.validate(req.body.from)) return res.status(400).send(req.messages.errors.badEmail)

  if (!req.user) {
    if (!req.body.token) return res.status(401).send()

    // 1rst level of anti-spam prevention, no cross origin requests on this route
    if (req.headers.origin && !req.baseUrl.startsWith(req.headers.origin)) {
      return res.status(405).send('Appel depuis un domaine extérieur non supporté')
    }

    try {
      // 2nd level of anti-spam protection, validate that the user was present on the page for a few seconds before sending
      await jwt.verify(req.app.get('keys'), req.body.token)
    } catch (err) {
      if (err.name === 'NotBeforeError') {
        return res.status(429).send('Message refusé, l\'activité ressemble à celle d\'un robot spammeur.')
      } else {
        return res.status(401).send('Invalid id_token')
      }
    }
  }
  try {
    // 3rd level of anti-spam protection, simple rate limiting based on ip
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /mails/contact route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send('Trop de messages dans un bref interval. Veuillez patienter avant d\'essayer de nouveau.')
  }

  const mail = {
    from: req.body.from,
    to: config.contact,
    subject: req.body.subject,
    text: req.body.text,
  }

  await req.app.get('mailTransport').sendMailAsync(mail)
  res.send(req.body)
}))
