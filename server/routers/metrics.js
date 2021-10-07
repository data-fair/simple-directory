// produces OpenMetrics, compatible with our stats service but also prometheus, etc

const config = require('config')
const promClient = require('prom-client')
const dayjs = require('dayjs')
const asyncWrap = require('../utils/async-wrap')

const orgsGauge = new promClient.Gauge({
  name: 'organizations',
  help: 'Nombre d\'organisations',
})

const usersGauge = new promClient.Gauge({
  name: 'users',
  help: 'Nombre d\'utilisateurs',
})

const loggedUsers24HGauge = new promClient.Gauge({
  name: 'loggedUsers24H',
  help: 'Nombre d\'utilisateurs connectés dans les dernières 24 heures',
})

const membersGauge = new promClient.Gauge({
  name: 'members',
  help: 'Nombre de membres par organisation',
  labelNames: ['org'],
})

const loggedMembers24HGauge = new promClient.Gauge({
  name: 'loggedMembers24H',
  help: 'Nombre de membres connectés dans les dernières 24 heures par organisation',
  labelNames: ['org'],
})

module.exports = asyncWrap(async (req, res, next) => {
  if (req.query.apiKey !== config.secretKeys.metrics) return res.status(401).send()
  const storage = req.app.get('storage')
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
    membersGauge.set(
      { org: org._id },
      await db.collection('users').countDocuments({ 'organizations.id': org._id }),
    )
    loggedMembers24HGauge.set(
      { org: org._id },
      await db.collection('users').countDocuments({
        'organizations.id': org._id,
        logged: { $gt: dayjs().subtract(1, 'days').toDate() },
      }),
    )
  }

  res.set('Content-Type', promClient.register.contentType)
  let result = await promClient.register.metrics()
  result = result.replace('# HELP resource_info', '# HELP resource')
  result = result.replace('# TYPE resource_info gauge', '# TYPE resource info')
  res.send(result)
})
