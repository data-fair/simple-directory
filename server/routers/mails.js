const express = require('express')
const asyncWrap = require('../utils/async-wrap')

const config = require('config')

let router = module.exports = express.Router()

// Used by the users' directory to notify name updates
router.post('/', asyncWrap(async (req, res) => {
  const key = req.query.key
  if (!config.secretKeys.sendMails || config.secretKeys.sendMails !== key) {
    return res.status(403).send('Bad secret in "key" parameter')
  }
  const storage = req.app.get('storage')
  const transport = req.app.get('mailTransport')

  const to = []
  for (let t of req.body.to) {
    if (t.type === 'user') {
      to.push((await storage.getUser({ id: t.id })).email)
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
    text: req.body.text
  }

  if (req.body.html) {
    mail.html = req.body.html
  }

  res.send(await transport.sendMailAsync(mail))
}))
