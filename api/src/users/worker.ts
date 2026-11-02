import { type User } from '#types'
import config, { jwtDurations } from '#config'
import cron from 'node-cron'
import { deleteOAuthToken, writeOAuthToken, oauthGlobalProviders, findOfflineOAuthTokens, authProviderMemberInfo, patchCoreAuthUser, deleteIdentityWebhook, setNbMembersLimits, deleteIdentityLimits, sendMailI18n } from '#services'
import log from '@data-fair/lib-node/log.js'
import { defaultLocale, localizedDayjs, messages } from '#i18n'
import locks from '@data-fair/lib-node/locks.js'
import storages from '#storages'
import mongo from '#mongo'
import { cleanupDynamicClients } from '../oauth-server/dynamic-clients.ts'
import { userLogFields } from '../utils/log-fields.ts'

// this single small worker loop doesn't really justify running in separate processes
// we simply run it as part of the api server

let stopped = false
let taskPromise: Promise<void> | undefined

const planDeletion = async (user: User) => {
  const plannedDeletion = localizedDayjs().add(config.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
  await storages.globalStorage.patchUser(user.id, { plannedDeletion })
  log.warn('planned deletion of inactive user', { code: 'sd.cleanup-cron.plan-deletion', ...userLogFields(user) })
  // storage.findInactiveUsers/findUsersToDelete exclude nhi users, so email is always defined here
  const link = config.publicUrl + '/login?email=' + encodeURIComponent(user.email)
  if (user.emailConfirmed || user.logged) {
    // TODO: use a locale stored on the user ?
    await sendMailI18n('plannedDeletion', messages[defaultLocale], user.email, {
      link,
      user: user.name,
      plannedDeletion: localizedDayjs(plannedDeletion).locale(defaultLocale).format('L'),
      cause: messages[defaultLocale].mails.plannedDeletion.causeInactivity.replace('{date}', localizedDayjs(user.logged || user.created?.date).locale(defaultLocale).format('L'))
    })
    log.warn(`sent an email of planned deletion to inactive user ${user.email}`, { code: 'sd.cleanup-cron.inactive.email', ...userLogFields(user) })
  }
}

export const task = async () => {
  if (stopped) return
  try {
    log.info('run user cleanup cron task')
    await locks.acquire('user-deletion-task')
    if (config.cleanup.deleteInactive) {
      for (const user of await storages.globalStorage.findInactiveUsers()) {
        await planDeletion(user)
      }
    }

    const oldSessionsDate = new Date(Date.now() - (jwtDurations.exchangeToken * 1000)).toISOString()
    const oldSessionsFilter = { 'sessions.lastKeepalive': { $lt: oldSessionsDate } }
    const oldSessionsOperator = { $pull: { sessions: { lastKeepalive: { $lt: oldSessionsDate } } } }
    await mongo.users.updateMany(oldSessionsFilter, oldSessionsOperator)
    await mongo.ldapUserSessions.updateMany(oldSessionsFilter, oldSessionsOperator)
    await mongo.fileUserSessions.updateMany(oldSessionsFilter, oldSessionsOperator)

    for (const token of await findOfflineOAuthTokens()) {
      // TODO manage offline tokens from site level providers
      const provider = oauthGlobalProviders().find(p => p.id === token.provider.id)
      const user = await storages.globalStorage.getUser(token.user.id)
      if (!provider) {
        log.warn('offline token for unknown provider', { code: 'cleanup-offline-token-unknown', providerId: token.provider.id, ...userLogFields(token.user) })
      } else if (!user) {
        log.warn('offline token for unknown user', { code: 'cleanup-offline-token-unknown', providerId: token.provider.id, ...userLogFields(token.user) })
      } else {
        try {
          const refreshedToken = await provider.refreshToken(token.token)
          const { newToken, offlineRefreshToken } = refreshedToken
          const userInfo = await provider.userInfo(newToken.access_token, newToken.id_token)
          const memberInfos = await authProviderMemberInfo(undefined, provider, userInfo)
          await patchCoreAuthUser(provider, user, userInfo, memberInfos)
          await writeOAuthToken(user, provider, newToken, offlineRefreshToken, token.loggedOut, token.site, token)
          log.info(`a user refreshed their info from their core identity provider ${provider.id}`, { code: 'sd.cleanup-cron.offline-token.refresh-ok', ...userLogFields(user) })
        } catch (err: any) {
          if (err?.data?.payload?.error === 'invalid_grant') {
            await deleteOAuthToken(user, provider, token.site)
            log.warn(`deleted invalid offline token for user ${user.id} and provider ${provider.id}`, { code: 'sd.cleanup-cron.offline-token.delete', ...userLogFields(user) })
            await planDeletion(user)
          } else {
            log.error('failed to refresh an offline oauth token in the cleanup task', { code: 'cleanup-refresh-token', err })
          }
        }
      }
    }

    for (const user of await storages.globalStorage.findUsersToDelete()) {
      await storages.globalStorage.deleteUser(user.id)
      log.warn('deleted user', { code: 'sd.cleanup-cron.delete', ...userLogFields(user) })
      await setNbMembersLimits(user.organizations.map(o => o.id))
      await deleteIdentityLimits('user', user.id)
      deleteIdentityWebhook('user', user.id)
    }
    // its own failure must not stop the user cleanup
    try {
      await cleanupDynamicClients()
    } catch (err) {
      log.error('failed to clean up the dynamic oauth clients', { code: 'cleanup-oauth-clients', err })
    }
    await locks.release('user-deletion-task')
    log.info('user cleanup cron task done')
  } catch (err) {
    log.error('user cleanup task failed', { code: 'cleanup-cron', err })
  }
}

export const start = () => {
  cron.schedule(config.cleanup.cron, async () => {
    if (taskPromise) {
      log.warn('cleanup task already running', { code: 'cleanup-cron-overlap' })
    } else {
      taskPromise = task()
      taskPromise.then(() => { taskPromise = undefined })
    }
  })
}

export const stop = async () => {
  stopped = true
  if (taskPromise) await taskPromise
}
