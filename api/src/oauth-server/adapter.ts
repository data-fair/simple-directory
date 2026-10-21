// oidc-provider adapter: one mongo collection per model, documents are { _id, payload, expiresAt }.
// https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#adapter
import { errors, type Adapter, type AdapterPayload } from 'oidc-provider'
import type { Collection, UpdateFilter } from 'mongodb'
import mongo from '#mongo'

// scope: extra fields written on upsert and required on find (the issuer of a registered client)
type OAuthDoc = { _id: string, payload: AdapterPayload, expiresAt?: Date, createdAt?: Date } & Record<string, unknown>

const kebabCase = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export class MongoAdapter implements Adapter {
  readonly name: string
  readonly scope: Record<string, string>

  constructor (name: string, scope: Record<string, string> = {}) {
    this.name = name
    this.scope = scope
  }

  private get collection (): Collection<OAuthDoc> {
    return mongo.db.collection<OAuthDoc>('oauth-' + kebabCase(this.name))
  }

  // a partial update: SD's fields on a document (the grant record of a Grant, grants.ts) survive
  // the provider's saves
  async upsert (id: string, payload: AdapterPayload, expiresIn: number) {
    const $set: Partial<OAuthDoc> = { payload, ...this.scope }
    if (expiresIn) $set.expiresAt = new Date(Date.now() + expiresIn * 1000)
    const update: UpdateFilter<OAuthDoc> = { $set }
    if (!expiresIn) update.$unset = { expiresAt: '' }
    // registered clients: the age of an unused one decides its cleanup (dynamic-clients.ts)
    if (this.name === 'Client') update.$setOnInsert = { createdAt: new Date() }
    await this.collection.updateOne({ _id: id }, update, { upsert: true })
  }

  async find (id: string) {
    return this.toPayload(await this.collection.findOne({ _id: id, ...this.scope }))
  }

  async findByUid (uid: string) {
    return this.toPayload(await this.collection.findOne({ 'payload.uid': uid }))
  }

  async findByUserCode (userCode: string) {
    return this.toPayload(await this.collection.findOne({ 'payload.userCode': userCode }))
  }

  // the provider checks consumed on the copy it read: the conditional update closes the race of two
  // concurrent uses, the loser's next attempt meets the provider's own reuse detection
  async consume (id: string) {
    const { matchedCount } = await this.collection.updateOne({ _id: id, 'payload.consumed': { $exists: false } }, { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } })
    if (!matchedCount) throw new errors.InvalidGrant('grant already used')
  }

  async destroy (id: string) {
    await this.collection.deleteOne({ _id: id })
  }

  async revokeByGrantId (grantId: string) {
    await this.collection.deleteMany({ 'payload.grantId': grantId })
  }

  // the TTL monitor runs about once a minute, so expiry is also checked on read
  private toPayload (doc: OAuthDoc | null) {
    if (!doc) return undefined
    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) return undefined
    return doc.payload
  }
}
