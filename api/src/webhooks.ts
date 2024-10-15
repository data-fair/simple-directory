import type { User } from '#types/user/index.ts'
import type { Organization } from '#types/organization/index.ts'
import type { PostIdentityReq } from '@data-fair/lib-express/identities/types/post-req/index.js'
const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')
const debug = require('debug')('webhooks')

export async function postUserIdentity(user: User) {
  await postIdentity({ type: 'user', id: user.id, name: user.name, organizations: user.organizations })
}
export async function postOrganizationIdentity(org: Organization) {
  await postIdentity({ type: 'organization', id: org.id, name: org.name, departments: org.departments })
}

const postIdentity = async (identity: PostIdentityReq["body"] & PostIdentityReq["params"]) => {
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${identity.type}/${identity.id}`
    debug(`Send identity name webhook to ${url} : `, identity)
    try {
      await axios.post(url, identity, { params: { key: webhook.key } })
    } catch (err: any) {
      console.error('Failure in POST identity webhook', err)
    }
  }
}

exports.deleteIdentity = async (type: string, id: string) => {
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${id}`
    debug(`Send identity delete webhook to ${url}`)
    try {
      await axios.delete(url, { params: { key: webhook.key } })
    } catch (err: any) {
      console.error('Failure in DELETE identity webhook', err)
    }
  }
}
