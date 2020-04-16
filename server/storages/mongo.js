const collation = { locale: 'en', strength: 1 }

async function ensureIndex(db, collection, key, options = {}) {
  try {
    await db.collection(collection).createIndex(key, options)
  } catch (error) {
    if (error.codeName === 'IndexOptionsConflict') {
      console.log(`Index options conflict for index ${collection}.${JSON.stringify(key)}.${JSON.stringify(options)}. Delete then re-create the index`)
      await db.collection(collection).dropIndex(key)
      await db.collection(collection).createIndex(key, options)
    } else {
      throw error
    }
  }
}

function cleanResource(resource) {
  resource.id = resource._id
  delete resource._id
  delete resource.password
  return resource
}

function cloneWithId(resource) {
  const resourceClone = { ...resource, _id: resource.id }
  delete resourceClone.id
  return resourceClone
}

function prepareSelect(select) {
  if (!select) return {}
  return select.reduce((a, key) => { a[key] = true; return a }, {})
}

class MongodbStorage {
  async init(params) {
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
    await ensureIndex(this.db, 'users', { email: 1 }, { unique: true, collation })
    await ensureIndex(this.db, 'users', { 'organizations.id': 1 }, { sparse: true })
    await ensureIndex(this.db, 'invitations', { email: 1, id: 1 }, { unique: true })
    await ensureIndex(this.db, 'avatars', { 'owner.type': 1, 'owner.id': 1 }, { unique: true })
    return this
  }

  async getUser(filter) {
    if ('id' in filter) {
      filter._id = filter.id
      delete filter.id
    }
    const user = await this.db.collection('users').findOne(filter)
    if (!user) return null
    return cleanResource(user)
  }

  async getUserByEmail(email) {
    const user = (await this.db.collection('users').find({ email }).collation(collation).toArray())[0]
    if (!user) return null
    return cleanResource(user)
  }

  async getPassword(userId) {
    const user = await this.db.collection('users').findOne({ _id: userId })
    return user && user.password
  }

  async createUser(user, byUser) {
    byUser = byUser || user
    const clonedUser = cloneWithId(user)
    clonedUser.organizations = clonedUser.organizations || []
    const date = new Date()
    clonedUser.created = { id: byUser.id, name: byUser.name, date }
    clonedUser.updated = { id: byUser.id, name: byUser.name, date }
    await this.db.collection('users').findOneAndReplace({ _id: user.id }, clonedUser, { upsert: true })
    return user
  }

  async patchUser(id, patch, byUser) {
    if (byUser) patch.updated = { id: byUser.id, name: byUser.name, date: new Date() }
    const mongoRes = await this.db.collection('users').findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnOriginal: false }
    )
    const user = cleanResource(mongoRes.value)
    // "name" was modified, also update all references in created and updated events
    if (patch.name) {
      this.db.collection('users').updateMany({ 'created.id': id }, { $set: { 'created.name': patch.name } })
      this.db.collection('users').updateMany({ 'updated.id': id }, { $set: { 'updated.name': patch.name } })
      this.db.collection('organizations').updateMany({ 'created.id': id }, { $set: { 'created.name': patch.name } })
      this.db.collection('organizations').updateMany({ 'updated.id': id }, { $set: { 'updated.name': patch.name } })
    }
    return user
  }

  async updateLogged(id) {
    this.db.collection('users').updateOne({ _id: id }, { $set: { logged: new Date() } })
  }

  async confirmEmail(id) {
    this.db.collection('users').updateOne({ _id: id }, { $set: { emailConfirmed: true } })
  }

  async deleteUser(userId) {
    await this.db.collection('users').removeOne({ _id: userId })
  }

  async findUsers(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: params.q, $options: 'i' }
    }

    const countPromise = this.db.collection('users').count(filter)
    const users = await this.db.collection('users')
      .find(filter)
      .project(prepareSelect(params.select))
      .sort(params.sort)
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return { count, results: users.map(cleanResource) }
  }

  async findMembers(organizationId, params = {}) {
    const filter = { 'organizations': { $elemMatch: { id: organizationId } } }
    if (params.ids && params.ids.length) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: params.q, $options: 'i' }
    }
    if (params.roles && params.roles.length) {
      filter.organizations.$elemMatch.role = { $in: params.roles }
    }
    if (params.departments && params.departments.length) {
      filter.organizations.$elemMatch.department = { $in: params.departments }
    }
    const countPromise = this.db.collection('users').count(filter)
    const users = await this.db.collection('users')
      .find(filter)
      .sort(params.sort)
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return {
      count,
      results: users.map(user => {
        const userOrga = user.organizations.find(o => o.id === organizationId)
        return { id: user._id, name: user.name, email: user.email, role: userOrga.role, department: userOrga.department }
      })
    }
  }

  async getOrganization(id) {
    const organization = await this.db.collection('organizations').findOne({ _id: id })
    if (!organization) return null
    return cleanResource(organization)
  }

  async createOrganization(orga, user) {
    const clonedOrga = cloneWithId(orga)
    const date = new Date()
    clonedOrga.created = { id: user.id, name: user.name, date }
    clonedOrga.updated = { id: user.id, name: user.name, date }
    await this.db.collection('organizations').insert(clonedOrga)
    return orga
  }

  async patchOrganization(id, patch, user) {
    patch.updated = { id: user.id, name: user.name, date: new Date() }
    const mongoRes = await this.db.collection('organizations').findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { returnOriginal: false }
    )
    const orga = cleanResource(mongoRes.value)
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

  async deleteOrganization(organizationId) {
    await this.db.collection('users')
      .updateMany({}, { $pull: { organizations: { id: organizationId } } })
    await this.db.collection('organizations').removeOne({ _id: organizationId })
  }

  async findOrganizations(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = { $in: params.ids }
    }
    if (params.q) {
      filter.name = { $regex: params.q, $options: 'i' }
    }
    if (params.creator) {
      filter['created.id'] = params.creator
    }

    const countPromise = this.db.collection('organizations').count(filter)
    const organizations = await this.db.collection('organizations')
      .find(filter)
      .sort(params.sort)
      .project(prepareSelect(params.select))
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return { count, results: organizations.map(cleanResource) }
  }

  async addMember(orga, user, role, department) {
    await this.db.collection('users').updateOne(
      { _id: user.id },
      { $push: { organizations: { id: orga.id, name: orga.name, role, department } } }
    )
  }

  async setMemberRole(organizationId, userId, role, department) {
    await this.db.collection('users').updateOne(
      { _id: userId, 'organizations.id': organizationId },
      { $set: { 'organizations.$.role': role, 'organizations.$.department': department } }
    )
  }

  async removeMember(organizationId, userId) {
    await this.db.collection('users')
      .updateOne({ _id: userId }, { $pull: { organizations: { id: organizationId } } })
  }

  async setAvatar(avatar) {
    await this.db.collection('avatars').replaceOne(
      { 'owner.type': avatar.owner.type, 'owner.id': avatar.owner.id },
      avatar,
      { upsert: true }
    )
  }

  async getAvatar(owner) {
    const avatar = await this.db.collection('avatars').findOne({ 'owner.type': owner.type, 'owner.id': owner.id })
    if (avatar && avatar.buffer) avatar.buffer = avatar.buffer.buffer
    return avatar
  }
}

exports.init = async (params) => new MongodbStorage().init(params)
exports.readonly = false
