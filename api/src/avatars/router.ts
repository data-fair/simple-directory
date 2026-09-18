import config from '#config'
import { Router, type Request, type RequestHandler, type Response } from 'express'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { type Account, assertAccountRole, getAccountRole, httpError, reqSession } from '@data-fair/lib-express'
import colors from 'material-colors'
import initialsModule from 'initials'
import capitalize from 'capitalize'
import multer from 'multer'
import { getAvatar, setAvatar, deleteCustomAvatar } from './service.ts'
import { makeAvatar } from './render.ts'
import storages from '#storages'
import { crossOriginResourcePolicy } from 'helmet'

const colorCodes = Object.values(colors).filter(c => (c as any)['600']).map(c => (c as any)['600']) as string[]

const router = Router()
export default router

// mounted both on /:type/:id/avatar.png and on /:type/:id/:department/avatar.png,
// so department is only present on the latter
type AvatarParams = { type: string, id: string, department?: string }

const randomColor = () => {
  return colorCodes[Math.floor(Math.random() * colorCodes.length)]
}

const getInitials = (name: string) => {
  return initialsModule(capitalize.words(name, true).replace('La ', 'la ').replace('Le ', 'le ').replace('De ', 'de ').replace('D\'', 'd\'').replace('L\'', 'l\'')).slice(0, 3)
}

const readResource = (name: string) => readFileSync(resolve(import.meta.dirname, `../../resources/${name}`))
// grey placeholders (mdiAccount / mdiAccountGroup / mdiFamilyTree, see dev/make-unknown-avatars.ts)
// served with a 404 when the owner does not exist any more: an <img> keeps rendering something
// where the name of a deleted account is still displayed, and an API client still sees the 404
const unknownAvatars = {
  user: readResource('unknown-user.png'),
  organization: readResource('unknown-organization.png'),
  department: readResource('unknown-department.png')
}
const sendUnknown = (req: Request<AvatarParams>, res: Response) => {
  const kind = req.params.type === 'user' ? 'user' : (req.params.department ? 'department' : 'organization')
  res.status(404).set('Content-Type', 'image/png').send(unknownAvatars[kind])
}

const readAvatar: RequestHandler<AvatarParams> = async (req, res, next) => {
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
      if (!org) return sendUnknown(req, res)
      name = org.name
      if (req.params.department) {
        const dep = org.departments?.find(d => d.id === req.params.department)
        if (!dep) return sendUnknown(req, res)
        name = dep.name
      }
    } else {
      if (req.params.id === '_superadmin') {
        name = 'Super Admin'
      } else {
        const user = await storages.globalStorage.getUser(req.params.id)
        if (!user) return sendUnknown(req, res)
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
  res.set('x-avatar-custom', avatar.initials ? 'false' : 'true')
  res.set('Access-Control-Expose-Headers', 'x-avatar-custom')
  res.send(avatar.buffer)
}

// enable CORS specifically for get avatar as it is used in some SD users browser extension
router.get('/:type/:id/avatar.png', crossOriginResourcePolicy({ policy: 'cross-origin' }), readAvatar)
router.get('/:type/:id/:department/avatar.png', crossOriginResourcePolicy({ policy: 'cross-origin' }), readAvatar)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

const isAdmin: RequestHandler<AvatarParams> = async (req, res, next) => {
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

const writeAvatar: RequestHandler<AvatarParams> = async (req, res, next) => {
  if (!req.file) throw httpError(400)
  await setAvatar({ owner: req.params as unknown as Account, buffer: req.file.buffer })
  res.status(201).send()
}

router.post('/:type/:id/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)
router.post('/:type/:id/:department/avatar.png', isAdmin, upload.single('avatar'), writeAvatar)

const deleteAvatar: RequestHandler<AvatarParams> = async (req, res, next) => {
  if (!['user', 'organization'].includes(req.params.type)) {
    return res.status(400).send('Owner type must be "user" or "organization"')
  }
  await deleteCustomAvatar(req.params as unknown as Account)
  res.status(204).send()
}

router.delete('/:type/:id/avatar.png', isAdmin, deleteAvatar)
router.delete('/:type/:id/:department/avatar.png', isAdmin, deleteAvatar)
