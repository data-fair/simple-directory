// The NHI token exchange shared by /api/auth/nhi-token and the JWT bearer grant of the token
// endpoint (RFC 7523). Callers map every NhiExchangeError to their own uniform failure.
import { jwtDurations } from '#config'
import type { Site, User } from '#types'
import storages from '#storages'
import { internalError } from '@data-fair/lib-node/observer.js'
import limiter, { refundLimiter } from '../utils/limiter.ts'
import { siteOwnedByNhiOrg } from '../oauth-server/issuers.ts'
import { verifyAssertion } from './service.ts'
import { ipAllowed } from './ips.ts'

// carries the real reason of a failure, logged server side only
export class NhiExchangeError extends Error {}

// every call consumes a point by caller IP and by client_id up front, so concurrent in-flight
// attempts are counted against the budget
// (clientId is missing only from a malformed client_credentials request, the IP is still counted)
export const consumeNhiLimits = async (clientIp: string, clientId: string | undefined): Promise<boolean> => {
  return !!(await limiter()(clientIp)) && (clientId === undefined || !!(await limiter()(clientId)))
}

// only failures count: a success proves possession of the signing key, which is exactly what
// the limiter guards, so its points are given back. Consume-then-refund (rather than counting
// failures after the fact) keeps concurrent in-flight attempts counted against the budget.
export const refundNhiLimits = async (clientIp: string, clientId: string | undefined): Promise<void> => {
  await Promise.all([refundLimiter(clientIp), clientId !== undefined && refundLimiter(clientId)])
}

// random delay against timing probes, applied to every failure
export const rejectDelay = (): Promise<void> => new Promise(resolve => setTimeout(resolve, Math.random() * 1000))

export const loadExchangeNhi = async (clientId: string, targetSite: Site | undefined, clientIp: string): Promise<User> => {
  const user = await storages.globalStorage.getUser(clientId)
  if (!user?.nhi || user.organizations.length !== 1) throw new NhiExchangeError('unknown or invalid nhi ' + clientId)
  // an OAuth-bound NHI has no key binding: it can only act through OAuth grants
  if (!user.nhi.provider || !user.nhi.subject) throw new NhiExchangeError('nhi without key binding ' + clientId)
  const userOrg = user.organizations[0]
  // the exchange is only valid on the main site or on a site owned by the NHI's own org — a
  // compromised or unrelated site config must not be able to mint a session for an NHI it
  // doesn't own (same department-tolerant ownership comparison as getDefaultUserOrg)
  if (targetSite && !siteOwnedByNhiOrg(targetSite, userOrg)) {
    throw new NhiExchangeError('site not owned by nhi org ' + user.id)
  }
  // optional per-NHI address control: allowedIps gates the exchange itself, so a captured
  // assertion replayed from another network is refused before it is even verified
  if (user.nhi.allowedIps?.length && !ipAllowed(clientIp, user.nhi.allowedIps)) {
    throw new NhiExchangeError(`ip ${clientIp} not in allowedIps for ` + user.id)
  }
  return user
}

// returns the session exp: min(assertion exp, now + jwtDurations.nhiToken)
export const verifyExchangeAssertion = async (user: User, assertion: string, audience: string): Promise<number> => {
  if (!user.nhi?.provider || !user.nhi.subject) throw new NhiExchangeError('not a key bound nhi ' + user.id)
  let assertionPayload
  try {
    assertionPayload = await verifyAssertion(assertion, user.nhi.provider, user.nhi.subject, audience)
  } catch (err: any) {
    throw new NhiExchangeError('assertion rejected for ' + user.id + ': ' + err.message)
  }
  const nowSec = Math.floor(Date.now() / 1000)
  return Math.min(assertionPayload.exp as number, nowSec + jwtDurations.nhiToken)
}

// Guarded on `readonly`, like confirmLog on the password path: a read-only storage cannot record a
// last-logged date, and FileStorage's updateLogged throws SYNCHRONOUSLY — it is not async — so the
// .catch() never attaches and the rejection became a 500 that failed the whole exchange.
// Without the guard an NHI could not obtain a session at all under file storage.
export const updateNhiLogged = (user: User) => {
  if (!storages.globalStorage.readonly) {
    storages.globalStorage.updateLogged(user.id).catch((err: any) => internalError('nhi-update-logged', 'error while updating logged date', err))
  }
}
