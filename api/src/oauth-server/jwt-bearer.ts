// RFC 7523 §2.1 JWT bearer grant, answered by SD itself ahead of the provider: the assertion is the
// credential, so it does not fit the provider's client model (one token endpoint auth method per
// client). Same exchange as /api/auth/nhi-token (nhis/exchange.ts), but OAuth errors and no cookies.
import type { Request, Response } from 'express'
import config from '#config'
import { reqIp } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { reqI18n } from '#i18n'
import type { User } from '#types'
import { NhiExchangeError, consumeNhiLimits, refundNhiLimits, loadExchangeNhi, verifyExchangeAssertion, rejectDelay, updateNhiLogged } from '../nhis/exchange.ts'
import { grantedScope } from '../nhis/scopes.ts'
import { type IssuerContext, type ResolvedResource, ResourceError, resolveResource, nhiMayTarget } from './issuers.ts'
import { sdClaims, signAccessToken, stripOidcScopes, oauthError } from './access-token.ts'

export const jwtBearerGrantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer'

export const handleJwtBearerGrant = async (req: Request, res: Response, ctx: IssuerContext): Promise<void> => {
  const logContext: EventLogContext = { req }
  if (!req.is('application/x-www-form-urlencoded')) {
    return oauthError(res, 400, 'invalid_request', 'only application/x-www-form-urlencoded bodies are accepted')
  }
  if (!config.manageNhis) return oauthError(res, 400, 'unsupported_grant_type')
  const { client_id: clientId, assertion, scope, resource } = req.body ?? {}
  // a repeated parameter is parsed as an array, and OAuth parameters must not be repeated
  if (typeof clientId !== 'string' || !clientId) return oauthError(res, 400, 'invalid_request', 'client_id is required')
  if (typeof assertion !== 'string' || !assertion) return oauthError(res, 400, 'invalid_request', 'assertion is required')
  if (scope !== undefined && typeof scope !== 'string') return oauthError(res, 400, 'invalid_request', 'scope must not be repeated')
  if (resource !== undefined && typeof resource !== 'string') return oauthError(res, 400, 'invalid_target', 'a single resource is accepted')

  // reqIp throws when the reverse-proxy left no usable X-Forwarded-For, before any lookup (no oracle)
  const clientIp = reqIp(req)
  if (!await consumeNhiLimits(clientIp, clientId)) {
    eventsLog.warn('sd.auth.nhi.rate-limit', 'rate limit error for the jwt bearer grant', logContext)
    return oauthError(res, 429, 'invalid_request', reqI18n(req).messages.errors.rateLimitAuth)
  }

  let target: ResolvedResource
  try {
    target = await resolveResource(ctx, resource)
  } catch (err) {
    if (err instanceof ResourceError) return oauthError(res, 400, 'invalid_target')
    throw err
  }

  let user: User
  let exp: number
  try {
    user = await loadExchangeNhi(clientId, target.site, clientIp)
    // an identity check, so part of the uniform invalid_grant (an unknown resource was invalid_target above)
    if (!nhiMayTarget(user.organizations[0], target)) throw new NhiExchangeError('site not owned by the nhi organization ' + user.id)
    // same audience as /nhi-token on the issuer site
    exp = await verifyExchangeAssertion(user, assertion, ctx.siteUrl)
  } catch (err) {
    if (!(err instanceof NhiExchangeError)) throw err
    // uniform failure: same status/body whatever the cause, random delay against timing probes
    eventsLog.warn('sd.auth.nhi.fail', `nhi jwt bearer grant failed: ${err.message}`, logContext)
    await rejectDelay()
    return oauthError(res, 400, 'invalid_grant')
  }
  const nowSec = Math.floor(Date.now() / 1000)

  // the caller is authenticated, so a precise error is not an oracle; not refunded (as /nhi-token)
  let granted: string | undefined
  try {
    granted = grantedScope(user.nhi!.scopes, stripOidcScopes(scope) || undefined)
  } catch (err: any) {
    if (err.status === 400) return oauthError(res, 400, 'invalid_scope', err.message.replace(/^invalid_scope: /, ''))
    throw err
  }

  const boundIp = user.nhi!.ipBinding ? clientIp : undefined
  const claims = sdClaims(user, target, { scope: granted, boundIp })
  const accessToken = await signAccessToken({ ...claims, iss: ctx.issuer, sub: user.id, client_id: user.id, aud: target.audience }, exp)

  await refundNhiLimits(clientIp, clientId)
  updateNhiLogged(user)
  eventsLog.info('sd.auth.nhi.ok', `an NHI access token was issued for ${user.id} by the jwt bearer grant`, logContext)
  res.set('Cache-Control', 'no-store')
  res.send({ access_token: accessToken, token_type: 'Bearer', expires_in: exp - nowSec, ...(granted !== undefined ? { scope: granted } : {}) })
}
