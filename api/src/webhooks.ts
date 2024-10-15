import { User } from '@data-fair/lib-express'
import type { PostIdentityReq } from '@data-fair/lib-express/identities/types/post-req/index.js'
const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')
const debug = require('debug')('webhooks')

export async function postUser(user: User) {
  await postIdentity('user', {name: user.name})
}

const postIdentity = async (type: string, identity: PostIdentityReq["body"]) => {
  const name = type === 'user' ? userName(identity) : identity.name
  const body = { name }
  if (type === 'user' && identity.organizations) body.organizations = identity.organizations
  if (type === 'organization' && identity.departments) body.departments = identity.departments
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${identity.id}`
    debug(`Send identity name webhook to ${url} : `, body)
    try {
      await axios.post(url, body, { params: { key: webhook.key } })
    } catch (err) {
      console.error('Failure in webhook ' + url, err.body || err.message || err)
    }
  }
}

exports.deleteIdentity = async (type, id) => {
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${id}`
    debug(`Send identity delete webhook to ${url}`)
    try {
      await axios.delete(url, { params: { key: webhook.key } })
    } catch (err) {
      console.error('Failure in webhook ' + url, err.body || err.message || err)
    }
  }
}
