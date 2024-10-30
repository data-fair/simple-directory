import type { User, PublicAuthProvider, Organization, SitePublic } from '../../../api/types/index.ts'
import { PostSiteReq } from '../../../api/doc/sites/post-req/index.ts'
import { PatchSiteReq } from '../../../api/doc/sites/patch-req'

const { sendUiNotif } = useUiNotif()
const { user } = useSession()
const reactiveSearchParams = useReactiveSearchParams()

export const userDetailsFetch = useFetch<User>(() => `${$apiPath}/users/${user.value?.id}`, { watch: false })
export const authProvidersFetch = useFetch<PublicAuthProvider[]>(`${$apiPath}/auth/providers`, { watch: false })
export const sitePublicFetch = useFetch<SitePublic>(`${$apiPath}/sites/_public`, { watch: false })
export const sitesFetch = useFetch<{ count: number, results: SitePublic[] }>(`${$apiPath}/sites`, { watch: false })

export const patchOrganization = withUiNotif(async (id: string, patch: Partial<Organization>, msg: string) => {
  await $fetch(`organizations/${id}`, { method: 'PATCH', body: patch })
  await userDetailsFetch.refresh()
  sendUiNotif(msg)
})

export const postSite = withUiNotif(async (site: PostSiteReq['body']) => {
  await $fetch('sites', { method: 'POST', body: site })
})

export const patchSite = withUiNotif(async (patch: PatchSiteReq['body']) => {
  await $fetch('sites', { method: 'PATCH', body: patch })
})

export const host = window.location.host
export const redirect = useStringSearchParam('redirect')
export const mainRedirect = computed(() => {
  const mainRedirect = reactiveSearchParams.main_redirect || reactiveSearchParams.mainRedirect
  if (!mainRedirect && redirect.value?.startsWith($uiConfig.publicUrl)) return redirect.value
  return mainRedirect
})

export const mainPublicUrl = new URL($uiConfig.publicUrl)

export const redirects = computed(() => {
  if (!sitesFetch.data.value) return
  const redirects: { text: string, value: string }[] = [{ text: mainPublicUrl.host, value: mainRedirect.value }]
    .concat(sitesFetch.data.value.results.map(site => ({ text: site.host, value: 'https://' + site.host + '/me/account' })))
  if (mainPublicUrl.host !== host && !sitesFetch.data.value.results.find(site => site.host === host)) {
    redirects.push({ text: host, value: 'https://' + host + '/me/account' })
  }
  return redirects
})
