const express = require('express')
const asyncWrap = require('../utils/async-wrap')
const noAvatar = require('no-avatar')
const makeAvatar = require('util').promisify(noAvatar.make)
const colors = require('material-colors')
const seedrandom = require('seedrandom')
const colorKeys = Object.keys(colors).filter(c => colors[c] && colors[c]['600'])
const multer = require('multer')

let router = module.exports = express.Router()

const randomColor = (seed) => colors[colorKeys[Math.floor(seedrandom(seed)() * colorKeys.length)]]['600']

const getInitials = (identity) => {
  let initials
  if (identity.firstName) {
    initials = identity.firstName.slice(0, 1).toUpperCase()
    if (identity.lastName) initials += identity.lastName.slice(0, 1).toUpperCase()
  } else if (identity.name) {
    initials = identity.name.slice(0, 1).toUpperCase()
  }
  return initials
}

router.get('/:type/:id/avatar.png', asyncWrap(async (req, res, next) => {
  const storage = req.app.get('storage')
  if (!['user', 'organization'].includes(req.params.type)) return res.status(400).send('Owner type must be "user" or "organization"')
  const owner = { id: req.params.id, type: req.params.type }
  let avatar = storage.getAvatar && await storage.getAvatar(owner)
  if (!avatar || avatar.initials) {
    const identity = req.params.type === 'organization' ? (await storage.getOrganization(req.params.id)) : (await storage.getUser({ id: req.params.id }))
    if (!identity) return res.status(404).send()

    if (req.params.type === 'user' && identity.oauth) {
      const oauthWithAvatar = Object.keys(identity.oauth).find(oauth => !!identity.oauth[oauth].avatarUrl)
      if (oauthWithAvatar) return res.redirect(identity.oauth[oauthWithAvatar].avatarUrl)
    }

    const initials = getInitials(identity)

    if (!avatar) {
    // create a initials based avatar
      const color = randomColor(JSON.stringify(req.params))
      const buffer = await makeAvatar({ width: 100, height: 100, text: initials, fontSize: 40, bgColor: color })
      avatar = { initials, color, buffer, owner }
      if (storage.setAvatar) await storage.setAvatar(avatar)
    } else if (avatar.initials !== initials) {
    // this initials based avatar needs to be updated
      avatar.buffer = await makeAvatar({ width: 100, height: 100, text: initials, fontSize: 40, bgColor: avatar.color })
      await storage.setAvatar(avatar)
    }
  }

  res.set('Content-Type', 'image/png')
  res.send(avatar.buffer)
}))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (req.user.adminMode) return next()
  if (req.params.type === 'user' && req.params.id === req.user.id) return next()
  if (req.params.type === 'organization' && (req.user.organizations || []).find(o => o.id === req.params.id && o.role === 'admin')) return next()
  res.status(403).send()
}

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), asyncWrap(async (req, res, next) => {
  await req.app.get('storage').setAvatar({
    owner: { id: req.params.id, type: req.params.type },
    buffer: req.file.buffer
  })
  res.status(201).send()
}))
