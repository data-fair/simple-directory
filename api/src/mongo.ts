import type { User, Organization } from '#types'

import mongo from '@data-fair/lib-node/mongo.js'
import config from './config.ts'

const collation = { locale: 'en', strength: 1 }

export class SdMongo {
  get client () {
    return mongo.client
  }

  get db () {
    return mongo.db
  }

  get users () {
    return mongo.db.collection<User>('users')
  }

  get organizations () {
    return mongo.db.collection<User>('users')
  }

  get secrets () {
    return mongo.db.collection<{ _id: string, data: any } >('secret')
  }

  init = async () => {
    await mongo.connect(config.mongoUrl)
    await mongo.configure({
      users: {
        email_1: [
          { email: 1, host: 1 },
          { unique: true, collation, name: 'email_1' }
        ],
        logged_1: [ // for metrics
          { logged: 1 },
          { sparse: true }
        ],
        plannedDeletion_1: [
          { plannedDeletion: 1 },
          { sparse: true }
        ],
        'organizations.id_1': [
          { 'organizations.id': 1 },
          { sparse: true }
        ]
      },
      avatars: {
        'owner.type_1_owner.id_1': [
          { 'owner.type': 1, 'owner.id': 1, 'owner.department': 1 },
          { unique: true }
        ]
      },
      limits: {
        fulltext: { id: 'text', name: 'text' },
        'limits-find-current': [
          { type: 1, id: 1 },
          { unique: true }
        ]
      },
      sites: {
        'sites-host': [
          { host: 1 },
          { unique: true }
        ],
        'sites-owner': { 'owner.type': 1, 'owner.id': 1, 'owner.department': 1 }
      },
      'oauth-tokens': {
        'oauth-tokens-key': [{ 'user.id': 1, 'provider.id': 1 }, { unique: true }],
        'oauth-tokens-provider': { 'provider.id': 1 },
        'oauth-tokens-offline': { offlineRefreshToken: 1 },
        'oauth-tokens-sid': { 'token.session_state': 1 }
      }
    })
  }
}

const sdMongo = new SdMongo()

export default sdMongo
