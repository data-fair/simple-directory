export type NhiDecision = {
  account: { type: 'organization', id: string, department?: string },
  nhi: { id: string },
  lifetime: string
}

// a scope as the consent details list it: only the ones no other scope of the grant implies
export type ConsentScope = { name: string, description: string, broad: boolean }
