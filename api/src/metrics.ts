// produces OpenMetrics, compatible with our stats service but also prometheus, etc

import config from '#config'
const promClient = require('prom-client')
const dayjs = require('dayjs')

const orgsGauge = new promClient.Gauge({
  name: 'sd_organizations',
  help: 'Nombre d\'organisations'
})

const usersGauge = new promClient.Gauge({
  name: 'sd_users',
  help: 'Nombre d\'utilisateurs'
})

const loggedUsers24HGauge = new promClient.Gauge({
  name: 'sd_logged_users_24h',
  help: 'Nombre d\'utilisateurs connectés dans les dernières 24 heures'
})

const membersGauge = new promClient.Gauge({
  name: 'sd_members',
  help: 'Nombre de membres par organisation',
  labelNames: ['org', 'role']
})

export default  async (req, res, next) => {
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

  res.set('Content-Type', promClient.register.contentType)
  let result = await promClient.register.metrics()
  result = result.replace('# HELP resource_info', '# HELP resource')
  result = result.replace('# TYPE resource_info gauge', '# TYPE resource info')
  res.send(result)
})
