import type { RequestHandler } from 'express'
import { assertReqScope, markScopeChecked } from '@data-fair/lib-express'

// Deny by default: a scope-restricted session (an NHI token issued with scopes) only reaches the
// routes listed here, whatever the role of its identity. Unrestricted sessions are not concerned.
// Adding a route here is a security decision: list the scopes that grant it.
const organizationsRead = ['organizations:read', 'organizations']

type Rule = { method: 'GET' | '*', path: RegExp, scopes: string[] | 'any' }
const rules: Rule[] = [
  // the session machinery itself: exchange, keepalive, logout
  { method: '*', path: /^\/api\/auth\//, scopes: 'any' },
  // public keys and the UI shell carry no account data
  { method: 'GET', path: /^\/\.well-known\//, scopes: 'any' },
  { method: 'GET', path: /^\/(?!api\/)/, scopes: 'any' },
  { method: 'GET', path: /^\/api\/avatars\//, scopes: 'any' },
  // the list, one organization, its roles, its members
  { method: 'GET', path: /^\/api\/organizations(\/[^/]+(\/roles|\/members)?)?$/, scopes: organizationsRead },
  { method: 'GET', path: /^\/api\/accounts$/, scopes: organizationsRead }
]

// runs once per request, before every router: it is the scope check of every SD route (the lib
// refuses scoped sessions on routes that were not marked, cf lib-express assertReqScope)
export const scopeGate: RequestHandler = (req, _res, next) => {
  const rule = rules.find(r => (r.method === '*' || r.method === req.method) && r.path.test(req.path))
  // a route not listed is left unmarked: the lib refuses a scoped session (403) as soon as the
  // route reads the session, and a route that never reads it only serves public content
  if (!rule) return next()
  if (rule.scopes === 'any') markScopeChecked(req)
  else assertReqScope(req, rule.scopes)
  next()
}
