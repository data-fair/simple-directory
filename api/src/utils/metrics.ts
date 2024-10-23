import mongo from '#mongo'
import { Gauge } from 'prom-client'
import { servicePromRegistry } from '@data-fair/lib-node/observer.js'

export const init = async () => {
  // global metrics based on db connection
  // eslint-disable-next-line no-new
  new Gauge({
    name: 'df_sd_users_total',
    help: 'Total number of users',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.users.estimatedDocumentCount())
    }
  })

  // eslint-disable-next-line no-new
  new Gauge({
    name: 'df_sd_orgs_total',
    help: 'Total number of organizations',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.organizations.estimatedDocumentCount())
    }
  })
}

/*
// produces OpenMetrics, compatible with our stats service but also prometheus, etc

import type { Request, Response, NextFunction } from 'express'
import config from '#config'
import {Gauge} from 'prom-client'
import dayjs from 'dayjs'

const orgsGauge = new Gauge({
  name: 'sd_organizations',
  help: 'Nombre d\'organisations'
})

const usersGauge = new Gauge({
  name: 'sd_users',
  help: 'Nombre d\'utilisateurs'
})

const loggedUsers24HGauge = new Gauge({
  name: 'sd_logged_users_24h',
  help: 'Nombre d\'utilisateurs connectés dans les dernières 24 heures'
})

const membersGauge = new Gauge({
  name: 'sd_members',
  help: 'Nombre de membres par organisation',
  labelNames: ['org', 'role']
})

export default  async (req: Request, res: Response, next: NextFunction) => {
  if (!config.secretKeys.metrics || req.query.apiKey !== config.secretKeys.metrics) return res.status(401).send()
  const storage = storages.globalStorage
  if (!storage.db) return res.status(404).send('no metrics for this storage mode')
  const db = storage.db

  // count all organizations
  orgsGauge.set(await db.collection('organizations').countDocuments())

  // count all users
  usersGauge.set(await db.collection('users').countDocuments())

  // count all users logged in the last 24 hours
  loggedUsers24HGauge.set(await db.collection('users')
    .countDocuments({ logged: { $gt: dayjs().subtract(1, 'days').toDate() } }))

  // some metrics that grouped by organization
  for await (const org of db.collection('organizations').find()) {
    for (const role of config.roles.defaults) {
      membersGauge.set(
        { org: org._id, role },
        await db.collection('users').countDocuments({ organizations: { $elemMatch: { id: org._id, role } } })
      )
    }
  }
})

*/
