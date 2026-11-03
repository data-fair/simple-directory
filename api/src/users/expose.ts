// The id_token kept on a server session for the RP-initiated logout (sessions[].idp) never leaves the API.
// Applied to every response built from a storage user (the storages keep it: logout reads it back).
export const exposedUser = <T extends { sessions?: { idp?: unknown }[] } | undefined>(user: T): T => {
  if (!user?.sessions) return user
  return { ...user, sessions: user.sessions.map(({ idp, ...s }) => s) }
}
