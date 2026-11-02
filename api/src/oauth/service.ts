import type { Request } from 'express'
import type { OpenIDConnect, OpenIDConnect1 } from '../../config/type/index.ts'
import { reqSiteUrl } from '@data-fair/lib-express'
import oauth2 from 'simple-oauth2'
import { httpAgent, httpsAgent } from '@data-fair/lib-node/http-agents.js'
import { nanoid } from 'nanoid'
import config from '#config'
import mongo from '#mongo'
import standardProviders from './standard-providers.ts'
import { completeOidcProvider, getOidcProviderId } from './oidc.ts'
import { reqSite, decodeToken } from '#services'
import { type CipheredContent, decipher } from '../utils/cipher.ts'
import type { LogFields } from '../utils/log-fields.ts'

export { getOidcProviderId } from './oidc.ts'

// public agents for the token requests of untrusted providers. simple-oauth2 deep clones its http
// options with @hapi/hoek, which would copy the agents and their pooled sockets: a copied keep-alive
// socket fails with "Illegal invocation" when it is reused. Hoek does not clone an object whose
// prototype is marked isImmutable, so the shared agents are passed as they are.
const publicWreckAgents = Object.assign(Object.create({ isImmutable: true }), { http: httpAgent, https: httpsAgent, httpsAllowUnauthorized: httpsAgent })

export type OAuthUserInfo = {
  data: any,
  user: {
    email: string,
    name?: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string
  },
  id: string,
  url?: string
}

export type OAuthProvider = Omit<OpenIDConnect, 'discovery' | 'type'> & {
  id: string,
  type: 'oauth' | 'oidc',
  oidc?: boolean,
  title?: string,
  icon?: string,
  scope: string,
  // operator-declared provider (config.oidc.providers), its endpoints may be on a private network
  trusted?: boolean,
  // oidc providers only
  clientId?: string,
  issuer?: string,
  jwksUri?: string,
  endSessionEndpoint?: string,
  issParameterSupported?: boolean,
  strict?: boolean,
  rpInitiatedLogout?: boolean,
  auth: {
    tokenHost: string,
    tokenPath: string,
    authorizeHost?: string,
    authorizePath: string
  },
  // logFields is passed by the interactive login routes so that email-verification refusals emit
  // alert lines (sd.oidc.email-not-verified / sd.oauth.email-not-verified), the request context
  // comes from the implicit log context. Omit it in background paths that have no request (e.g.
  // the token-refresh worker): they do not log these refusals.
  userInfo: (accessToken: string, id_token?: string, logFields?: LogFields, idTokenClaims?: Record<string, any>) => Promise<OAuthUserInfo>,
  // oidc providers only: verified claims of the id_token, or the decoded ones if the policy of the provider lets a failure through
  validateIdToken?: (idToken: string, nonce?: string, logFields?: LogFields) => Promise<Record<string, any>>,
  // oidc providers only: OIDC Back-Channel Logout 1.0, resolves the session and subject the token ends
  validateLogoutToken?: (logoutToken: string, logFields?: LogFields) => Promise<{ sid?: string, sub?: string }>
}

export type PreparedOAuthProvider = OAuthProvider & {
  state: string
  authorizationUri (relayState: string, email: string, offlineAccess?: boolean, forceLogin?: boolean, nonce?: string, codeChallenge?: string): string
  getToken (code: string, codeVerifier?: string): Promise<any>
  refreshToken (tokenObj: any): Promise<any>
}

export type OAuthRelayState = {
  _id: string,
  createdAt: Date,
  providerState: string,
  redirect: string,
  org?: string,
  dep?: string,
  invitToken?: string,
  adminMode?: boolean,
  // OIDC only, echoed by the provider in the id_token and checked in the callback
  nonce?: string,
  // sha256 of the secret held by the browser that started the login (cf auth/login-binding.ts)
  bindingHash?: string,
  // PKCE
  codeVerifier?: string,
  // set when the callback consumed this relay state, it can be used only once
  usedAt?: Date,
  // RP-initiated logout: kept from the callback until token_callback moves it to the server session
  idToken?: string,
  idpProviderId?: string,
  idpSite?: string
}

export const getOAuthProviderById = async (req: Request, id: string): Promise<PreparedOAuthProvider | undefined> => {
  const site = await reqSite(req)
  if (!site) {
    return oauthGlobalProviders().find(p => p.id === id)
  } else {
    const providerInfo = site.authProviders?.find(p => p.type === 'oidc' && getOidcProviderId(p.discovery) === id) as OpenIDConnect1
    return await initOidcProvider(providerInfo, reqSiteUrl(req) + '/simple-directory')
  }
}

