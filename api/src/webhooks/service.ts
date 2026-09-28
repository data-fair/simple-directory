import type { User } from '#types/user/index.ts'
import type { Organization } from '#types/organization/index.ts'
import type { PostIdentityReq } from '@data-fair/lib-express/identities/types/post-req/index.js'
import axios from '@data-fair/lib-node/axios.js'
import { internalError } from '@data-fair/lib-node/observer.js'
import config from '#config'
import Debug from 'debug'

const debug = Debug('webhooks')

export async function postUserIdentityWebhook (user?: Pick<User, 'id' | 'name' | 'organizations'>) {
  if (!user) return
  await postIdentityWebhook({ type: 'user', id: user.id, name: user.name, organizations: user.organizations })
}
export async function postOrganizationIdentityWebhook (org: Pick<Organization, 'id' | 'name' | 'departments' | 'partners'>) {
  // pending invitations have no id yet, only established partnerships are sent
  const partners = (org.partners ?? []).filter(p => p.id).map(p => ({ id: p.id as string, name: p.name }))
  await postIdentityWebhook({ type: 'organization', id: org.id, name: org.name, departments: org.departments, partners })
}

// the secret is expected in the x-secret-key header (assertReqInternalSecret in @data-fair/lib-express),
// the key query parameter is only kept for services whose identities router still reads it
const webhookAuth = (key: string) => ({ params: { key }, headers: { 'x-secret-key': key } })

const postIdentityWebhook = async (identity: PostIdentityReq['body'] & PostIdentityReq['params']) => {
  for (const webhook of config.webhooks.identities) {
    for (const org of identity.organizations || []) {
      if (org.department === null || org.department === '') delete org.department
    }
    const url = `${webhook.base}/${identity.type}/${identity.id}`
    debug(`Send identity name webhook to ${url} : `, identity)
    try {
      await axios.post(url, identity, webhookAuth(webhook.key))
    } catch (err: any) {
      internalError('webhook-identity-post', err)
    }
  }
}

export const deleteIdentityWebhook = async (type: string, id: string) => {
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${id}`
    debug(`Send identity delete webhook to ${url}`)
    try {
      await axios.delete(url, webhookAuth(webhook.key))
    } catch (err: any) {
      internalError('webhook-identity-delete', err)
    }
  }
}
