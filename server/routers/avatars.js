const path = require('path')
const express = require('express')
const gm = require('gm')
const colors = require('material-colors')
const seedrandom = require('seedrandom')
const colorKeys = Object.keys(colors).filter(c => colors[c] && colors[c]['600'])
const initialsModule = require('initials')
const capitalize = require('capitalize')
const multer = require('multer')
const asyncWrap = require('../utils/async-wrap')
const storages = require('../storages')
const userName = require('../utils/user-name')
const defaultConfig = require('../../config/default.js')

const router = module.exports = express.Router()

const randomColor = (seed) => colors[colorKeys[Math.floor(seedrandom(seed)() * colorKeys.length)]]['600']

const getInitials = (type, identity) => {
  let name
  if (type === 'user') {
    name = userName(identity, true)
  } else {
    name = identity.name
  }
  return initialsModule(capitalize.words(name, true).replace('La ', 'la ').replace('Le ', 'le ').replace('De ', 'de ').replace('D\'', 'd\'').replace('L\'', 'l\'')).slice(0, 3)
}

// inspired by https://github.com/thatisuday/npm-no-avatar/blob/master/lib/make.js
// const font = path.resolve('./node_modules/no-avatar/lib/font.ttf')
const font = path.resolve('./server/resources/nunito-ttf/Nunito-ExtraBold.ttf')
const makeAvatar = async (text, color) => {
  return new Promise((resolve, reject) => {
    gm(100, 100, color)
      .fill('#FFFFFF')
      .font(font)
      .drawText(0, 0, text, 'Center')
      .fontSize(text.length === 3 ? 37 : 47)
      .toBuffer('PNG', function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer)
      })
  })
}

const readAvatar = asyncWrap(async (req, res, next) => {
  if (!['user', 'organization'].includes(req.params.type)) {
    return res.status(400).send('Owner type must be "user" or "organization"')
  }
  let storage = req.app.get('storage')

  // TODO: what happens if someone outside of the org requests an avatar ?
  // TODO: other type of org storage than ldap ?
  if (req.params.type === 'user' && req.user && req.user.organization && req.params.id.startsWith('ldap_' + req.user.organization.id + '_')) {
    const org = await req.app.get('storage').getOrganization(req.user.organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }

  const owner = req.params
  let avatar = storage.getAvatar && await storage.getAvatar(owner)
  if (!avatar || avatar.initials) {
    let identity = req.params.type === 'organization' ? (await storage.getOrganization(req.params.id)) : (await storage.getUser({ id: req.params.id }))
    if (req.params.department) identity = identity.departments.find(d => d.id === req.params.department)
    if (!identity && req.params.type === 'user' && req.params.id === '_superadmin') identity = { firstName: 'Super', lastName: 'Admin' }
    if (!identity) return res.status(404).send()

    if (req.params.type === 'user' && identity.oauth) {
      const oauthWithAvatar = Object.keys(identity.oauth).find(oauth => !!identity.oauth[oauth].avatarUrl)
      if (oauthWithAvatar) return res.redirect(identity.oauth[oauthWithAvatar].avatarUrl)
    }
    if (req.params.type === 'user' && identity.oidc) {
      const oidcWithAvatar = Object.keys(identity.oidc).find(oauth => !!identity.oidc[oauth].avatarUrl)
      if (oidcWithAvatar) return res.redirect(identity.oidc[oidcWithAvatar].avatarUrl)
    }

    const initials = getInitials(req.params.type, identity)

    if (!avatar) {
      // create a initials based avatar
      const color = randomColor(JSON.stringify(req.params))
      const buffer = await makeAvatar(initials, color)
      avatar = { initials, color, buffer, owner }
      if (storage.setAvatar) await storage.setAvatar(avatar)
    } else if (avatar.initials !== initials) {
      // this initials based avatar needs to be updated
      avatar.buffer = await makeAvatar(initials, avatar.color)
      await storage.setAvatar(avatar)
    }
  }

  res.set('Content-Type', 'image/png')
  res.send(avatar.buffer)
})
router.get('/:type/:id/avatar.png', readAvatar)
router.get('/:type/:id/:department/avatar.png', readAvatar)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (req.user.adminMode) return next()
  if (req.params.type === 'user' && req.params.id === req.user.id) return next()
  if (req.params.type === 'organization' && !req.params.department && (req.user.organizations || []).find(o => o.id === req.params.id && o.role === 'admin' && !o.department)) return next()
  if (req.params.type === 'organization' && req.params.department && (req.user.organizations || []).find(o => o.id === req.params.id && o.role === 'admin' && (!o.department || o.department === req.params.department))) return next()
  res.status(403).send()
}

const writeAvatar = asyncWrap(async (req, res, next) => {
  await req.app.get('storage').setAvatar({
    owner: req.params,
    buffer: req.file.buffer
  })
  res.status(201).send()
})

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
router.post('/:type/:id/:department/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
