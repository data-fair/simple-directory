import type { Site, Limits, OAuthToken, MemberOverwrite, OrganizationOverwrite, ServerSession, PasswordList } from '#types'
import type { Avatar } from '#services'
import type { OrgInDb, UserInDb } from './storages/mongo.ts'

import mongo from '@data-fair/lib-node/mongo.js'
import config from './config.ts'
import { type OAuthRelayState } from './oauth/service.ts'
import { type Saml2RelayState } from './saml2/service.ts'

const collation = { locale: 'en', strength: 1 }

// collections of the oidc-provider models stored by the oauth server adapter: JWT access tokens are
// never stored, oauth-client (the registered DCR clients) needs no index, the other features are disabled
// the SD record of a grant (grants.ts)
const grantRecordIndexes = {
  subject: { 'sd.subject.id': 1 },
  client: { 'sd.clientId': 1 },
  session: { 'sd.sessionId': 1 }
}
const oauthServerModels = ['authorization-code', 'refresh-token', 'interaction', 'replay-detection', 'grant', 'session']
const oauthServerIndexes = Object.fromEntries(oauthServerModels.map(model => ['oauth-' + model, {
  ttl: [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  grantId: { 'payload.grantId': 1 },
  uid: { 'payload.uid': 1 },
  ...(model === 'grant' ? grantRecordIndexes : {})
}]))

export class SdMongo {
  get client () {
    return mongo.client
  }

  get db () {
    return mongo.db
  }

  get users () {
    return mongo.db.collection<UserInDb>('users')
  }

  get organizations () {
    return mongo.db.collection<OrgInDb>('organizations')
  }

  get sites () {
    return mongo.db.collection<Site>('sites')
  }

  get secrets () {
    return mongo.db.collection<{ _id: string, data: any } >('secrets')
  }

  get avatars () {
    return mongo.db.collection<Avatar>('avatars')
  }

  get limits () {
    return mongo.db.collection<Limits>('limits')
  }

  get oauthTokens () {
    return mongo.db.collection<OAuthToken>('oauth-tokens')
  }

  get oauthRelayStates () {
    return mongo.db.collection<OAuthRelayState>('oauth-relay-states')
  }

  // one document per decided interaction of the oauth server: the lock that makes a consent
  // decision happen once (the provider rewrites its own interaction documents whole)
  get oauthInteractionDecisions () {
    return mongo.db.collection<{ _id: string, expiresAt: Date }>('oauth-interaction-decisions')
  }

  get saml2RelayStates () {
    return mongo.db.collection<Saml2RelayState>('saml2-relay-states')
  }

  get platformScopes () {
    return mongo.db.collection<{ _id: string, etag?: string, scopes: Record<string, string> }>('platform-scopes')
  }

  get oidcDiscovery () {
    return mongo.db.collection<{ _id: string, content: any }>('oidc-discovery')
  }

  get passwordLists () {
    return mongo.db.collection<PasswordList>('password-lists')
  }

  get ldapMembersOverwrite () {
    return mongo.db.collection<MemberOverwrite>('ldap-members-overwrite')
  }

  get ldapOrganizationsOverwrite () {
    return mongo.db.collection<OrganizationOverwrite>('ldap-organizations-overwrite')
  }

  get ldapUserSessions () {
    return mongo.db.collection<{ _id: string, sessions: ServerSession[] }>('ldap-user-sessions')
  }

  get fileUserSessions () {
    return mongo.db.collection<{ _id: string, sessions: ServerSession[] }>('file-user-sessions')
  }

  init = async () => {
    // manage retro-compatibility with STORAGE_MONGO_URL and STORAGE_MONGO_CLIENT_OPTIONS
    const url = config.storage.mongo.url ?? config.mongo.url
    const options = config.storage.mongo.options ?? config.mongo.options
    await mongo.connect(url, options)
    await mongo.configure({
      users: {
        email_1: [
          { email: 1, host: 1 },
          { unique: true, collation, name: 'email_1' }
        ],
        logged_1: [ // for metrics
          { logged: -1 },
          { sparse: true }
        ],
        plannedDeletion_1: [
          { plannedDeletion: 1 },
          { sparse: true }
        ],
        'organizations.id_1': [
          { 'organizations.id': 1 },
          { sparse: true }
        ],
        sessionsLastKeepalive: [
          { 'sessions.lastKeepalive': 1 },
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
          { host: 1, path: 1 },
          { unique: true }
        ],
        'sites-owner': { 'owner.type': 1, 'owner.id': 1, 'owner.department': 1 }
      },
      'oauth-tokens': {
        'oauth-tokens-key': [{ 'user.id': 1, 'provider.id': 1, site: 1 }, { unique: true }],
        'oauth-tokens-provider': { 'provider.id': 1 },
        'oauth-tokens-offline': { offlineRefreshToken: 1 },
        'oauth-tokens-sid': { 'token.session_state': 1 }
      },
      'oauth-relay-states': {
        ttl: [{ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }]
      },
      ...oauthServerIndexes,
      'oauth-interaction-decisions': {
        ttl: [{ expiresAt: 1 }, { expireAfterSeconds: 0 }]
      },
      'saml2-relay-states': {
        ttl: [{ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }]
      },
      'ldap-members-overwrite': {
        'main-keys': [{ orgId: 1, userId: 1 }, { unique: true }],
      },
      'ldap-organizations-overwrite': {
        'main-keys': [{ id: 1 }, { unique: true }]
      }
    })
  }
}

const sdMongo = new SdMongo()

export default sdMongo
