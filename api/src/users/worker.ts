import { type User } from '#types'
import config from '#config'
import cron from 'node-cron'
import { deleteOAuthToken, writeOAuthToken } from '../oauth-tokens/service.ts'
import { internalError } from '@data-fair/lib-node/observer.js'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { defaultLocale, localizedDayjs, messages } from '#i18n'
import { sendMail } from '../mails/service.ts'
import * as locks from '@data-fair/lib-node/locks.js'
import storages from '#storages'
import { oauthGlobalProviders } from '../oauth/service.ts'
import { findOfflineOAuthTokens } from '../oauth-tokens/service.ts'
import { authCoreProviderMemberInfo, patchCoreOAuthUser } from '../auth/service.ts'
import { deleteIdentity } from '../webhooks.ts'

// this single small worker loop doesn't really justify running in separate processes
// we simply run it as part of the api server

let stopped = false
let taskPromise: Promise<void> | undefined

const planDeletion = async (user: User) => {
  const plannedDeletion = localizedDayjs().add(config.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
  await storages.globalStorage.patchUser(user.id, { plannedDeletion })
  eventsLog.warn('sd.cleanup-cron.plan-deletion', 'planned deletion of inactive user', { user })
  const link = config.publicUrl + '/login?email=' + encodeURIComponent(user.email)
  if (user.emailConfirmed || user.logged) {
    // TODO: use a locale stored on the user ?
    await sendMail('plannedDeletion', messages[defaultLocale], user.email, {
      link,
      user: user.name,
      plannedDeletion: localizedDayjs(plannedDeletion).locale(defaultLocale).format('L'),
      cause: messages[defaultLocale].mails.plannedDeletion.causeInactivity.replace('{date}', localizedDayjs(user.logged || user.created.date).locale(defaultLocale).format('L'))
    })
    eventsLog.warn('sd.cleanup-cron.inactive.email', `sent an email of planned deletion to inactive user ${user.email}`, { user })
  }
}

const task = async () => {
  if (stopped) return
  try {
    console.info('run user cleanup cron task')
    await locks.acquire('user-deletion-task')
    if (config.cleanup.deleteInactive) {
      for (const user of await storages.globalStorage.findInactiveUsers()) {
        await planDeletion(user)
      }
    }

    for (const token of await findOfflineOAuthTokens()) {
      // TODO manage offline tokens from site level providers
      const provider = oauthGlobalProviders().find(p => p.id === token.provider.id)
      const user = await storages.globalStorage.getUser(token.user.id)
      if (!provider) {
        console.error('offline token for unknown provider', token)
      } else if (!user) {
        console.error('offline token for unknown user', token)
      } else {
        try {
          const refreshedToken = await provider.refreshToken(token.token, false)
          const { newToken, offlineRefreshToken } = refreshedToken
          const userInfo = await provider.userInfo(newToken.access_token)
          const memberInfo = await authCoreProviderMemberInfo(null, provider, user.email, userInfo)
          await patchCoreOAuthUser(provider, user, userInfo, memberInfo)
          await writeOAuthToken(user, provider, newToken, offlineRefreshToken, token.loggedOut)
          eventsLog.info('sd.cleanup-cron.offline-token.refresh-ok', `a user refreshed their info from their core identity provider ${provider.id}`, { user })
        } catch (err: any) {
          if (err?.data?.payload?.error === 'invalid_grant') {
            await deleteOAuthToken(user, provider)
            eventsLog.warn('sd.cleanup-cron.offline-token.delete', `deleted invalid offline token for user ${user.id} and provider ${provider.id}`, { user })
            await planDeletion(user)
          } else {
            internalError('cleanup-refresh-token', err)
          }
        }
      }
    }

    for (const user of await storages.globalStorage.findUsersToDelete()) {
      console.log('execute planned deletion of user', user)
      await storages.globalStorage.deleteUser(user.id)
      eventsLog.warn('sd.cleanup-cron.delete', 'deleted user', { user })
      deleteIdentity('user', user.id)
    }
    await locks.release('user-deletion-task')
    console.info('user cleanup cron task done\n\n')
  } catch (err) {
    internalError('cleanup-cron', err)
  }
}

export const start = () => {
  cron.schedule(config.cleanup.cron, async () => {
    if (taskPromise) {
      console.warn('cleanup task already running')
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
