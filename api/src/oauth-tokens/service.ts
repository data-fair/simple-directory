import type { User, OAuthToken } from '#types'
import mongo from '#mongo'

export async function writeOAuthToken (user: User, provider: any, token: any, offlineRefreshToken: boolean, loggedOut?: Date) {
  const tokenInfo: OAuthToken = {
    user: { id: user.id, email: user.email, name: user.name },
    provider: { id: provider.id, type: provider.type, title: provider.title },
    token
  }
  if (offlineRefreshToken) tokenInfo.offlineRefreshToken = true
  if (loggedOut) tokenInfo.loggedOut = loggedOut
  await mongo.oauthTokens
    .replaceOne({ 'user.id': user.id, 'provider.id': provider.id }, tokenInfo, { upsert: true })
}

export async function readOAuthToken (user: User, provider: any) {
  return mongo.oauthTokens.findOne({ 'user.id': user.id, 'provider.id': provider.id })
}

export async function deleteOAuthToken (user: User, provider: any) {
  await mongo.oauthTokens.deleteOne({ 'user.id': user.id, 'provider.id': provider.id })
}

export async function readOAuthTokens () {
  const tokens = await mongo.oauthTokens.find().limit(10000).project({
    user: 1,
    'token.expires_at': 1,
    'token.session_state': 1,
    offlineRefreshToken: 1,
    provider: 1,
    loggedOut: 1
  }).toArray()
  return {
    count: tokens.length,
    results: tokens
  }
}

export async function findOfflineOAuthTokens () {
  const tokens = await mongo.oauthTokens.find({ offlineRefreshToken: true }).limit(10000).toArray()
  return tokens
}

export async function logoutOAuthToken (sid: string) {
  await mongo.oauthTokens.updateOne({ 'token.session_state': sid }, { $set: { loggedOut: new Date() } })
}
