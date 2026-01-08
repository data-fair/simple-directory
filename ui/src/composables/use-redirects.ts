import type { SitePublic } from '../../../api/types/index.ts'
import type { AccountKeys } from '@data-fair/lib-vue/session'
import debugModule from 'debug'

const debug = debugModule('use-redirects')

const createRedirects = (account: AccountKeys) => {
  debug('init useRedirects', account)
  const session = useSession()
  const host = window.location.host
  const mainPublicUrl = new URL($uiConfig.publicUrl)
  const reactiveSearchParams = useReactiveSearchParams()
  const redirect = useStringSearchParam('redirect')

  const invitationPath = $uiConfig.invitationRedirect?.startsWith('/') ? $uiConfig.invitationRedirect : '/me/account'
  const getFullRedirect = (host: string) => {
    if (redirect.value?.startsWith('https://' + host)) return redirect.value
    return 'https://' + host + invitationPath
  }

  const mainRedirect = computed(() => {
    const mainRedirect = reactiveSearchParams.main_redirect || reactiveSearchParams.mainRedirect
    if (mainRedirect) return mainRedirect
    if ($uiConfig.invitationRedirect && !$uiConfig.invitationRedirect.startsWith('/') && !redirect.value?.startsWith(mainPublicUrl.origin)) {
      return $uiConfig.invitationRedirect
    }
    return getFullRedirect(mainPublicUrl.host)
  })

  const isBackoffice = mainPublicUrl.host === host
  const isSiteOwnerAccount = session.user.value?.siteOwner?.type === account.type && session.user.value?.siteOwner?.id === account.id

  // in the back-office, always propose all sites from current owner
  // in a portal, if working on the account owner of the site propose all sites from same owner
  // for any other account, only propose the current site
  const shouldFetchSites = $uiConfig.manageSites && (session.user.value?.adminMode || isBackoffice || isSiteOwnerAccount)

  const sitesFetch = shouldFetchSites && useFetch<{ count: number, results: SitePublic[] }>(`${$apiPath}/sites`, { query: { owner: `${account.type}:${account.id}`, tmp: false } })
  const loadingRedirects = computed(() => sitesFetch && sitesFetch?.loading.value)

  const redirects = computed(() => {
    debug('compute redirects', { shouldFetchSites, isBackoffice, isSiteOwnerAccount })
    const redirects: { title: string, value: string }[] = []

    // make sure the current host is always first in the list, it will be the default value
    if (isBackoffice) {
      debug('add backoffice')
      // on the back-office always propose itself as first choice
      redirects.push({ title: mainPublicUrl.host, value: mainRedirect.value })
    } else {
      debug('add current site')
      redirects.push({ title: host, value: getFullRedirect(host) })
    }
    if (sitesFetch && sitesFetch.data.value) {
      debug('add other sites', sitesFetch.data.value)
      for (const site of sitesFetch.data.value.results) {
        if (redirects.some(r => r.title === site.host)) continue
        redirects.push({ title: site.host, value: getFullRedirect(site.host) })
      }
    }
    debug('redirects', redirects)
    return redirects
  })
  const defaultRedirect = computed(() => redirects.value?.[0])

  return { redirects, loadingRedirects, defaultRedirect }
}

// module level singleton is ok as we are not in SSR context
const accountRedirectsSingleton: { [accountKey: string]: ReturnType<typeof createRedirects> } = {}

export function useRedirects (account: AccountKeys) {
  const accountStr = `${account.type}:${account.id}`
  accountRedirectsSingleton[accountStr] = accountRedirectsSingleton[accountStr] ?? createRedirects(account)
  return accountRedirectsSingleton[accountStr]
}
export default useRedirects
