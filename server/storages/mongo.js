const collation = { locale: 'simple', strength: 1 }

async function ensureIndex(db, collection, key, options) {
  try {
    await db.collection(collection).createIndex(key, options || {})
  } catch (error) {
    console.error('Init mongodb index creation failure for', collection, key, error)
  }
}

function switchBackId(resource) {
  resource.id = resource._id
  delete resource._id
  return resource
}

function cloneWithId(resource) {
  const resourceClone = {...resource, _id: resource.id}
  delete resourceClone.id
  return resourceClone
}

function prepareSelect(select) {
  if (!select) return {}
  return select.reduce((a, key) => { a[key] = true; return a }, {})
}

class MongodbStorage {
  async init(params) {
    this.readonly = false
    this.mongodb = require('mongodb')
    const mongoClient = this.mongodb.MongoClient
    this.client = await mongoClient.connect(params.url, {autoReconnect: true, bufferMaxEntries: -1})
    this.db = this.client.db()
    // An index for comparison case and diacritics insensitive
    await ensureIndex(this.db, 'users', {email: 1}, {unique: true, collation})
    await ensureIndex(this.db, 'users', {'organizations.id': 1}, {sparse: true})
    await ensureIndex(this.db, 'invitations', {email: 1, id: 1}, {unique: true})
    return this
  }

  async getUser(filter) {
    if (filter.id) {
      filter._id = filter.id
      delete filter.id
    }
    const user = await this.db.collection('users').findOne(filter)
    if (!user) return null
    return switchBackId(user)
  }

  async getUserByEmail(email) {
    const user = (await this.db.collection('users').find({email}).collation(collation).toArray())[0]
    if (!user) return null
    return switchBackId(user)
  }

  async createUser(user, byUser) {
    byUser = byUser || user
    const clonedUser = cloneWithId(user)
    clonedUser.organizations = clonedUser.organizations || []
    const date = new Date()
    clonedUser.created = {id: byUser.id, name: byUser.name, date}
    clonedUser.updated = {id: byUser.id, name: byUser.name, date}
    await this.db.collection('users').insert(clonedUser)
    return user
  }

  async patchUser(id, patch, byUser) {
    if (byUser) patch.updated = {id: byUser.id, name: byUser.name, date: new Date()}
    const mongoRes = await this.db.collection('users').findOneAndUpdate({_id: id}, {$set: patch})
    const user = switchBackId(mongoRes.value)
    // "name" was modified, also update all references in created and updated events
    if (patch.name) {
      this.db.collection('users').updateMany({'created.id': id}, {$set: {'created.name': patch.name}})
      this.db.collection('users').updateMany({'updated.id': id}, {$set: {'updated.name': patch.name}})
      this.db.collection('organizations').updateMany({'created.id': id}, {$set: {'created.name': patch.name}})
      this.db.collection('organizations').updateMany({'updated.id': id}, {$set: {'updated.name': patch.name}})
    }
    return user
  }

  async updateLogged(id) {
    this.db.collection('users').updateOne({_id: id}, {$set: {logged: new Date()}})
  }

  async deleteUser(userId) {
    await this.db.collection('users').removeOne({_id: userId})
  }

  async findUsers(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = {$in: params.ids}
    }
    if (params.q) {
      filter.name = {$regex: params.q, $options: 'i'}
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
    return {count, results: users.map(switchBackId)}
  }

  async findMembers(organizationId, params = {}) {
    const filter = {'organizations': {$elemMatch: {id: organizationId}}}
    if (params.ids) {
      filter._id = {$in: params.ids}
    }
    if (params.q) {
      filter.name = {$regex: params.q, $options: 'i'}
    }
    if (params.role) {
      filter.organizations.$elemMatch.role = params.role
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
        return {id: user._id, name: user.name, email: user.email, role: user.organizations.find(o => o.id === organizationId).role}
      })
    }
  }

  async getOrganization(id) {
    const organization = await this.db.collection('organizations').findOne({_id: id})
    if (!organization) return null
    return switchBackId(organization)
  }

  async createOrganization(orga, user) {
    const clonedOrga = cloneWithId(orga)
    const date = new Date()
    clonedOrga.created = {id: user.id, name: user.name, date}
    clonedOrga.updated = {id: user.id, name: user.name, date}
    await this.db.collection('organizations').insert(clonedOrga)
    return orga
  }

  async patchOrganization(id, patch, user) {
    patch.updated = {id: user.id, name: user.name, date: new Date()}
    const mongoRes = await this.db.collection('organizations').findOneAndUpdate({_id: id}, {$set: patch})
    const orga = switchBackId(mongoRes.value)
    // "name" was modified, also update all organizations references in users
    if (patch.name) {
      const cursor = this.db.collection('users').find({organizations: {$elemMatch: {id}}})
      while (await cursor.hasNext()) {
        const user = await cursor.next()
        user.organizations
          .filter(orga => orga.id === id)
          .forEach(orga => {
            orga.name = patch.name
          })
        await this.db.collection('users').updateOne({_id: user._id}, {$set: {organizations: user.organizations}})
      }
    }
    return orga
  }

  async deleteOrganization(organizationId) {
    await this.db.collection('users')
      .updateMany({}, {$pull: {organizations: {id: organizationId}}})
    await this.db.collection('organizations').removeOne({_id: organizationId})
  }

  async findOrganizations(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = {$in: params.ids}
    }
    if (params.q) {
      filter.name = {$regex: params.q, $options: 'i'}
    }
    if (params.creator) {
      filter['created.id'] = params.creator
    }

    const countPromise = this.db.collection('organizations').count(filter)
    const organizations = await this.db.collection('organizations')
      .find(filter)
      .project(prepareSelect(params.select))
      .skip(params.skip)
      .limit(params.size)
      .toArray()
    const count = await countPromise
    return {count, results: organizations.map(switchBackId)}
  }

  async addMember(orga, user, role) {
    await this.db.collection('users').updateOne(
      {_id: user.id},
      {$push: {organizations: {id: orga.id, name: orga.name, role}}}
    )
  }

  async setMemberRole(organizationId, userId, role) {
    await this.db.collection('users').updateOne(
      {_id: userId, 'organizations.id': organizationId},
      {$set: {'organizations.$.role': role}}
    )
  }

  async removeMember(organizationId, userId) {
    await this.db.collection('users')
      .updateOne({_id: userId}, {$pull: {organizations: {id: organizationId}}})
  }
}

module.exports = async (params) => new MongodbStorage().init(params)
