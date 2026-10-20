export type NhiDecision = {
  account: { type: 'organization', id: string, department?: string },
  nhi: { id: string } | { create: { name: string, role: string, scopes: string[] } },
  scopes: string[],
  lifetime: string
}
