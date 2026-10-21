export type NhiDecision = {
  account: { type: 'organization', id: string, department?: string },
  nhi: { id: string },
  scopes: string[],
  lifetime: string
}
