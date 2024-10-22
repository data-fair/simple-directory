import type { OpenIDConnect } from '../../config/type/index.ts'
import oauth2 from 'oauth2'
import { nanoid } from 'nanoid'
import config from '#config'
import mongo from '#mongo'
import { decode } from '../tokens/service.ts'
import standardProviders from './standard-providers.ts'
import { completeOidcProvider } from './oidc.ts'

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

export type OAuthProvider = Omit<OpenIDConnect, 'discovery'> & {
  id: string,
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
  userInfo: (accessToken: string) => Promise<OAuthUserInfo>
}

export type PreparedOAuthProvider = OAuthProvider & {
  state: string
  authorizationUri (relayState: any, email: string, offlineAccess?: boolean): string
  getToken (code: string, offlineAccess?: boolean): Promise<any>
  refreshToken (tokenObj: any, onlyIfExpired: boolean): Promise<any>
}

export async function initOAuthProvider (p: OAuthProvider, publicUrl = config.publicUrl): Promise<PreparedOAuthProvider> {
  const oauthClient = new oauth2.AuthorizationCode({
    client: p.client,
    auth: p.auth
  })

  let state = (await mongo.secrets.findOne({ _id: 'oauth-state-' + p.id }))?.data as string | undefined
  if (!state) {
    state = nanoid()
    await mongo.secrets.insertOne({ _id: 'oauth-state-' + p.id, data: state })
  }

  // standard oauth providers use the old deprecated url callback for retro-compatibility
  const callbackUri = p.oidc ? `${publicUrl}/api/auth/oauth-callback` : `${publicUrl}/api/auth/oauth/${p.id}/callback`

  // dynamically prepare authorization uris for login redirection
  const authorizationUri = (relayState: any, email: string, offlineAccess = false) => {
    let scope = p.scope
    if (offlineAccess) {
      scope += ' offline_access'
    }
    const params: Record<string, string> = {
      redirect_uri: callbackUri,
      scope,
      state: JSON.stringify(relayState),
      display: 'page',
      prompt: 'login' // WARN: if we change that to allow for authentication without prompting for password, we should still use this value in case of adminMode
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
    const scope = p.scope
    /* if (offlineAccess) {
      scope += ' offline_access'
    } */
    const tokenWrap = await oauthClient.getToken({
      code,
      redirect_uri: callbackUri,
      scope,
      client_id: p.client.id,
      client_secret: p.client.secret,
      grant_type: 'authorization_code'
    })
    if (tokenWrap.error) {
      console.error('Bad OAuth code', tokenWrap)
      throw new Error('Bad OAuth code')
    }
    const token = tokenWrap.token
    const decodedRefreshToken = decode(token.refresh_token)
    const offlineRefreshToken = decodedRefreshToken?.typ === 'Offline'
    return { token, offlineRefreshToken }
  }

  const refreshToken = async (tokenObj: any, onlyIfExpired = false) => {
    const token = oauthClient.createToken(tokenObj)
    if (onlyIfExpired && !token.expired()) return null
    const newToken = (await token.refresh({ scope: p.scope })).token
    const decodedRefreshToken = decode(newToken.refresh_token)
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

let initialized = false
const _globalProviders: PreparedOAuthProvider[] = []
export const init = async () => {
  for (const p of standardProviders) {
    _globalProviders.push(await initOAuthProvider(p))
  }
  for (const oidc of config.oidc.providers) {
    _globalProviders.push(await initOAuthProvider(await completeOidcProvider(oidc)))
  }
  initialized = true
}

export const oauthGlobalProviders = () => {
  if (!initialized) throw new Error('Global OAuth providers ware not initialized')
  return _globalProviders
}
