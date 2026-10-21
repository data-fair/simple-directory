// Connected applications: a user lists and revokes the OAuth grants they gave to site clients.
// Mounted under /api/users/:userId/oauth-grants. Reading the session makes the scope gate refuse
// scoped sessions; NHI sessions are refused explicitly (their grants are managed by org admins).
import { Router, type Request } from 'express'
import { httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import type { EventLogContext } from '@data-fair/lib-express/events-log.js'
import { reqI18n } from '#i18n'
import { assertNotNhiSession } from '../nhis/service.ts'
import { getGrantRecord, listGrantRecords, revokeGrant } from './grants.ts'

const router = Router({ mergeParams: true })

// mergeParams: the parent path parameter is not in the route's own types
const reqUserId = (req: Request) => (req.params as Record<string, string>).userId

const assertSelfOrAdmin = (req: Request) => {
  assertNotNhiSession(req)
  const session = reqSessionAuthenticated(req)
  if (!session.user.adminMode && session.user.id !== reqUserId(req)) {
    throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  }
}

router.get('', async (req, res) => {
  assertSelfOrAdmin(req)
  const records = await listGrantRecords({ subjectId: reqUserId(req) })
  res.json({
    results: records.filter(r => r.subject.type === 'user').map(r => ({
      id: r._id,
      clientId: r.clientId,
      clientName: r.clientName,
      clientKind: r.clientKind,
      account: r.account,
      scope: r.scope,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      lastUsedAt: r.lastUsedAt
    }))
  })
})

router.delete('/:grantId', async (req, res) => {
  assertSelfOrAdmin(req)
  const record = await getGrantRecord(req.params.grantId)
  if (!record || record.subject.type !== 'user' || record.subject.id !== reqUserId(req)) throw httpError(404, 'grant not found')
  const logContext: EventLogContext = { req }
  await revokeGrant(record._id, 'user', logContext)
  res.status(204).send()
})

export default router
