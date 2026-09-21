import type { MaybeRefOrGetter } from 'vue'
import type { Organization } from '../../../api/types/index.ts'

// the roles are stored as keys, their readable labels live in the organization rolesLabels
// (blank when they match the default, hence the fallbacks)
export function useRoleLabels (orga: MaybeRefOrGetter<Organization | null | undefined>) {
  const roleLabel = (role: string) => toValue(orga)?.rolesLabels?.[role] || $uiConfig.defaultRolesLabels?.[role] || role
  const roleItems = computed(() => (toValue(orga)?.roles ?? []).map(role => ({ value: role, title: roleLabel(role) })))
  return { roleLabel, roleItems }
}

export default useRoleLabels