export const getOAuthProviderByState = async (req: Request, state: string): Promise<PreparedOAuthProvider | undefined> => {
  const site = await reqSite(req)
  if (!site) {
    return oauthGlobalProviders().find(p => p.state === state)
  } else {
    for (const providerInfo of site.authProviders ?? []) {
      if (providerInfo.type === 'oidc') {
        const p = await initOidcProvider(providerInfo, reqSiteUrl(req) + '/simple-directory')
        if (p.state === state) return p
      }
    }
  }
}

async function initOAuthProvider (p: OAuthProvider, publicUrl = config.publicUrl): Promise<PreparedOAuthProvider> {
  const client = { id: p.client.id, secret: decipher(p.client.secret as CipheredContent) }
  const oauthClient = new oauth2.AuthorizationCode({
    client,
    auth: p.auth,
    options: {
      credentialsEncodingMode: p.credentialsEncodingMode ?? 'strict', // strict or loose
      // header or body: oidc providers arrive with the value resolved by completeOidcProvider (config, else discovery),
      // the fallback only serves the standard oauth providers
      authorizationMethod: p.authorizationMethod ?? 'header',
      bodyFormat: p.bodyFormat ?? 'form'
    },
    // the token endpoint of an untrusted provider comes from a site config or a discovery document,
    // the public agents refuse to connect to non public addresses (cf SSRF_PUBLIC_IPS)
    // wreck's "agents" defaults option is missing from the simple-oauth2 typings, which only know the per request "agent"
    http: p.trusted ? undefined : { agents: publicWreckAgents } as any
  })

  let state = (await mongo.secrets.findOne({ _id: 'oauth-state-' + p.id }))?.data as string | undefined
  if (!state) {
    state = nanoid()
    await mongo.secrets.insertOne({ _id: 'oauth-state-' + p.id, data: state })
  }

  // standard oauth providers use the old deprecated url callback for retro-compatibility
  const callbackUri = p.oidc ? `${publicUrl}/api/auth/oauth-callback` : `${publicUrl}/api/auth/oauth/${p.id}/callback`

  // dynamically prepare authorization uris for login redirection
  const authorizationUri = (relayState: string, email: string, offlineAccess = false, forceLogin = false, nonce?: string, codeChallenge?: string) => {
    let scope = p.scope
    if (offlineAccess) {
      scope += ' offline_access'
    }
    const params: Record<string, string> = {
      redirect_uri: callbackUri,
      scope,
      state: relayState
    }
    if (nonce) {
      params.nonce = nonce
    }
    if (codeChallenge) {
      params.code_challenge = codeChallenge
      params.code_challenge_method = 'S256'
    }
    if (forceLogin) {
      params.prompt = 'login'
    }
    if (email && p.loginHintMode !== 'none') {
      // send email in login_hint
      // see https://openid.net/specs/openid-connect-basic-1_0.html
      params.login_hint = p.loginHintMode === 'username' ? email.split('@')[0] : email
    }
    const url = oauthClient.authorizeURL(params)
    return url
  }

  // get an access token from code sent as callback to login redirect
  const getToken = async (code: string, codeVerifier?: string) => {
    const tokenWrap = await oauthClient.getToken({
      code,
      redirect_uri: callbackUri,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {})
    })
    const token = tokenWrap.token
    const decodedRefreshToken = decodeToken(token.refresh_token as string)
    const offlineRefreshToken = decodedRefreshToken?.typ === 'Offline'
    return { token, offlineRefreshToken }
  }

  const refreshToken = async (tokenObj: any) => {
    const token = oauthClient.createToken(tokenObj)
    // if (onlyIfExpired && !token.expired()) return null
    const newToken = (await token.refresh()).token
    const decodedRefreshToken = decodeToken(newToken.refresh_token as string)
    const offlineRefreshToken = decodedRefreshToken?.typ === 'Offline'
    return { newToken, offlineRefreshToken }
  }

  return {
    state,
    ...p,
    authorizationUri,
    getToken,
    refreshToken
  }
}

export async function initOidcProvider (providerInfo: OpenIDConnect, publicUrl = config.publicUrl) {
  return await initOAuthProvider(await completeOidcProvider(providerInfo), publicUrl)
}

let initialized = false
const _globalProviders: PreparedOAuthProvider[] = []
export const init = async () => {
  for (const p of standardProviders) {
    _globalProviders.push(await initOAuthProvider(p))
  }
  for (const oidc of config.oidc.providers) {
    if (typeof oidc.client.secret === 'string' && oidc.client.secret.startsWith('env:')) {
      const envKey = oidc.client.secret.slice(4)
      const envSecret = process.env[envKey]
      if (!envSecret) throw new Error(`Missing environment variable ${envKey} for OIDC provider ${oidc.title}`)
      oidc.client.secret = envSecret
    }
    _globalProviders.push(await initOAuthProvider(await completeOidcProvider(oidc, true)))
  }
  initialized = true
}

export const oauthGlobalProviders = () => {
  if (!initialized) throw new Error('Global OAuth providers ware not initialized')
  return _globalProviders
}
