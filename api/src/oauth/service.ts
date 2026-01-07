import type { Request } from 'express'
import type { OpenIDConnect } from '../../config/type/index.ts'
import { reqSiteUrl } from '@data-fair/lib-express'
import oauth2 from 'simple-oauth2'
import { nanoid } from 'nanoid'
import config from '#config'
import mongo from '#mongo'
import standardProviders from './standard-providers.ts'
import { completeOidcProvider, getOidcProviderId } from './oidc.ts'
import { reqSite, decodeToken } from '#services'
import { type OpenIDConnect1 } from '../../config/type/index.ts'
import { type CipheredContent, decipher } from '../utils/cipher.ts'

export { getOidcProviderId } from './oidc.ts'

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
  auth: {
    tokenHost: string,
    tokenPath: string,
    authorizeHost?: string,
    authorizePath: string
  },
  userInfo: (accessToken: string, id_token?: string) => Promise<OAuthUserInfo>
}

export type PreparedOAuthProvider = OAuthProvider & {
  state: string
  authorizationUri (relayState: string, email: string, offlineAccess?: boolean, forceLogin?: boolean): string
  getToken (code: string, offlineAccess?: boolean): Promise<any>
  refreshToken (tokenObj: any): Promise<any>
}

export type OAuthRelayState = {
  _id: string,
  createdAt: Date,
  providerState: string,
  loginReferer?: string,
  redirect: string,
  org?: string,
  dep?: string,
  invitToken?: string,
  adminMode?: boolean
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
      authorizationMethod: p.authorizationMethod ?? 'header', // header or body
      bodyFormat: p.bodyFormat ?? 'form'
    }
  })

  let state = (await mongo.secrets.findOne({ _id: 'oauth-state-' + p.id }))?.data as string | undefined
  if (!state) {
    state = nanoid()
    await mongo.secrets.insertOne({ _id: 'oauth-state-' + p.id, data: state })
  }

  // standard oauth providers use the old deprecated url callback for retro-compatibility
  const callbackUri = p.oidc ? `${publicUrl}/api/auth/oauth-callback` : `${publicUrl}/api/auth/oauth/${p.id}/callback`

  // dynamically prepare authorization uris for login redirection
  const authorizationUri = (relayState: string, email: string, offlineAccess = false, forceLogin = false) => {
    let scope = p.scope
    if (offlineAccess) {
      scope += ' offline_access'
    }
    const params: Record<string, string> = {
      redirect_uri: callbackUri,
      scope,
      state: relayState,
      display: 'page'
    }
    if (forceLogin) {
      params.prompt = 'login'
    }
    if (email) {
      // send email in login_hint
      // see https://openid.net/specs/openid-connect-basic-1_0.html
      params.login_hint = email
    }
    const url = oauthClient.authorizeURL(params)
    return url
  }

  // get an access token from code sent as callback to login redirect
  const getToken = async (code: string, offlineAccess = false) => {
    const tokenWrap = await oauthClient.getToken({
      code,
      redirect_uri: callbackUri
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
    _globalProviders.push(await initOAuthProvider(await completeOidcProvider(oidc)))
  }
  initialized = true
}

export const oauthGlobalProviders = () => {
  if (!initialized) throw new Error('Global OAuth providers ware not initialized')
  return _globalProviders
}
