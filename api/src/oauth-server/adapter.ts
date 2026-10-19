// oidc-provider adapter: one mongo collection per model, documents are { _id, payload, expiresAt }.
// https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#adapter
import type { Adapter, AdapterPayload } from 'oidc-provider'
import type { Collection } from 'mongodb'
import mongo from '#mongo'

type OAuthDoc = { _id: string, payload: AdapterPayload, expiresAt?: Date }

const kebabCase = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export class MongoAdapter implements Adapter {
  readonly name: string

  constructor (name: string) {
    this.name = name
  }

  private get collection (): Collection<OAuthDoc> {
    return mongo.db.collection<OAuthDoc>('oauth-' + kebabCase(this.name))
  }

  async upsert (id: string, payload: AdapterPayload, expiresIn: number) {
    const doc: OAuthDoc = { _id: id, payload }
    if (expiresIn) doc.expiresAt = new Date(Date.now() + expiresIn * 1000)
    await this.collection.replaceOne({ _id: id }, doc, { upsert: true })
  }

  async find (id: string) {
    // clients are resolved elsewhere, never stored by this adapter
    if (this.name === 'Client') return undefined
    return this.toPayload(await this.collection.findOne({ _id: id }))
  }

  async findByUid (uid: string) {
    return this.toPayload(await this.collection.findOne({ 'payload.uid': uid }))
  }

  async findByUserCode (userCode: string) {
    return this.toPayload(await this.collection.findOne({ 'payload.userCode': userCode }))
  }

  async consume (id: string) {
    await this.collection.updateOne({ _id: id }, { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } })
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
