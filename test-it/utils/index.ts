import { strict as assert } from 'node:assert'
import type { AxiosAuthInstance, AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import eventPromise from '@data-fair/lib-utils/event-promise.js'

const directoryUrl = 'http://localhost:5689/simple-directory'

const axiosOpts = { baseURL: directoryUrl }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts, maxRedirects: 0 })

export const axiosAuth = async (opts: string | Omit<AxiosAuthOptions, 'password'> & { password?: string }) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = 'TestPasswd01'
  return _axiosAuth({ password, directoryUrl, ...opts, axiosOpts: { ...axiosOpts, ...opts.axiosOpts } })
}

export const clean = async (options?: { ldapConfig?: any }) => {
  const mongo = (await (import('../../api/src/mongo.ts'))).default
  await mongo.organizations.deleteMany({ _id: { $ne: 'admins-org' } })
  await mongo.users.deleteMany({})
  await mongo.sites.deleteMany({})
  await mongo.oauthTokens.deleteMany()
  await mongo.ldapUserSessions.deleteMany()
  await mongo.fileUserSessions.deleteMany()
  for (const passwordList of await mongo.passwordLists.find().toArray()) {
    try {
      await mongo.db.collection('password-list-' + passwordList._id).drop()
    } catch (err) {
      if (err.code !== 26) throw err
    }
  }
  await mongo.passwordLists.deleteMany()

  if (options?.ldapConfig) {
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(options.ldapConfig)

    for (const email of ['alban.mouton@koumoul.com', 'alban.mouton@gmail.com', 'test@test.com']) {
      const user = await storage.getUserByEmail(email)
      if (user) await storage._deleteUser(user.id)
    }
    const org = await storage.getOrganization('myorg')
    if (org) await storage._deleteOrganization(org.id)
  }
}

process.env.EVENTS_LOG_LEVEL = 'silent'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

export const startApiServer = async () => {
  process.env.NODE_CONFIG_DIR = './api/config/'
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
}

export const createUser = async (email: string, adminMode = false, password = 'TestPasswd01', _directoryUrl?: string) => {
  const { events } = await import('../../api/src/mails/service.ts')
  const axiosOpts = { baseURL: _directoryUrl ?? directoryUrl }
  const anonymAx = await axios(axiosOpts)
  const mailPromise = eventPromise<any>(events, 'send')
  await anonymAx.post('/api/users', { email, password })
  const mail = await mailPromise
  // sent a mail with a token_callback url to validate user creation
  assert.ok(mail.link.includes('token_callback'))
  await anonymAx(mail.link).catch((err: any) => { if (err.status !== 302) throw err })
  const ax = await axiosAuth({ email, adminMode, password, axiosOpts, directoryUrl: _directoryUrl ?? directoryUrl })
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}

export const waitForMail = async () => {
  const { events } = await import('../../api/src/mails/service.ts')
  return eventPromise<any>(events, 'send')
}

export const getAllEmails = async () => {
  const ax = await axios()
  return (await ax.get('http://localhost:1080/email')).data
}

export const deleteAllEmails = async () => {
  const ax = await axios()
  const emails = (await ax.get('http://localhost:1080/email')).data
  for (const email of emails) {
    await ax.delete('http://localhost:1080/email/' + email.id)
  }
}

export const passwordLogin = async (ax: AxiosAuthInstance, email: string, password: string) => {
  const callbackUrl = (await ax.post('/api/auth/password', { email, password })).data
  try {
    await ax.get(callbackUrl, { maxRedirects: 0 })
  } catch (err: any) {
    if (err.status !== 302) throw err
    const redirectUrl = new URL(err.headers.location)
    const redirectError = redirectUrl.searchParams.get('error')
    if (redirectError) throw new Error(redirectError)
  }
}
