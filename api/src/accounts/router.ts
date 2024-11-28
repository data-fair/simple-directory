import config from '#config'
import { reqI18n } from '#i18n'
import storages from '#storages'
import { type Account, type EventLogContext, httpError, mongoPagination, mongoSort, reqSession } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { Router } from 'express'

export type FindAccountsParams = {
  q?: string,
  size: number,
  skip: number,
  sort?: any
}

const router = Router()

// Get the list of users
router.get('', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSession(req)

  const listMode = config.listUsersMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !session.user) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !session.user?.adminMode) return res.send({ results: [], count: 0 })

  const params: FindAccountsParams = { ...mongoPagination(req.query), sort: mongoSort(req.query.sort) }
  if (typeof req.query.q === 'string') params.q = req.query.q
  const types = (typeof req.query.type === 'string') ? req.query.type.split(',') : ['user', 'organization']

  // Only service admins can request to see all field. Other users only see id/name
  if (!session.user?.adminMode) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

  const results: Account[] = []
  let count = 0

  if (types.includes('user')) {
    const users = await storages.globalStorage.findUsers(params)
    for (const user of users.results) {
      results.push({
        type: 'user',
        id: user.id,
        name: user.name
      })
    }
    count += users.count
  }

  if (types.includes('organization')) {
    const organizations = await storages.globalStorage.findOrganizations(params)
    results.length = Math.min(results.length, Math.max(params.size / 2, params.size - organizations.results.length))
    for (const org of organizations.results) {
      if (results.length >= params.size) continue
      results.push({
        type: 'organization',
        id: org.id,
        name: org.name
      })
    }
    count += organizations.count
  }

  eventsLog.info('sd.list-accounts', 'list accounts', logContext)

  res.json({ count, results })
})

export default router
