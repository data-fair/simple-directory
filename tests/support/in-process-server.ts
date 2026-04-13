// In-process server support for tests that need a fundamentally different server config
// (e.g., STORAGE_TYPE=ldap). Only used by .inproc.spec.ts tests.

// Must be set before config module is loaded
process.env.NODE_ENV = 'test'
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'

import { strict as assert } from 'node:assert'
import type { AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import { CookieJar } from 'tough-cookie'
import { clean } from './unit.ts'

let testPort: number
let directoryUrl: string

export const startApiServer = async () => {
  testPort = 10000 + Math.floor(Math.random() * 50000)
  directoryUrl = `http://localhost:${testPort}/simple-directory`
  process.env.PORT = String(testPort)
  process.env.DEV_API_PORT = String(testPort)
  process.env.EVENTS_LOG_LEVEL = 'silent'
  process.env.SUPPRESS_NO_CONFIG_WARNING = '1'
  process.env.OBSERVER_ACTIVE = 'false'

  // Import config BEFORE server starts — the test config (NODE_ENV=test) uses loadFileConfigs
  // which produces an unfrozen object that can be mutated
  const config = (await import('../../api/src/config.ts')).default
  ;(config as any).port = testPort
  ;(config as any).publicUrl = directoryUrl

  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()

  // Set forwarded headers on the shared axios instance used by lib-node's axiosAuth
  const { axiosInstance } = await import('@data-fair/lib-node/axios.js')
  Object.assign(axiosInstance.defaults.headers.common, forwardedHeaders())
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
  // Clean up forwarded headers from the global axios instance
  const { axiosInstance } = await import('@data-fair/lib-node/axios.js')
  delete axiosInstance.defaults.headers.common['X-Forwarded-For']
  delete axiosInstance.defaults.headers.common['X-Forwarded-Host']
  delete axiosInstance.defaults.headers.common['X-Forwarded-Proto']
}

const forwardedHeaders = () => ({
  'X-Forwarded-For': '127.0.0.1',
  'X-Forwarded-Host': `localhost:${testPort}`,
  'X-Forwarded-Proto': 'http'
})

export const axios = (opts: any = {}) => axiosBuilder({
  baseURL: directoryUrl,
  headers: forwardedHeaders(),
  ...opts,
  maxRedirects: 0
})

export const axiosAuth = async (opts: string | Omit<AxiosAuthOptions, 'password'> & { password?: string }) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = opts.password || 'TestPasswd01'
  return _axiosAuth({ password, directoryUrl, ...opts, axiosOpts: { baseURL: directoryUrl, headers: forwardedHeaders(), ...opts.axiosOpts } })
}

export { clean }

export const loginWithOIDC = async (port: number) => {
  const anonymousAx = await axios()

  const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${port}/login`, { validateStatus: (status: number) => status === 302 })
  const providerAuthUrl = new URL(loginInitial.headers.location)
  assert.equal(providerAuthUrl.host, 'localhost:' + port)
  assert.equal(providerAuthUrl.pathname, '/authorize')
  assert.equal(providerAuthUrl.searchParams.get('redirect_uri'), directoryUrl + '/api/auth/oauth-callback')
  const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status: number) => status === 302 })
  const providerAuthRedirect = new URL(loginProvider.headers.location)
  assert.ok(providerAuthRedirect.pathname.endsWith('/api/auth/oauth-callback'))
  const oauthCallback = await anonymousAx(providerAuthRedirect.href, { validateStatus: (status: number) => status === 302 })
  const callbackRedirect = new URL(oauthCallback.headers.location)
  assert.ok(callbackRedirect.pathname.endsWith('/api/auth/token_callback'))
  const tokenCallback = await anonymousAx(callbackRedirect.href, { validateStatus: (status: number) => status === 302 })
  const setCookies = tokenCallback.headers['set-cookie']
  assert.ok(setCookies && setCookies.length >= 3)
  const cookieJar = new CookieJar()
  const cookieUrl = directoryUrl + '/'
  for (const cookie of setCookies) {
    cookieJar.setCookie(cookie, cookieUrl)
  }

  anonymousAx.defaults.headers.Cookie = await cookieJar.getCookieString(cookieUrl)

  return anonymousAx
}
