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

export const clean = async () => {
  const ax = axiosBuilder()
  await ax.delete(`${devApiUrl}/api/test-env`)
}

// Apply config overrides on the running dev server
export const patchConfig = async (overrides: Record<string, any>) => {
  const ax = axiosBuilder()
  await ax.patch(`${devApiUrl}/api/test-env/config`, overrides)
}

// Seed predefined users and organizations from JSON files into mongo
// Call this after clean() for tests that need the predefined file-storage users
export const seed = async () => {
  const ax = axiosBuilder()
  await ax.post(`${devApiUrl}/api/test-env/seed`)
}

export const createUser = async (email: string, adminMode = false, password = 'TestPasswd01', _directoryUrl?: string) => {
  const baseUrl = _directoryUrl ?? directoryUrl
  const createAxiosOpts = { baseURL: baseUrl }
  const anonymAx = await axios(createAxiosOpts)
  await anonymAx.post('/api/users', { email, password })

  // poll maildev REST API for the confirmation mail
  const maildevUrl = `http://localhost:${process.env.MAILDEV_UI_PORT}`
  const mailAx = axiosBuilder()
  let mail: any
  for (let i = 0; i < 100; i++) {
    const res = await mailAx.get(`${maildevUrl}/email`)
    const emails = res.data
    mail = emails.find((m: any) => {
      const to = m.to?.[0]?.address || m.headers?.to
      const matchesEmail = to === email || (typeof to === 'string' && to.includes(email))
      // filter for confirmation mails only (not invitation mails)
      const html = m.html || m.text || ''
      const isConfirmation = html.includes('token_callback')
      return matchesEmail && isConfirmation
    })
    if (mail) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(mail, `no confirmation mail received for ${email}`)

  // extract token_callback link from mail HTML
  const html: string = mail.html || mail.text
  const linkMatch = html.match(/href="([^"]*token_callback[^"]*)"/)
  assert.ok(linkMatch, 'no token_callback link found in mail')
  const link = linkMatch[1].replace(/&amp;/g, '&')

  // follow the link to confirm the user
  await anonymAx(link).catch((err: any) => { if (err.status !== 302) throw err })

  // delete the processed mail from maildev
  await mailAx.delete(`${maildevUrl}/email/${mail.id}`)

  const ax = await axiosAuth({ email, adminMode, password, axiosOpts: createAxiosOpts, directoryUrl: baseUrl }) as AxiosAuthInstance
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}

// Update arbitrary fields on a user document via the test-env API
export const patchUser = async (email: string, fields: Record<string, any>) => {
  const ax = axiosBuilder()
  await ax.patch(`${devApiUrl}/api/test-env/user/${encodeURIComponent(email)}`, fields)
}

// Clear the getSiteByHost memoized cache on the running server
export const clearSiteCache = async () => {
  const ax = axiosBuilder()
  await ax.post(`${devApiUrl}/api/test-env/clear-site-cache`)
}

export const getAllEmails = async () => {
  const ax = axiosBuilder()
  return (await ax.get(`http://localhost:${process.env.MAILDEV_UI_PORT}/email`)).data
}

export const deleteAllEmails = async () => {
  const ax = axiosBuilder()
  const emails = (await ax.get(`http://localhost:${process.env.MAILDEV_UI_PORT}/email`)).data
  for (const email of emails) {
    await ax.delete(`http://localhost:${process.env.MAILDEV_UI_PORT}/email/${email.id}`)
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
