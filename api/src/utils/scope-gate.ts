import type { RequestHandler } from 'express'
import { assertReqScope, markScopeChecked } from '@data-fair/lib-express'

// Deny by default: a scope-restricted session (an NHI token issued with scopes) only reaches the
// routes listed here, whatever the role of its identity. Unrestricted sessions are not concerned.
// Adding a route here is a security decision: list the scopes that grant it.
//
// Paths are matched lowercased (express routes case-insensitively, so /API/... reaches the API
// router) and exactly (anchored regexes): keep every regex lowercase and anchored.
const organizationsRead = ['organizations:read', 'organizations']

type Rule = { method: 'GET' | 'POST' | 'DELETE', path: RegExp, scopes: string[] | 'any' }
const rules: Rule[] = [
  // session machinery a scoped session needs: keepalive (inert), logout (lib-vue calls DELETE
  // /api/auth without trailing slash), who am I. Nothing else under /api/auth.
  { method: 'POST', path: /^\/api\/auth\/keepalive\/?$/, scopes: 'any' },
  { method: 'DELETE', path: /^\/api\/auth\/?$/, scopes: 'any' },
  { method: 'GET', path: /^\/api\/auth\/me\/?$/, scopes: 'any' },
  { method: 'GET', path: /^\/api\/auth\/my-session\/?$/, scopes: 'any' },
  // the token exchange itself, authenticated by the assertion, not by a session
  { method: 'POST', path: /^\/api\/auth\/nhi-token\/?$/, scopes: 'any' },
  // public keys carry no account data
  { method: 'GET', path: /^\/\.well-known\//, scopes: 'any' },
  // the UI shell: everything that is not the API (api itself excluded, whatever the case)
  { method: 'GET', path: /^\/(?!api(\/|$))/, scopes: 'any' },
  { method: 'GET', path: /^\/api\/avatars\//, scopes: 'any' },
  // the sites of its own account (the route refuses another account's): public configuration
  // every visitor of those sites sees, read by the agents service to know an agent's portals
  { method: 'GET', path: /^\/api\/sites\/?$/, scopes: 'any' },
  // the list, one organization, its roles, its members
  { method: 'GET', path: /^\/api\/organizations(\/[^/]+(\/roles|\/members)?)?\/?$/, scopes: organizationsRead }
]

// runs once per request, before every router: it is the scope check of every SD route (the lib
// refuses scoped sessions on routes that were not marked, cf lib-express assertReqScope)
export const scopeGate: RequestHandler = (req, _res, next) => {
  const path = req.path.toLowerCase()
  const rule = rules.find(r => r.method === req.method && r.path.test(path))
  // a route not listed is left unmarked: the lib refuses a scoped session (403) as soon as the
  // route reads the session, and a route that never reads it only serves public content
  if (!rule) return next()
  if (rule.scopes === 'any') markScopeChecked(req)
  else assertReqScope(req, rule.scopes)
  next()
}
