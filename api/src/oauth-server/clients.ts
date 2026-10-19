// OAuth clients of the authorization server: in M1 the only clients are NHIs, synthesized from the
// NHI record on every lookup (never stored by the adapter).
import type { ClientMetadata } from 'oidc-provider'
import config from '#config'
import storages from '#storages'

// only NHIs with inline jwks are clients: the provider authenticates private_key_jwt against the
// client's jwks metadata. NHIs relying on issuer discovery use the JWT bearer grant only.
export const findNhiClient = async (clientId: string): Promise<ClientMetadata | undefined> => {
  if (!config.manageNhis) return undefined
  const user = await storages.globalStorage.getUser(clientId)
  if (!user?.nhi?.provider?.jwks || user.organizations.length !== 1) return undefined
  return {
    client_id: clientId,
    grant_types: ['client_credentials'],
    response_types: [],
    redirect_uris: [],
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: undefined,
    jwks: user.nhi.provider.jwks as unknown as ClientMetadata['jwks']
  }
}
