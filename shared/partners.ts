// a pending partner (no id yet) whose invitation token has expired can no longer be accepted, it does not count in the quota
export const isExpiredPartnerInvitation = (partner: { id?: string, createdAt?: string }, durationSeconds: number, now = Date.now()) =>
  !partner.id && !!partner.createdAt && new Date(partner.createdAt).getTime() + durationSeconds * 1000 < now
