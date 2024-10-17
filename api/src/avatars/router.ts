import config from '#config'
import { Router, type Request, type Response, type NextFunction } from 'express'
import { resolve } from 'node:path'
import { Account, assertAccountRole, httpError, reqSession } from '@data-fair/lib-express'
import gm from 'gm'
import colors from 'material-colors'
import initialsModule from 'initials'
import capitalize from 'capitalize'
import multer from 'multer'
import { getAvatar, setAvatar } from './service.ts'
import storages from '#storages'

const colorCodes = Object.values(colors).filter(c => (c as any)['600']).map(c => (c as any)['600']) as string[]

const router = Router()
export default Router

const randomColor = () => {
  return colorCodes[Math.floor(Math.random() * colorCodes.length)]
}

const getInitials = (name: string) => {
  return initialsModule(capitalize.words(name, true).replace('La ', 'la ').replace('Le ', 'le ').replace('De ', 'de ').replace('D\'', 'd\'').replace('L\'', 'l\'')).slice(0, 3)
}

// inspired by https://github.com/thatisuday/npm-no-avatar/blob/master/lib/make.js
// const font = path.resolve('./node_modules/no-avatar/lib/font.ttf')
const font = resolve('./server/resources/nunito-ttf/Nunito-ExtraBold.ttf')
const makeAvatar = async (text: string, color: string) => {
  return new Promise<BinaryData>((resolve, reject) => {
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
  const owner = req.params as unknown as Account
  let avatar = await getAvatar(owner)
  if (!avatar || avatar.initials) {
    let name
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
      const buffer = await makeAvatar(initials, color)
      avatar = { initials, color, buffer, owner }
      await setAvatar(avatar)
    } else if (avatar.initials !== initials) {
      // this initials based avatar needs to be updated
      avatar.buffer = await makeAvatar(initials, avatar.color ?? randomColor())
      await setAvatar(avatar)
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

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  assertAccountRole(reqSession(req), req.params as unknown as Account, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })
  return next()
}

const writeAvatar = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) throw httpError(400)
  await setAvatar({ owner: req.params as unknown as Account, buffer: req.file.buffer })
  res.status(201).send()
}

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
router.post('/:type/:id/:department/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
