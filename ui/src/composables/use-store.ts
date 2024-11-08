import type { User, PublicAuthProvider, Organization, SitePublic } from '../../../api/types/index.ts'
import { PostSiteReq } from '../../../api/doc/sites/post-req/index.ts'
import { PatchSiteReq } from '../../../api/doc/sites/patch-req'

function createStore () {
  const { sendUiNotif } = useUiNotif()
  const { user, site } = useSession()
  const reactiveSearchParams = useReactiveSearchParams()

  const sitePublic = computed(() => site.value as SitePublic | null)

  const userDetailsFetch = useFetch<User>(() => `${$apiPath}/users/${user.value?.id}`, { watch: false })
  const authProvidersFetch = useFetch<PublicAuthProvider[]>(`${$apiPath}/auth/providers`, { watch: false })
  const sitesFetch = useFetch<{ count: number, results: SitePublic[] }>(`${$apiPath}/sites`, { watch: false })

  const patchOrganization = withUiNotif(async (id: string, patch: Partial<Organization>, msg: string) => {
    await $fetch(`organizations/${id}`, { method: 'PATCH', body: patch })
    await userDetailsFetch.refresh()
    sendUiNotif(msg)
  })

  const postSite = withUiNotif(async (site: PostSiteReq['body']) => {
    await $fetch('sites', { method: 'POST', body: site })
  })

  const patchSite = withUiNotif(async (patch: PatchSiteReq['body']) => {
    await $fetch('sites', { method: 'PATCH', body: patch })
  })

  const host = window.location.host
  const mainPublicUrl = new URL($uiConfig.publicUrl)

  const redirect = useStringSearchParam('redirect')
  const mainRedirect = computed(() => {
    const mainRedirect = reactiveSearchParams.main_redirect || reactiveSearchParams.mainRedirect
    if (!mainRedirect && redirect.value?.startsWith(mainPublicUrl.origin)) return redirect.value
    return mainRedirect
  })

  const redirects = computed(() => {
    if (!sitesFetch.data.value) return
    const redirects: { text: string, value: string }[] = [{ text: mainPublicUrl.host, value: mainRedirect.value }]
      .concat(sitesFetch.data.value.results.map(site => ({ text: site.host, value: 'https://' + site.host + '/me/account' })))
    if (mainPublicUrl.host !== host && !sitesFetch.data.value.results.find(site => site.host === host)) {
      redirects.push({ text: host, value: 'https://' + host + '/me/account' })
    }
    return redirects
  })

  return {
    sitePublic,
    sitesFetch,
    userDetailsFetch,
    authProvidersFetch,
    patchOrganization,
    postSite,
    patchSite,
    host,
    mainPublicUrl,
    redirects
  }
}

// module level singleton is ok as we are not in SSR context
let storeSingleton: ReturnType<typeof createStore>

export function useStore () {
  storeSingleton = storeSingleton ?? createStore()
  return storeSingleton
}
export default useStore
