const config = require('config')
const moment = require('moment')
const escapeStringRegexp = require('escape-string-regexp')
const mongoUtils = require('../utils/mongo')

const collation = { locale: 'en', strength: 1 }

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

function cloneWithId (resource) {
  const resourceClone = { ...resource, _id: resource.id }
  delete resourceClone.id
  return resourceClone
}

function prepareSelect (select) {
  if (!select) return {}
  return select.reduce((a, key) => { a[key] = true; return a }, {})
}

class MongodbStorage {
  async init (params, org) {
    if (this.org) throw new Error('mongo storage is not compatible with per-org storage')
    console.log('Connecting to mongodb ' + params.url)
    const MongoClient = require('mongodb').MongoClient
    try {
      this.client = await MongoClient.connect(params.url)
    } catch (err) {
      // 1 retry after 1s
      // solve the quite common case in docker-compose of the service starting at the same time as the db
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.client = await MongoClient.connect(params.url)
    }

    this.db = this.client.db()
    // An index for comparison case and diacritics insensitive
    await mongoUtils.ensureIndex(this.db, 'users', { email: 1 }, { unique: true, collation })
    await mongoUtils.ensureIndex(this.db, 'users', { logged: 1 }, { sparse: true }) // for metrics
    await mongoUtils.ensureIndex(this.db, 'users', { plannedDeletion: 1 }, { sparse: true })
    await mongoUtils.ensureIndex(this.db, 'users', { 'organizations.id': 1 }, { sparse: true })
    await mongoUtils.ensureIndex(this.db, 'avatars', { 'owner.type': 1, 'owner.id': 1, 'owner.department': 1 }, { unique: true, name: 'owner.type_1_owner.id_1' })
    await mongoUtils.ensureIndex(this.db, 'limits', { id: 'text', name: 'text' }, { name: 'fulltext' })
    await mongoUtils.ensureIndex(this.db, 'limits', { type: 1, id: 1 }, { name: 'limits-find-current', unique: true })
    return this
  }

  async getUser (filter) {
    if ('id' in filter) {
      filter._id = filter.id
      delete filter.id
    }
    const user = await this.db.collection('users').findOne(filter)
    if (!user) return null
    return cleanUser(user)
  }

  async hasPassword (email) {
    const user = (await this.db.collection('users').find({ email }).collation(collation).toArray())[0]
    return !!(user && user.password)
  }

  async getUserByEmail (email) {
    const user = (await this.db.collection('users').find({ email }).collation(collation).toArray())[0]
    if (!user) return null
    return cleanUser(user)
  }

  async getPassword (userId) {
    const user = await this.db.collection('users').findOne({ _id: userId })
    return user && user.password
  }

  async createUser (user, byUser, host) {
    byUser = byUser || user
    host = host || new URL(config.publicUrl).host
    const clonedUser = cloneWithId(user)
    clonedUser.organizations = clonedUser.organizations || []
    const date = new Date()
    clonedUser.created = { id: byUser.id, name: byUser.name, date, host }
    clonedUser.updated = { id: byUser.id, name: byUser.name, date }
    await this.db.collection('users').findOneAndReplace({ _id: user.id }, clonedUser, { upsert: true })
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
      { returnOriginal: false }
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
    await this.db.collection('users').removeOne({ _id: userId })
  }

  async findUsers (params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: escapeStringRegexp(params.q), $options: 'i' }
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
      filter.organizations.$elemMatch.department = { $in: params.departments }
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
    return {
      count,
      results: users.map(user => {
        const userOrga = user.organizations.find(o => o.id === organizationId)
        return { id: user._id, name: user.name, email: user.email, role: userOrga.role, department: userOrga.department, emailConfirmed: user.emailConfirmed }
      })
    }
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
    await this.db.collection('organizations').insert(clonedOrga)
    return orga
  }

  async patchOrganization (id, patch, user) {
    patch.updated = { id: user.id, name: user.name, date: new Date() }
    const mongoRes = await this.db.collection('organizations').findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnOriginal: false }
    )
    const orga = cleanOrganization(mongoRes.value)
    // "name" was modified, also update all organizations references in users
    if (patch.name) {
      const cursor = this.db.collection('users').find({ organizations: { $elemMatch: { id } } })
      while (await cursor.hasNext()) {
        const user = await cursor.next()
        user.organizations
          .filter(orga => orga.id === id)
          .forEach(orga => {
            orga.name = patch.name
          })
        await this.db.collection('users').updateOne({ _id: user._id }, { $set: { organizations: user.organizations } })
      }
    }
    return orga
  }

  async deleteOrganization (organizationId) {
    await this.db.collection('users')
      .updateMany({}, { $pull: { organizations: { id: organizationId } } })
    await this.db.collection('organizations').removeOne({ _id: organizationId })
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

  async addMember (orga, user, role, department) {
    await this.db.collection('users').updateOne(
      { _id: user.id },
      { $push: { organizations: { id: orga.id, name: orga.name, role, department } } }
    )
  }

  async countMembers (organizationId) {
    return this.db.collection('users').countDocuments({ 'organizations.id': organizationId })
  }

  async setMemberRole (organizationId, userId, role, department) {
    await this.db.collection('users').updateOne(
      { _id: userId, 'organizations.id': organizationId },
      { $set: { 'organizations.$.role': role, 'organizations.$.department': department } }
    )
  }

  async removeMember (organizationId, userId) {
    await this.db.collection('users')
      .updateOne({ _id: userId }, { $pull: { organizations: { id: organizationId } } })
  }

  async setAvatar (avatar) {
    const filter = { 'owner.type': avatar.owner.type, 'owner.id': avatar.owner.id }
    if (avatar.owner.department) filter['owner.department'] = avatar.owner.department
    await this.db.collection('avatars').replaceOne(filter, avatar, { upsert: true })
  }

  async getAvatar (owner) {
    const filter = { 'owner.type': owner.type, 'owner.id': owner.id }
    if (owner.department) filter['owner.department'] = owner.department
    const avatar = await this.db.collection('avatars').findOne(filter)
    if (avatar && avatar.buffer) avatar.buffer = avatar.buffer.buffer
    return avatar
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

  async get2FA (userId) {
    const user = await this.db.collection('users').findOne({ _id: userId })
    return user && user['2FA']
  }
}

exports.init = async (params, org) => new MongodbStorage().init(params, org)
exports.readonly = config.storage.mongo.readonly
