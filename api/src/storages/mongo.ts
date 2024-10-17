import type { UserWritable, User, Organization } from '#types'
import type { SdStorage } from './interface.ts'
import userName from '../utils/user-name.ts'
import config from '#config'
import { TwoFA } from '../2fa/service.ts'
import { httpError } from '@data-fair/lib-express'
const moment = require('moment')
const escapeStringRegexp = require('escape-string-regexp')

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
  async init (params, org?: string) {
    if (org) throw new Error('mongo storage is not compatible with per-org storage')
    return this
  }

  get db () {
    if (!this._db) throw new Error('Mongo storage not initialized')
    return this._db
  }

  async getUser (userId: string) {
    const user = await this.db.collection('users').findOne({ _id: userId })
    if (!user) return
    return cleanUser(user)
  }

  async hasPassword (email) {
    const user = (await this.db.collection('users').find({ email }).collation(collation).toArray())[0]
    return !!(user && user.password)
  }

  async getUserByEmail (email, site) {
    const filter = { email }
    if (site) {
      filter.host = site.host
    } else {
      filter.host = { $exists: false }
    }
    const user = (await this.db.collection('users').find(filter).collation(collation).toArray())[0]
    if (!user) return
    return cleanUser(user)
  }

  async getPassword (userId) {
    const user = await this.db.collection('users').findOne({ _id: userId })
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

    await this.db.collection('users').findOneAndReplace({ _id: user.id }, fullUser, { upsert: true })
    return user
  }

  async patchUser (id, patch, byUser) {
    if (byUser) patch.updated = { id: byUser.id, name: byUser.name, date: new Date() }
    const unset = {}
    Object.keys(patch).forEach(key => {
      if (patch[key] === null) {
        unset[key] = ''
        delete patch[key]
      }
    })
    const operation = {}
    if (Object.keys(patch).length) operation.$set = patch
    if (Object.keys(unset).length) operation.$unset = unset
    const mongoRes = await this.db.collection('users').findOneAndUpdate(
      { _id: id },
      operation,
      { returnDocument: 'after' }
    )
    const user = cleanUser(mongoRes.value)
    // "name" was modified, also update all references in created and updated events
    if (patch.name) {
      this.db.collection('users').updateMany({ 'created.id': id }, { $set: { 'created.name': patch.name } })
      this.db.collection('users').updateMany({ 'updated.id': id }, { $set: { 'updated.name': patch.name } })
      this.db.collection('organizations').updateMany({ 'created.id': id }, { $set: { 'created.name': patch.name } })
      this.db.collection('organizations').updateMany({ 'updated.id': id }, { $set: { 'updated.name': patch.name } })
    }
    return user
  }

  async updateLogged (id) {
    this.db.collection('users').updateOne({ _id: id }, { $set: { logged: new Date() } })
  }

  async confirmEmail (id) {
    this.db.collection('users').updateOne({ _id: id }, { $set: { emailConfirmed: true } })
  }

  async deleteUser (userId) {
    await this.db.collection('users').deleteOne({ _id: userId })
    await this.db.collection('oauth-tokens').deleteMany({ 'user.id': userId })
  }

  async findUsers (params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.$or = [
        { name: { $regex: escapeStringRegexp(params.q), $options: 'i' } },
        { email: { $regex: escapeStringRegexp(params.q), $options: 'i' } }
      ]
    }

    const countPromise = this.db.collection('users').countDocuments(filter)
    const users = await this.db.collection('users')
      .find(filter)
      .project(prepareSelect(params.select))
      .sort(params.sort)
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return { count, results: users.map(cleanUser) }
  }

  async findUsersToDelete () {
    return (await this.db.collection('users')
      .find({ plannedDeletion: { $lt: moment().format('YYYY-MM-DD') } })
      .limit(10000)
      .toArray()).map(cleanUser)
  }

  async findInactiveUsers () {
    const inactiveDelayDate = moment().subtract(config.cleanup.deleteInactiveDelay[0], config.cleanup.deleteInactiveDelay[1]).toDate()
    return (await this.db.collection('users')
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

  async findMembers (organizationId, params = {}) {
    const filter = { organizations: { $elemMatch: { id: organizationId } } }
    if (params.ids && params.ids.length) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.$or = [
        { name: { $regex: escapeStringRegexp(params.q), $options: 'i' } },
        { email: { $regex: escapeStringRegexp(params.q), $options: 'i' } }
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
    const countPromise = this.db.collection('users').countDocuments(filter)
    const users = params.size === 0
      ? []
      : (await this.db.collection('users')
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
        const member = {
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
        if (userOrga.createdAt) member.createdAt = userOrga.createdAt
        if (userOrga.readOnly) member.readOnly = userOrga.readOnly
        results.push(member)
      }
    }
    return { count, results }
  }

  async getOrganization (id) {
    const organization = await this.db.collection('organizations').findOne({ _id: id })
    if (!organization) return null
    return cleanOrganization(organization)
  }

  async createOrganization (orga, user) {
    const clonedOrga = cloneWithId(orga)
    const date = new Date()
    clonedOrga.created = { id: user.id, name: user.name, date }
    clonedOrga.updated = { id: user.id, name: user.name, date }
    await this.db.collection('organizations').insertOne(clonedOrga)
    return orga
  }

  async patchOrganization (id, patch, user) {
    patch.updated = { id: user.id, name: user.name, date: new Date() }
    const mongoRes = await this.db.collection('organizations').findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnDocument: 'after' }
    )
    const orga = cleanOrganization(mongoRes.value)
    // also update all organizations references in users
    if (patch.name || patch.departments) {
      for await (const user of this.db.collection('users').find({ organizations: { $elemMatch: { id } } })) {
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
        await this.db.collection('users').updateOne({ _id: user._id }, { $set: { organizations: user.organizations } })
      }
    }
    return orga
  }

  async deleteOrganization (organizationId) {
    await this.db.collection('users')
      .updateMany({}, { $pull: { organizations: { id: organizationId } } })
    await this.db.collection('organizations').deleteOne({ _id: organizationId })
  }

  async findOrganizations (params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: escapeStringRegexp(params.q), $options: 'i' }
    }
    if (params.creator) {
      filter['created.id'] = params.creator
    }

    const countPromise = this.db.collection('organizations').countDocuments(filter)
    const organizations = await this.db.collection('organizations')
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
    await this.db.collection('users').updateOne(
      { _id: user.id },
      { $set: { organizations: user.organizations } }
    )
  }

  async countMembers (organizationId) {
    return this.db.collection('users').countDocuments({ 'organizations.id': organizationId })
  }

  async patchMember (organizationId, userId, department = null, patch) {
    // department is the optional department of the membership we are trying to change
    // patch.department is the optional new department of the membership

    const org = await this.db.collection('organizations').findOne({ _id: organizationId })
    if (!org) throw httpError(404, 'organisation inconnue.')
    let patchDepartmentObject
    if (patch.department) {
      patchDepartmentObject = org.departments.find(d => d.id === patch.department)
      if (!patchDepartmentObject) throw httpError(404, 'département inconnu.')
    }
    const user = await this.db.collection('users').findOne({ _id: userId })
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

    await this.db.collection('users').updateOne(
      { _id: userId },
      { $set: { organizations: user.organizations } }
    )
  }

  async removeMember (organizationId, userId, department = null) {
    await this.db.collection('users')
      .updateOne({ _id: userId }, { $pull: { organizations: { id: organizationId, department } } })
  }

  async required2FA (user) {
    if (user.isAdmin && config.admins2FA) return true
    for (const org of user.organizations) {
      if (await this.db.collection('organizations').findOne({ _id: org.id, '2FA.roles': org.role })) {
        return true
      }
    }
    return false
  }

  async get2FA (userId: string) {
    const user = await this.db.collection('users').findOne({ _id: userId })
    return user && user['2FA']
  }

  async set2FA (userId: string, twoFA: TwoFA) {
    await this.db.collection('users').updateOne({ _id: userId }, { $set: { '2FA': twoFA } })
  }

  async addPartner (orgId, partner) {
    await this.db.collection('organizations').updateOne({ _id: orgId }, {
      $pull: { partners: { contactEmail: partner.contactEmail, id: { $exists: false } } }
    })
    await this.db.collection('organizations').updateOne({ _id: orgId }, {
      $push: { partners: partner }
    })
  }

  async deletePartner (orgId, partnerId) {
    await this.db.collection('organizations').updateOne({ _id: orgId }, { $pull: { partners: { partnerId } } })
  }

  async validatePartner (orgId, partnerId, partner) {
    await this.db.collection('organizations').updateOne(
      { _id: orgId, 'partners.partnerId': partnerId },
      { $set: { 'partners.$.name': partner.name, 'partners.$.id': partner.id } }
    )
  }

  /**
   *
   * @param {import('@data-fair/lib/shared/session.js').User} user
   * @param {any} provider
   * @param {any} token
   * @param {boolean} offlineRefreshToken
   * @param {Date} loggedOut
   */
  async writeOAuthToken (user, provider, token, offlineRefreshToken, loggedOut) {
    const tokenInfo = {
      user: { id: user.id, email: user.email, name: user.name },
      provider: { id: provider.id, type: provider.type, title: provider.title },
      token
    }
    if (offlineRefreshToken) tokenInfo.offlineRefreshToken = true
    if (loggedOut) tokenInfo.loggedOut = loggedOut
    await this.db.collection('oauth-tokens')
      .replaceOne({ 'user.id': user.id, 'provider.id': provider.id }, tokenInfo, { upsert: true })
  }

  /**
   *
   * @param {any} user
   * @param {any} provider
   * @returns {Promise<any | null>}
   */
  async readOAuthToken (user, provider) {
    return this.db.collection('oauth-tokens').findOne({ 'user.id': user.id, 'provider.id': provider.id })
  }

  /**
   *
   * @param {any} user
   * @param {any} provider
   * @returns {Promise<null>}
   */
  async deleteOAuthToken (user, provider) {
    await this.db.collection('oauth-tokens').deleteOne({ 'user.id': user.id, 'provider.id': provider.id })
  }

  /**
   * @returns {Promise<{count: number, results: any[]}>}
   */
  async readOAuthTokens () {
    const tokens = await this.db.collection('oauth-tokens').find().limit(10000).project({
      user: 1,
      'token.expires_at': 1,
      'token.session_state': 1,
      offlineRefreshToken: 1,
      provider: 1,
      loggedOut: 1
    }).toArray()
    return {
      count: tokens.length,
      results: tokens
    }
  }

  async findOfflineOAuthTokens () {
    const tokens = await this.db.collection('oauth-tokens').find({ offlineRefreshToken: true }).limit(10000).toArray()
    return tokens
  }

  async logoutOAuthToken (sid) {
    await this.db.collection('oauth-tokens').updateOne({ 'token.session_state': sid }, { $set: { loggedOut: new Date() } })
  }
}

export const init = async (params, org) => new MongodbStorage().init(params, org)
export const readonly = config.storage.mongo.readonly
