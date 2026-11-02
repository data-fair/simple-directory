// Explicit log fields, same names as in data-fair (see docs/architecture/logging.md).
// The actor (ip, host, userId, userName, accountKey, accountDep, accountName) comes from the implicit
// log context opened by session.middleware(); userLogFields overrides it when the user is known
// but not in the session (yet), e.g. during a login. The organization an event is about is a
// different notion and uses the owner* names.
// Config-free on purpose.
import type { LogContext } from '@data-fair/lib-node/log.js'

// mutable bag of explicit fields, filled along a route as the user / owner become known
export type LogFields = LogContext

export type UserLike = { id: string, name?: string }
export type AccountLike = { type: string, id: string, name?: string, department?: string }

// no user (e.g. unknown email at login): nothing to override, the line keeps the context's actor
export function userLogFields (user: UserLike | undefined): { userId?: string, userName?: string } {
  if (!user) return {}
  return { userId: user.id, userName: user.name || undefined }
}

// the 3 keys are always present, possibly undefined: assigned over a previous owner they override
// all its values, and pino drops undefined values from the line
export function ownerLogFields (owner: AccountLike): { ownerKey: string, ownerDep: string | undefined, ownerName: string | undefined } {
  return { ownerKey: owner.type + '.' + owner.id, ownerDep: owner.department || undefined, ownerName: owner.name || undefined }
}

export function orgLogFields (org: { id: string, name?: string }, department?: string) {
  return ownerLogFields({ type: 'organization', id: org.id, name: org.name, department })
}
