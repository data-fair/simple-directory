// this single small worker loop doesn't rellay justify running in separate processes
// we simply run it as part of the api server

let stopped = false
let taskPromise

const planDeletion = async (user) => {
  const plannedDeletion = moment().add(config.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
  await storage.patchUser(user.id, { plannedDeletion })
  eventsLog.warn('sd.cleanup-cron.plan-deletion', 'planned deletion of inactive user', { user })
  const link = config.publicUrl + '/login?email=' + encodeURIComponent(user.email)
  const linkUrl = new URL(link)
  if (user.emailConfirmed || user.logged) {
    // TODO: use a locale stored on the user ?
    await sendMail('plannedDeletion', i18n.messages[i18n.defaultLocale], user.email, {
      link,
      user: user.name,
      plannedDeletion: dayjs(plannedDeletion).locale(i18n.defaultLocale).format('L'),
      cause: i18n.messages[i18n.defaultLocale].mails.plannedDeletion.causeInactivity.replace('{date}', dayjs(user.logged || user.created.date).locale(i18n.defaultLocale).format('L'))
    })
    eventsLog.warn('sd.cleanup-cron.inactive.email', `sent an email of planned deletion to inactive user ${user.email}`, { user })
  }
}

const task = async () => {
  const { internalError } = await import('@data-fair/lib/node/observer.js')
  try {
    console.info('run user cleanup cron task')
    await locks.acquire(storage.db, 'user-deletion-task')
    if (config.cleanup.deleteInactive) {
      for (const user of await storage.findInactiveUsers()) {
        await planDeletion(user)
      }
    }

    for (const token of await storage.findOfflineOAuthTokens()) {
      // TODO manage offline tokens from site level providers
      const provider = oauth.providers.find(p => p.id === token.provider.id)
      const user = await storage.getUser({ id: token.user.id })
      if (!provider) {
        console.error('offline token for unknown provider', token)
      } else if (!user) {
        console.error('offline token for unknown user', token)
      } else {
        try {
          const refreshedToken = await provider.refreshToken(token.token, false)
          const { newToken, offlineRefreshToken } = refreshedToken
          const userInfo = await provider.userInfo(newToken.access_token)
          const memberInfo = await auth.authCoreProviderMemberInfo(storage, null, provider, user.email, userInfo)
          await auth.patchCoreOAuthUser(storage, provider, user, userInfo, memberInfo)
          await storage.writeOAuthToken(user, provider, newToken, offlineRefreshToken, token.loggedOut)
          eventsLog.info('sd.cleanup-cron.offline-token.refresh-ok', `a user refreshed their info from their core identity provider ${provider.id}`, { user })
        } catch (err) {
          if (err?.data?.payload?.error === 'invalid_grant') {
            await storage.deleteOAuthToken(user, provider)
            eventsLog.warn('sd.cleanup-cron.offline-token.delete', `deleted invalid offline token for user ${user.id} and provider ${provider.id}`, { user })
            await planDeletion(user)
          } else {
            internalError('cleanup-refresh-token', err)
          }
        }
      }
    }

    for (const user of await storage.findUsersToDelete()) {
      console.log('execute planned deletion of user', user)
      await storage.deleteUser(user.id)
      eventsLog.warn('sd.cleanup-cron.delete', 'deleted user', { user })
      webhooks.deleteIdentity('user', user.id)
    }
    await locks.release(storage.db, 'user-deletion-task')
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
      taskPromise.then(() => { taskPromise = null })
    }
  })
}

export const stop = async () => {
  stopped = true
  if (taskPromise) await taskPromise
}
