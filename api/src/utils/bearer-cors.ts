import type { RequestHandler } from 'express'

// CORS for API calls that carry a bearer access token (dashboards on other domains, phase 6b).
// A bearer token is not ambient: the browser never attaches it on its own, a page can only send a
// token it was given. So these calls are open to every origin, without credentials: a cross-origin
// page never reads a response obtained with the user's cookies. Calls without an Authorization
// header get no CORS header at all, as before.
// The authorization server's own endpoints (/api/oauth/*) answer CORS themselves, per client.
const allowedMethods = 'GET, POST, PUT, PATCH, DELETE'
const allowedHeaders = 'Authorization, Content-Type'

const concerned = (path: string) => path.startsWith('/api/') && !path.startsWith('/api/oauth/')

export const bearerCors: RequestHandler = (req, res, next) => {
  if (!req.headers.origin || !concerned(req.path)) return next()
  if (req.method === 'OPTIONS') {
    // preflight: only for a request that will carry an Authorization header
    const requested = (req.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(h => h.trim())
    if (!requested.includes('authorization')) return next()
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': allowedHeaders,
      'Access-Control-Max-Age': '600'
    })
    return res.status(204).end()
  }
  // also on error responses, so the page can tell a 401 or 403 from a network failure
  if (/^bearer(\s|$)/i.test(req.headers.authorization ?? '')) res.set('Access-Control-Allow-Origin', '*')
  next()
}
