import { Router, type Request, type Response, type NextFunction } from 'express'
import { resolve } from 'node:path'
import { reqUser } from '@data-fair/lib-express'
import gm from 'gm'
import colors from 'material-colors'
import seedrandom from 'seedrandom'
import initialsModule from 'initials'
import capitalize from 'capitalize'
import multer from 'multer'
import storages from '#storages'
import userName from '../utils/user-name.ts'
import defaultConfig from '../../config/default.js'

const colorKeys = Object.keys(colors).filter(c => colors[c] && colors[c]['600'])

const router = export default  Router()

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
const font = resolve('./server/resources/nunito-ttf/Nunito-ExtraBold.ttf')
const makeAvatar = async (text: string, color: string) => {
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

const readAvatar = async (req: Request, res: Response, next: NextFunction) => {
  if (!['user', 'organization'].includes(req.params.type)) {
    return res.status(400).send('Owner type must be "user" or "organization"')
  }
  let storage = storages.globalStorage

  // TODO: what happens if someone outside of the org requests an avatar ?
  // TODO: other type of org storage than ldap ?
  if (req.params.type === 'user' && reqUser(req) && reqUser(req).organization && req.params.id.startsWith('ldap_' + reqUser(req).organization.id + '_')) {
    const org = await storages.globalStorage.getOrganization(reqUser(req).organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.createStorage(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
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
}
router.get('/:type/:id/avatar.png', readAvatar)
router.get('/:type/:id/:department/avatar.png', readAvatar)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

const isAdmin = (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  if (reqUser(req).adminMode) return next()
  if (req.params.type === 'user' && req.params.id === reqUser(req).id) return next()
  if (req.params.type === 'organization' && !req.params.department && (reqUser(req).organizations || []).find(o => o.id === req.params.id && o.role === 'admin' && !o.department)) return next()
  if (req.params.type === 'organization' && req.params.department && (reqUser(req).organizations || []).find(o => o.id === req.params.id && o.role === 'admin' && (!o.department || o.department === req.params.department))) return next()
  res.status(403).send()
}

const writeAvatar = async (req, res, next) => {
  await storages.globalStorage.setAvatar({
    owner: req.params,
    buffer: req.file.buffer
  })
  res.status(201).send()
}

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
router.post('/:type/:id/:department/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
