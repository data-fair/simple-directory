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

class MongodbStorage {
  async init(params) {
    this.readonly = false
    this.mongodb = require('mongodb')
    const mongoClient = this.mongodb.MongoClient
    this.client = await mongoClient.connect(params.url, {autoReconnect: true, bufferMaxEntries: -1})
    this.db = this.client.db()
    await ensureIndex(this.db, 'users', {email: 1}, {unique: true})
    await ensureIndex(this.db, 'users', {'organizations.id': 1}, {sparse: true})
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

  async createUser(user) {
    const clonedUser = cloneWithId(user)
    clonedUser.organizations = clonedUser.organizations || []
    await this.db.collection('users').insert(clonedUser)
    return user
  }

  async addUserOrganization(orga, user, role) {
    await this.db.collection('users').updateOne(
      {_id: user.id},
      {$push: {organizations: {id: orga.id, name: orga.name, role}}}
    )
  }

  async findUsers(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = {$in: params.ids}
    }
    if (params.organization) {
      filter['organization.id'] = params.organization
    }
    if (params.q) {
      filter['$or'] = {
        firstName: {$regex: params.q, options: 'i'},
        lastName: {$regex: params.q, options: 'i'}
      }
    }
    const countPromise = this.db.collection('users').count(filter)
    const users = await this.db.collection('users')
      .find(filter, {organizations: 0}, {skip: params.skip || 0, limit: params.limit || 20})
      .toArray()
    const count = await countPromise
    return {count, results: users.map(switchBackId)}
  }

  async getOrganization(id) {
    const organization = await this.db.collection('organizations').findOne({_id: id})
    if (!organization) return null
    return switchBackId(organization)
  }

  async createOrganization(orga) {
    await this.db.collection('organizations').insert(cloneWithId(orga))
    return orga
  }

  async patchOrganization(id, patch) {
    const orga = await this.db.collection('organizations').findOneAndUpdate({_id: id}, {$set: patch})
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
        await this.db.collection('users').updateOne({id: user.id}, {$set: {organizations: user.organizations}})
      }
    }
    return orga
  }

  async findOrganizations(params = {}) {
    const filter = {}
    if (params.ids) {
      filter._id = {$in: params.ids}
    }
    if (params.q) {
      filter.name = {$regex: params.q, options: 'i'}
    }

    const countPromise = this.db.collection('organizations').count(filter)
    const organizations = await this.db.collection('organizations')
      .find(filter, {skip: params.skip || 0, limit: params.limit || 20})
      .toArray()
    const count = await countPromise
    return {count, results: organizations.map(switchBackId)}
  }
}

module.exports = async (params) => new MongodbStorage().init(params)
