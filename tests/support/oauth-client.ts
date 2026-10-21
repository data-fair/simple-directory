// A scripted OAuth client and browser for the authorization code flow: no redirect is followed
// automatically, every hop is a request of its own so a test can stop or tamper anywhere.
// The browser is an axios instance with a cookie jar (axiosAuth, createUser), it carries the SD
// session and the provider cookies (_interaction, _interaction_resume, _session) across the hops.
import { strict as assert } from 'node:assert'
import { createHash, randomBytes } from 'node:crypto'
import type { AxiosInstance } from 'axios'
import { axios } from './axios.ts'

export const pkcePair = () => {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export const authorizeUrl = (issuer: string, params: Record<string, string | undefined>) => {
  const url = new URL(issuer + '/api/oauth/authorize')
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  return url.href
}

// one browser hop: a GET that never follows redirects and resolves whatever the status
export const browse = (browserAx: AxiosInstance, url: string) =>
  browserAx.get(url, { maxRedirects: 0, validateStatus: () => true })

const location = (res: { status: number, headers: any, data: any }, hop: string) => {
  assert.ok([302, 303].includes(res.status), `${hop}: expected a redirect, got ${res.status} ${typeof res.data === 'string' ? res.data.slice(0, 300) : JSON.stringify(res.data)}`)
  return res.headers.location as string
}

export type CodeFlowOptions = {
  issuer: string,
  clientId: string,
  redirectUri: string,
  scope?: string,
  resource?: string,
  browserAx: AxiosInstance,
  // merged over the default decision: allow, the first proposed account, every proposed scope
  decision?: Record<string, any>,
  extraParams?: Record<string, string | undefined>
}

// authorization request: the provider redirects to the interaction entry (or to the client on error)
export const startAuthorization = async (opts: CodeFlowOptions) => {
  const pkce = pkcePair()
  const state = randomBytes(8).toString('hex')
  const url = authorizeUrl(opts.issuer, {
    client_id: opts.clientId,
    response_type: 'code',
    redirect_uri: opts.redirectUri,
    scope: opts.scope,
    resource: opts.resource,
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
    ...opts.extraParams
  })
  const res = await browse(opts.browserAx, url)
  return { pkce, state, location: location(res, 'authorize') }
}

export const interactionUid = (entryUrl: string) => {
  const match = new URL(entryUrl).pathname.match(/\/api\/oauth\/interaction\/([^/]+)$/)
  assert.ok(match, 'not an interaction entry url: ' + entryUrl)
  return match[1]
}

// the interaction entry, then the consent page url it redirects to: returns the uid
export const openInteraction = async (opts: CodeFlowOptions, entryUrl: string) => {
  const consentUrl = location(await browse(opts.browserAx, entryUrl), 'interaction entry')
  const uid = new URL(consentUrl).searchParams.get('uid')
  assert.ok(uid, 'the interaction entry did not redirect to the consent page: ' + consentUrl)
  return uid
}

export const getDetails = async (opts: CodeFlowOptions, uid: string) =>
  (await opts.browserAx.get(`${opts.issuer}/api/oauth/interaction/${uid}/details`)).data

export const postDecision = (opts: CodeFlowOptions, uid: string, decision: Record<string, any>) =>
  opts.browserAx.post(`${opts.issuer}/api/oauth/interaction/${uid}`, decision, { validateStatus: () => true })

// the provider resumes the authorization and redirects to the client callback
export const resume = async (opts: CodeFlowOptions, redirectTo: string) => {
  const callback = new URL(location(await browse(opts.browserAx, redirectTo), 'resume'))
  assert.equal(callback.origin + callback.pathname, opts.redirectUri, 'resume redirected elsewhere than the client: ' + callback.href)
  return callback
}

export const tokenRequest = (issuer: string, params: Record<string, string | undefined>, headers: Record<string, string> = {}) => {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body.set(key, value)
  }
  return axios().post(issuer + '/api/oauth/token', body.toString(),
    { headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, validateStatus: () => true })
}

export const exchangeCode = (opts: CodeFlowOptions, code: string, verifier: string, headers: Record<string, string> = {}) =>
  tokenRequest(opts.issuer, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: opts.redirectUri,
    client_id: opts.clientId,
    code_verifier: verifier
  }, headers)

// the whole flow with the default decision (or opts.decision), up to the token response
export const runCodeFlow = async (opts: CodeFlowOptions) => {
  const { pkce, state, location: entryUrl } = await startAuthorization(opts)
  const uid = await openInteraction(opts, entryUrl)
  const details = await getDetails(opts, uid)
  const decision = {
    decision: 'allow',
    account: details.accounts[0] && { type: details.accounts[0].type, id: details.accounts[0].id, department: details.accounts[0].department },
    scopes: details.scopes.map((s: any) => s.name),
    ...opts.decision
  }
  const decided = await postDecision(opts, uid, decision)
  assert.equal(decided.status, 200, JSON.stringify(decided.data))
  const callback = await resume(opts, decided.data.redirectTo)
  assert.equal(callback.searchParams.get('state'), state)
  const code = callback.searchParams.get('code')
  assert.ok(code, 'no code in the callback: ' + callback.href)
  const tokenRes = await exchangeCode(opts, code, pkce.verifier)
  assert.equal(tokenRes.status, 200, JSON.stringify(tokenRes.data))
  return { uid, details, code, state, iss: callback.searchParams.get('iss'), tokens: tokenRes.data, verifier: pkce.verifier }
}
