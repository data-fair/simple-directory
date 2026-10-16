// the scopes an NHI may be given: simple-directory's own plus the platform's (cf GET /api/scopes)
export function usePlatformScopes () {
  const fetchScopes = useFetch<{ scopes: Record<string, string> }>(`${$apiPath}/scopes`)
  const scopeItems = computed(() => Object.entries(fetchScopes.data.value?.scopes ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, description]) => ({ value, title: value, subtitle: description })))
  return { scopeItems }
}

export default usePlatformScopes
