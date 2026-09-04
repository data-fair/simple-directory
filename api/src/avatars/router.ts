import config from '#config'
import { Router, type RequestHandler } from 'express'
import { resolve } from 'node:path'
import { type Account, assertAccountRole, getAccountRole, httpError, reqSession } from '@data-fair/lib-express'
import gm from 'gm'
import colors from 'material-colors'
import initialsModule from 'initials'
import capitalize from 'capitalize'
import multer from 'multer'
import { getAvatar, setAvatar } from './service.ts'
import storages from '#storages'
import { crossOriginResourcePolicy } from 'helmet'

const colorCodes = Object.values(colors).filter(c => (c as any)['600']).map(c => (c as any)['600']) as string[]

const router = Router()
export default router

const randomColor = () => {
  return colorCodes[Math.floor(Math.random() * colorCodes.length)]
}

const getInitials = (name: string) => {
  return initialsModule(capitalize.words(name, true).replace('La ', 'la ').replace('Le ', 'le ').replace('De ', 'de ').replace('D\'', 'd\'').replace('L\'', 'l\'')).slice(0, 3)
}

// inspired by https://github.com/thatisuday/npm-no-avatar/blob/master/lib/make.js
// const font = path.resolve('./node_modules/no-avatar/lib/font.ttf')
const font = resolve(import.meta.dirname, '../../resources/nunito-ttf/Nunito-ExtraBold.ttf')
// white mdiRobot glyph (same as the UI's NHI icon), composited as a bottom-right badge
const robotBadge = resolve(import.meta.dirname, '../../resources/robot.png')
const makeAvatar = async (text: string, color: string, robot?: boolean) => {
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    gm(100, 100, color)
      .fill('#FFFFFF')
      .font(font)
      // initials shift up on robot avatars to leave room for the badge below them
      .drawText(0, robot ? -10 : 0, text, 'Center')
      .fontSize(text.length === 3 ? 37 : 47)
      .toBuffer('PNG', function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer)
      })
  })
  if (!robot) return buffer as BinaryData
  // bottom-center placement: avatars are displayed round-cropped, and the bottom of the
  // inscribed circle is where a 36px badge fits whole (a corner would be mostly cut off)
  return new Promise<BinaryData>((resolve, reject) => {
    gm(buffer).composite(robotBadge).geometry('+32+58')
      .toBuffer('PNG', function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer)
      })
  })
}

const readAvatar: RequestHandler = async (req, res, next) => {
  if (!['user', 'organization'].includes(req.params.type)) {
    return res.status(400).send('Owner type must be "user" or "organization"')
  }
  const owner = req.params as unknown as Account
  let avatar = await getAvatar(owner)
  if (!avatar || avatar.initials) {
    let name
    let robot = false
    if (req.params.type === 'organization') {
      const org = await storages.globalStorage.getOrganization(req.params.id)
      if (!org) throw httpError(404)
      name = org.name
      if (req.params.department) {
        const dep = org.departments?.find(d => d.id === req.params.department)
        if (!dep) throw httpError(404)
        name = dep.name
      }
    } else {
      if (req.params.id === '_superadmin') {
        name = 'Super Admin'
      } else {
        const user = await storages.globalStorage.getUser(req.params.id)
        if (!user) throw httpError(404)
        name = user.name
        robot = !!user.nhi
        if (user.oauth) {
          const oauthWithAvatar = Object.values(user.oauth).find(oauth => !!(oauth as any).avatarUrl)
          if (oauthWithAvatar) return res.redirect((oauthWithAvatar as any).avatarUrl)
        }
        if (user.oidc) {
          const oidcWithAvatar = Object.values(user.oidc).find(oauth => !!(oauth as any).avatarUrl)
          if (oidcWithAvatar) return res.redirect((oidcWithAvatar as any).avatarUrl)
        }
      }
    }

    const initials = getInitials(name)

    if (!avatar) {
      // create a initials based avatar
      const color = randomColor()
      const buffer = await makeAvatar(initials, color, robot)
      avatar = { initials, color, buffer, owner, robot }
      await setAvatar(avatar)
    } else if (avatar.initials !== initials || !!avatar.robot !== robot) {
      // this initials based avatar needs to be updated (the robot check also migrates
      // NHI avatars cached before the badge existed)
      avatar.initials = initials
      avatar.robot = robot
      avatar.buffer = await makeAvatar(initials, avatar.color ?? randomColor(), robot)
      await setAvatar(avatar)
    }
  }

  res.set('Content-Type', 'image/png')
  res.send(avatar.buffer)
}

// enable CORS specifically for get avatar as it is used in some SD users browser extension
router.get('/:type/:id/avatar.png', crossOriginResourcePolicy({ policy: 'cross-origin' }), readAvatar)
router.get('/:type/:id/:department/avatar.png', crossOriginResourcePolicy({ policy: 'cross-origin' }), readAvatar)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    assertAccountRole(reqSession(req), req.params as unknown as Account, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })
  } catch (err) {
    // an NHI's avatar is managed by the admins of its single organization, like the rest of
    // the NHI record (cf api/src/nhis/router.ts) — the extension is strictly NHI-only, a
    // human member's avatar stays their own
    const user = req.params.type === 'user' && await storages.globalStorage.getUser(req.params.id)
    const orgId = user && user.nhi && user.organizations.length === 1 && user.organizations[0].id
    if (!orgId || getAccountRole(reqSession(req), { type: 'organization', id: orgId }, { acceptDepAsRoot: config.depAdminIsOrgAdmin }) !== 'admin') {
      throw err
    }
  }
  return next()
}

const writeAvatar: RequestHandler = async (req, res, next) => {
  if (!req.file) throw httpError(400)
  await setAvatar({ owner: req.params as unknown as Account, buffer: req.file.buffer })
  res.status(201).send()
}

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
router.post('/:type/:id/:department/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
