import { strict as assert } from 'node:assert'
import type { AxiosAuthInstance, AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'

// Set NODE_CONFIG_DIR so test files can import api/src/config.ts
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'

export const directoryUrl = `http://${process.env.DEV_HOST || 'localhost'}:${process.env.NGINX_PORT1}/simple-directory`

export const devApiUrl = `http://localhost:${process.env.DEV_API_PORT}`

const axiosOpts = { baseURL: directoryUrl }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts, maxRedirects: 0 })

export const axiosAuth = async (opts: string | Omit<AxiosAuthOptions, 'password'> & { password?: string }) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = opts.password || 'TestPasswd01'
  return _axiosAuth({ password, directoryUrl, ...opts, axiosOpts: { ...axiosOpts, ...opts.axiosOpts } })
}

// Axios instances for test infrastructure endpoints
export const testEnvAx = axiosBuilder({ baseURL: `${devApiUrl}/api/test-env` })
export const maildevAx = axiosBuilder({ baseURL: `http://localhost:${process.env.MAILDEV_UI_PORT}` })

const mockOidcPort1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const mockOidcPort2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')
export const mockOidcControlUrl1 = `http://localhost:${mockOidcPort1 + 100}`
export const mockOidcControlUrl2 = `http://localhost:${mockOidcPort2 + 100}`

// Fetch config from the running dev server (avoids importing config.ts locally which loads test.cjs)
let _serverConfig: any
export const getServerConfig = async () => {
  if (!_serverConfig) {
    _serverConfig = (await testEnvAx.get('/config')).data
  }
  return _serverConfig
}

// Start an SSE listener for mail events. Returns { ready, promise }.
// Await `ready` before triggering the action that sends the mail, then await `promise` for the result.
export const startMailListener = (filter?: (data: any) => boolean, timeout = 10000) => {
  const controller = new AbortController()
  let resolveReady: () => void
  const ready = new Promise<void>(resolve => { resolveReady = resolve })

  const promise = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort()
      reject(new Error(`waitForMail timeout after ${timeout}ms`))
    }, timeout)

    fetch(`${devApiUrl}/api/test-env/events`, {
      signal: controller.signal,
      headers: { Accept: 'text/event-stream' }
    }).then(async (res) => {
      resolveReady()
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()!
        for (const part of parts) {
          let eventType = ''
          let data = ''
          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7)
            else if (line.startsWith('data: ')) data = line.slice(6)
          }
          if (eventType === 'mail' && data) {
            const parsed = JSON.parse(data)
            if (!filter || filter(parsed)) {
              clearTimeout(timer)
              controller.abort()
              resolve(parsed)
              return
            }
          }
        }
      }
    }).catch((err: any) => {
      if (err.name !== 'AbortError') {
        clearTimeout(timer)
        reject(err)
      }
    })
  })

  return { ready, promise }
}

// Convenience: run an action and wait for the mail it sends.
export const waitForMail = async (action: () => Promise<any>, filter?: (data: any) => boolean, timeout = 10000) => {
  const listener = startMailListener(filter, timeout)
  await listener.ready
  await action()
  return listener.promise
}

export const createUser = async (email: string, adminMode = false, password = 'TestPasswd01', _directoryUrl?: string) => {
  const baseUrl = _directoryUrl ?? directoryUrl
  const createAxiosOpts = { baseURL: baseUrl }
  const anonymAx = await axios(createAxiosOpts)

  const mail = await waitForMail(
    () => anonymAx.post('/api/users', { email, password }),
    (m) => m.to === email && m.link?.includes('token_callback')
  )

  // follow the token_callback link to confirm the user
  await anonymAx(mail.link).catch((err: any) => { if (err.status !== 302) throw err })

  const ax = await axiosAuth({ email, adminMode, password, axiosOpts: createAxiosOpts, directoryUrl: baseUrl }) as AxiosAuthInstance
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}

export const deleteAllEmails = async () => {
  const emails = (await maildevAx.get('/email')).data
  for (const email of emails) {
    await maildevAx.delete(`/email/${email.id}`)
  }
}

export const loginWithOIDC = async (port: number) => {
  const anonymousAx = await axios()

  // request a login from the provider
  const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${port}/login`, { validateStatus: (status: number) => status === 302 })
  const providerAuthUrl = new URL(loginInitial.headers.location)
  // successful login on the provider followed by redirect to our callback url
  const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status: number) => status === 302 })
  const providerAuthRedirect = new URL(loginProvider.headers.location)
  // open our callback url that produces a temporary token to be transformed in a session token by a token_callback url
  const oauthCallback = await anonymousAx(providerAuthRedirect.href, { validateStatus: (status: number) => status === 302 })
  const callbackRedirect = new URL(oauthCallback.headers.location)
  // finally the token_callback url will set cookies and redirect to our final destination
  const tokenCallback = await anonymousAx(callbackRedirect.href, { validateStatus: (status: number) => status === 302 })
  const setCookies = tokenCallback.headers['set-cookie']
  assert.ok(setCookies && setCookies.length >= 3)
  const { CookieJar } = await import('tough-cookie')
  const cookieJar = new CookieJar()
  for (const cookie of setCookies) {
    cookieJar.setCookie(cookie, callbackRedirect.origin)
  }

  anonymousAx.defaults.headers.Cookie = await cookieJar.getCookieString(callbackRedirect.origin)

  return anonymousAx
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
