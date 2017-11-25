const fs = require('fs')
const path = require('path')
const express = require('express')
const jwt = require('jsonwebtoken')

const config = require('config')
const privateKey = fs.readFileSync(path.join(__dirname, '..', config.secret.private))
const publicKey = fs.readFileSync(path.join(__dirname, '..', config.secret.public))

let router = express.Router()

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', async(req, res, next) => {
  const user = await req.app.get('storage').getUserByEmail(req.body.email)
  if (!user) return res.sendStatus(404)
  const organizations = await req.app.get('storage').getUserOrganizations(user.id)
  const token = jwt.sign({
    id: user.id,
    email: req.body.email,
    organizations: organizations.map(organization => ({
      id: organization.id,
      role: organization.members.find(m => m.id === user.id).role
    }))
  }, privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.expiresIn,
    keyid: config.kid
  })
  if (req.query.redirect) {
    // res.redirect(req.query.redirect + token)
    res.send(req.query.redirect + token)
  } else {
    res.send(token)
  }
})

// Used to extend an older but still valid token from a user or to validate a passwordless id_token
router.post('/exchange', (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  jwt.verify(idToken, publicKey, async(err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid id_token')
    }
    delete decoded.iat
    delete decoded.exp

    // User may have new organizations since last renew
    const organizations = await req.app.get('storage').getUserOrganizations(decoded.id)
    decoded.organizations = organizations.map(organization => ({
      id: organization.id,
      role: organization.members.find(m => m.id === decoded.id).role
    }))

    const token = jwt.sign(decoded, privateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwt.expiresIn,
      keyid: config.kid
    })
    res.cookie('id_token', token)
    res.status(201).send(token)
  })
})

module.exports = router
