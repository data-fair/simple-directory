import type { UserWritable, User, Organization, Member, Partner, SitePublic } from '#types'
import type { SdStorage, FindMembersParams, FindOrganizationsParams, FindUsersParams } from './interface.ts'
import { PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'
import userName from '../utils/user-name.ts'
import config from '#config'
import { TwoFA } from '../2fa/service.ts'
import { httpError, type UserRef } from '@data-fair/lib-express'
import { escapeRegExp } from '@data-fair/lib-utils/micro-template.js'
import mongo from '#mongo'

const collation = { locale: 'en', strength: 1 }

export type UserInDb = Omit<User, 'id'> & { _id: string }
export type OrgInDb = Omit<Organization, 'id'> & { _id: string }

function cleanUser (resource) {
  resource.id = resource._id
  delete resource._id
  delete resource.password
  if (resource['2FA']) {
    delete resource['2FA'].secret
    delete resource['2FA'].recovery
  }
  return resource
}

function cleanOrganization (resource) {
  resource.id = resource._id
  delete resource._id
  return resource
}

function cloneWithId <T extends { id: string }> (resource: T): Omit<T, 'id'> & { _id: string } {
  return { ...resource, _id: resource.id, id: undefined }
}

function prepareSelect (select) {
  if (!select) return {}
  return select.reduce((a, key) => { a[key] = true; return a }, {})
}

class MongodbStorage implements SdStorage {
  async init (params: any, org?: Organization) {
    if (org) throw new Error('mongo storage is not compatible with per-org storage')
    return this
  }

  async getUser (userId: string) {
    const user = await mongo.users.findOne({ _id: userId })
    if (!user) return
    return cleanUser(user)
  }

  async getUserByEmail (email, site) {
    const filter = { email }
    if (site) {
      filter.host = site.host
    } else {
      filter.host = { $exists: false }
    }
    const user = (await mongo.users.find(filter).collation(collation).toArray())[0]
    if (!user) return
    return cleanUser(user)
  }

  async getPassword (userId) {
    const user = await mongo.users.findOne({ _id: userId })
    return user && user.password
  }

  async createUser (user: UserWritable, byUser: { id: string, name: string }, host: string) {
    byUser = byUser || user
    const date = new Date().toISOString()
    const fullUser: UserInDb = {
      ...cloneWithId(user),
      organizations: user.organizations ?? [],
      created: { id: byUser.id, name: byUser.name, date },
      updated: { id: byUser.id, name: byUser.name, date },
      name: userName(user),
      host: host || new URL(config.publicUrl).host
    }

    await mongo.users.findOneAndReplace({ _id: user.id }, fullUser, { upsert: true })
    return user
  }

  async patchUser (id: string, patch: Partial<User>, byUser?: { id: string, name: string }) {
    if (byUser) patch.updated = { id: byUser.id, name: byUser.name, date: new Date().toISOString() }
    const unset: Record<string, string> = {}
    const set: any = {}
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null) {
        unset[key] = ''
      } else {
        set[key] = value
      }
    })
    const operation = {}
    if (Object.keys(set).length) operation.$set = set
    if (Object.keys(unset).length) operation.$unset = unset
    const mongoRes = await mongo.users.findOneAndUpdate(
      { _id: id },
      operation,
      { returnDocument: 'after' }
    )
    const user = cleanUser(mongoRes.value)
    return user
  }

  async updateLogged (id: string) {
    mongo.users.updateOne({ _id: id }, { $set: { logged: new Date() } })
  }

  async confirmEmail (id: string) {
    mongo.users.updateOne({ _id: id }, { $set: { emailConfirmed: true } })
  }

  async deleteUser (userId: string) {
    await mongo.users.deleteOne({ _id: userId })
    await mongo.oauthTokens.deleteMany({ 'user.id': userId })
  }

  async findUsers (params: FindUsersParams = {}) {
    const filter: any = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.$or = [
        { name: { $regex: escapeRegExp(params.q), $options: 'i' } },
        { email: { $regex: escapeRegExp(params.q), $options: 'i' } }
      ]
    }

    const countPromise = mongo.users.countDocuments(filter)
    const users = await mongo.users
      .find(filter)
      .project(prepareSelect(params.select))
      .sort(params.sort)
      .skip(params.skip ?? 0)
      .limit(params.size ?? 10)
      .toArray()
    const count = await countPromise
    return { count, results: users.map(cleanUser) }
  }

  async findUsersToDelete () {
    return (await mongo.users
      .find({ plannedDeletion: { $lt: moment().format('YYYY-MM-DD') } })
      .limit(10000)
      .toArray()).map(cleanUser)
  }

  async findInactiveUsers () {
    const inactiveDelayDate = moment().subtract(config.cleanup.deleteInactiveDelay[0], config.cleanup.deleteInactiveDelay[1]).toDate()
    return (await mongo.users
      .find({
        plannedDeletion: { $exists: false },
        $or: [
          { logged: { $lt: inactiveDelayDate } },
          { logged: { $exists: false }, 'created.date': { $lt: inactiveDelayDate } }
        ]
      })
      .limit(10000)
      .toArray()).map(cleanUser)
  }

  async findMembers (organizationId: string, params: FindMembersParams = {}) {
    const filter: any = { organizations: { $elemMatch: { id: organizationId } } }
    if (params.ids && params.ids.length) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.$or = [
        { name: { $regex: escapeRegExp(params.q), $options: 'i' } },
        { email: { $regex: escapeRegExp(params.q), $options: 'i' } }
      ]
    }
    if (params.roles && params.roles.length) {
      filter.organizations.$elemMatch.role = { $in: params.roles }
    }
    if (params.departments && params.departments.length) {
      const depOr = []
      for (const dep of params.departments) {
        if (dep === '-') depOr.push({ department: { $exists: false } })
        else depOr.push({ department: dep })
      }
      filter.organizations.$elemMatch.$or = depOr
    }
    if ('emailConfirmed' in params) {
      filter.emailConfirmed = params.emailConfirmed
    }
    const countPromise = mongo.users.countDocuments(filter)
    const users = params.size === 0
      ? []
      : (await mongo.users
          .find(filter)
          .sort(params.sort)
          .skip(params.skip || 0)
          .limit(params.size || 12)
          .toArray())
    const count = await countPromise
    const results = []
    for (const user of users) {
      for (const userOrga of user.organizations) {
        if (userOrga.id !== organizationId) continue
        if (params.departments && params.departments.length) {
          if (!params.departments.includes(userOrga.department || '-')) continue
        }
        const member: Member = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userOrga.role,
          department: userOrga.department,
          departmentName: userOrga.departmentName,
          emailConfirmed: user.emailConfirmed
        }
        if (user.host) member.host = user.host
        if (user.plannedDeletion) member.plannedDeletion = user.plannedDeletion
        // if (userOrga.createdAt) member.createdAt = userOrga.createdAt
        // if (userOrga.readOnly) member.readOnly = userOrga.readOnly
        results.push(member)
      }
    }
    return { count, results }
  }

  async getOrganization (id) {
    const organization = await mongo.organizations.findOne({ _id: id })
    if (!organization) return null
    return cleanOrganization(organization)
  }

  async createOrganization (orga, user) {
    const clonedOrga = cloneWithId(orga)
    const date = new Date()
    clonedOrga.created = { id: user.id, name: user.name, date }
    clonedOrga.updated = { id: user.id, name: user.name, date }
    await mongo.organizations.insertOne(clonedOrga)
    return orga
  }

  async patchOrganization (id: string, patch: Partial<Organization>, user: UserRef) {
    patch.updated = { id: user.id, name: user.name, date: new Date().toISOString() }
    const mongoRes = await mongo.organizations.findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnDocument: 'after' }
    )
    const orga = cleanOrganization(mongoRes.value)
    // also update all organizations references in users
    if (patch.name || patch.departments) {
      for await (const user of mongo.users.find({ organizations: { $elemMatch: { id } } })) {
        for (const org of user.organizations) {
          if (org.id !== id) continue
          if (patch.name) org.name = patch.name
          if (org.department && patch.departments) {
            const department = patch.departments.find(d => d.id === org.department)
            // TODO: if !department means that the department was deleted.
            // What to do in this case, remove the membershp entirely ?
            if (department) org.departmentName = department.name
          }
        }
        await mongo.users.updateOne({ _id: user._id }, { $set: { organizations: user.organizations } })
      }
    }
    return orga
  }

  async deleteOrganization (organizationId: string) {
    await mongo.users
      .updateMany({}, { $pull: { organizations: { id: organizationId } } })
    await mongo.organizations.deleteOne({ _id: organizationId })
  }

  async findOrganizations (params: FindOrganizationsParams = {}) {
    const filter: any = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: escapeRegExp(params.q), $options: 'i' }
    }
    if (params.creator) {
      filter['created.id'] = params.creator
    }

    const countPromise = mongo.organizations.countDocuments(filter)
    const organizations = await mongo.organizations
      .find(filter)
      .sort(params.sort)
      .project(prepareSelect(params.select))
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return { count, results: organizations.map(cleanOrganization) }
  }

  async addMember (orga: Organization, user: User, role: string, department: string | null = null, readOnly = false) {
    user.organizations = user.organizations || []

    let userOrga = user.organizations.find(o => o.id === orga.id && (o.department || null) === department)

    if (config.singleMembership && !userOrga && user.organizations.find(o => o.id === orga.id)) {
      throw httpError(400, 'cet utilisateur est déjà membre de cette organisation.')
    }

    if (!userOrga) {
      if (department && user.organizations.find(o => o.id === orga.id && !o.department)) {
        throw httpError(400, 'cet utilisateur est membre de l\'organisation parente, il ne peut pas être ajouté dans un département.')
      }
      if (!department && user.organizations.find(o => o.id === orga.id && o.department)) {
        throw httpError(400, 'cet utilisateur est membre d\'un département, il ne peut pas être ajouté dans l\'organisation parente.')
      }
      userOrga = {
        id: orga.id,
        name: orga.name,
        createdAt: new Date().toISOString()
      }
      if (department) {
        const fullDepartment = orga.departments.find(d => d.id === department)
        if (!fullDepartment) throw httpError(404, 'department not found')
        userOrga.department = department
        userOrga.departmentName = fullDepartment.name
      }
      user.organizations.push(userOrga)
    }
    userOrga.role = role
    if (readOnly) userOrga.readOnly = readOnly
    await mongo.users.updateOne(
      { _id: user.id },
      { $set: { organizations: user.organizations } }
    )
  }

  async countMembers (organizationId) {
    return mongo.users.countDocuments({ 'organizations.id': organizationId })
  }

  async patchMember (organizationId: string, userId: string, department = null, patch: PatchMemberBody) {
    // department is the optional department of the membership we are trying to change
    // patch.department is the optional new department of the membership

    const org = await mongo.organizations.findOne({ _id: organizationId })
    if (!org) throw httpError(404, 'organisation inconnue.')
    let patchDepartmentObject
    if (patch.department) {
      patchDepartmentObject = org.departments.find(d => d.id === patch.department)
      if (!patchDepartmentObject) throw httpError(404, 'département inconnu.')
    }
    const user = await mongo.users.findOne({ _id: userId })
    if (!user) throw httpError(404, 'utilisateur inconnu.')
    const userOrg = user.organizations.find(o => o.id === organizationId && (o.department || null) === (department || null))
    if (!userOrg) throw httpError(404, 'information de membre inconnue.')

    // if we are switching department remove potential conflict
    if ((patch.department || null) !== (department || null)) {
      user.organizations = user.organizations.filter(o => {
        const isConflict = o.id === organizationId && (o.department || null) === (patch.department || null)
        return !isConflict
      })
    }

    // apply patch
    userOrg.role = patch.role
    if (patchDepartmentObject) {
      userOrg.department = patchDepartmentObject.id
      userOrg.departmentName = patchDepartmentObject.name
    } else {
      delete userOrg.department
      delete userOrg.departmentName
    }

    if (patch.department && user.organizations.find(o => o.id === organizationId && !o.department)) {
      throw httpError(400, 'cet utilisateur est membre de l\'organisation parente, il ne peut pas être ajouté dans un département.')
    }
    if (!patch.department && user.organizations.find(o => o.id === organizationId && o.department)) {
      throw httpError(400, 'cet utilisateur est membre d\'un département, il ne peut pas être ajouté dans l\'organisation parente.')
    }

    await mongo.users.updateOne(
      { _id: userId },
      { $set: { organizations: user.organizations } }
    )
  }

  async removeMember (organizationId: string, userId: string, department?: string) {
    await mongo.users
      .updateOne({ _id: userId }, { $pull: { organizations: { id: organizationId, department } } })
  }

  async required2FA (user) {
    if (user.isAdmin && config.admins2FA) return true
    for (const org of user.organizations) {
      if (await mongo.organizations.findOne({ _id: org.id, '2FA.roles': org.role })) {
        return true
      }
    }
    return false
  }

  async get2FA (userId: string) {
    const user = await mongo.users.findOne({ _id: userId })
    return user && user['2FA']
  }

  async set2FA (userId: string, twoFA: TwoFA) {
    await mongo.users.updateOne({ _id: userId }, { $set: { '2FA': twoFA } })
  }

  async addPartner (orgId: string, partner: Partner) {
    await mongo.organizations.updateOne({ _id: orgId }, {
      $pull: { partners: { contactEmail: partner.contactEmail, id: { $exists: false } } }
    })
    await mongo.organizations.updateOne({ _id: orgId }, {
      $push: { partners: partner }
    })
  }

  async deletePartner (orgId: string, partnerId: string) {
    await mongo.organizations.updateOne({ _id: orgId }, { $pull: { partners: { partnerId } } })
  }

  async validatePartner (orgId: string, partnerId: string, partner: Organization) {
    await mongo.organizations.updateOne(
      { _id: orgId, 'partners.partnerId': partnerId },
      { $set: { 'partners.$.name': partner.name, 'partners.$.id': partner.id } }
    )
  }
}

export const init = async (params, org) => new MongodbStorage().init(params, org)
export const readonly = config.storage.mongo.readonly
