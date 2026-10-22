import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Organization, Member } from '../../../api/types/index.ts'

// tells if a member is the session user's own last organization-level admin membership (or the last membership of all),
// fetched only when the menu opens on that membership
export function useLastAdmin (orga: MaybeRefOrGetter<Organization>, member: MaybeRefOrGetter<Member>, menu: Ref<boolean>) {
  const { user } = useSessionAuthenticated()
  const isSelf = computed(() => toValue(member).id === user.value.id)
  const isOrgAdmin = computed(() => toValue(member).role === 'admin' && !toValue(member).department)

  const membersPath = () => `${$apiPath}/organizations/${toValue(orga).id}/members`
  const adminsFetch = useFetch<{ count: number }>(membersPath, { query: { size: 0, role: 'admin', department: '-' }, watch: false })
  const allFetch = useFetch<{ count: number }>(membersPath, { query: { size: 0 }, watch: false })

  watch(menu, () => {
    if (!menu.value || !isSelf.value || !isOrgAdmin.value) return
    adminsFetch.refresh()
    allFetch.refresh()
  })

  const isLastAdmin = computed(() => isSelf.value && isOrgAdmin.value && adminsFetch.data.value?.count === 1)
  // ponytail: the file storage counts memberships, not users, so there a sole user holding 2 roles (multi-roles) is not seen as the last member
  const isLastMember = computed(() => isLastAdmin.value && allFetch.data.value?.count === 1)

  const loading = computed(() => adminsFetch.loading.value || allFetch.loading.value)

  return { isSelf, isLastAdmin, isLastMember, loading }
}

export default useLastAdmin
