import type { User, PublicAuthProvider, Organization, SitePublic } from '../../../api/types/index.ts'
import { SitePost } from '../../../api/doc/sites/post-req-body/index.ts'
import { SitePatch } from '../../../api/doc/sites/patch-req-body/index.ts'

function createStore () {
  const { sendUiNotif } = useUiNotif()
  const { user, fullSite } = useSession()

  const sitePublic = computed(() => fullSite.value as SitePublic | null)

  const userDetailsFetch = useFetch<User>(() => `${$apiPath}/users/${user.value?.id}`, { watch: false })
  const authProvidersFetch = useFetch<PublicAuthProvider[]>(`${$apiPath}/auth/providers`, { watch: false })

  const patchOrganization = useAsyncAction(async (id: string, patch: Partial<Organization>, msg: string) => {
    await $fetch(`organizations/${id}`, { method: 'PATCH', body: patch })
    await userDetailsFetch.refresh()
    sendUiNotif(msg)
  })

  const postSite = useAsyncAction(async (site: SitePost) => {
    await $fetch('sites', { method: 'POST', body: site })
  })

  const patchSite = useAsyncAction(async (id: string, patch: SitePatch) => {
    await $fetch(`sites/${id}`, { method: 'PATCH', body: patch })
  })

  const host = window.location.host
  const mainPublicUrl = new URL($uiConfig.publicUrl)
  const isMainSite = host === mainPublicUrl.host

  return {
    sitePublic,
    userDetailsFetch,
    authProvidersFetch,
    patchOrganization,
    postSite,
    patchSite,
    host,
    mainPublicUrl,
    isMainSite
  }
}

// module level singleton is ok as we are not in SSR context
let storeSingleton: ReturnType<typeof createStore>

export function useStore () {
  storeSingleton = storeSingleton ?? createStore()
  return storeSingleton
}
export default useStore
