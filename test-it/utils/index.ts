import { strict as assert } from 'node:assert'
import type { AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import mongo from '@data-fair/lib-node/mongo.js'
import eventPromise from '@data-fair/lib-utils/event-promise.js'

const directoryUrl = 'http://localhost:5689/simple-directory'

const axiosOpts = { baseURL: 'http://localhost:5689/simple-directory' }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })

export const axiosAuth = (opts: string | Omit<AxiosAuthOptions, 'directoryUrl' | 'axiosOpts' | 'password'>) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = opts.email === 'superadmin@test.com' ? 'superpasswd' : 'passwd'
  return _axiosAuth({ ...opts, password, axiosOpts, directoryUrl })
}

export const clean = async (options?: { ldapConfig?: any }) => {
  for (const name of ['users', 'organizations']) {
    await mongo.db.collection(name).deleteMany({})
  }
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
  process.env.NODE_CONFIG_DIR = 'api/config/'
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
}

export const createUser = async (email: string, adminMode = false, password = 'TestPasswd01') => {
  const { events } = await import('../../api/src/mails/service.ts')
  const anonymAx = await axios()
  const mailPromise = eventPromise<any>(events, 'send')
  await anonymAx.post('/api/users', { email, password })
  const mail = await mailPromise
  // sent a mail with a token_callback url to validate user creation
  assert.ok(mail.link.includes('token_callback'))
  await anonymAx({ url: mail.link, maxRedirects: 0 }).catch((err: any) => { if (err.status !== 302) throw err })
  const ax = await _axiosAuth({ email, adminMode, password, axiosOpts, directoryUrl })
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}
