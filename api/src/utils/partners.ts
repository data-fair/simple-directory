import { type Organization, type ShortenedPartnerInvitation } from '#types'

export const shortenPartnerInvitation = (partner: { name: string, contactEmail: string }, org: Organization, partnerId: string): ShortenedPartnerInvitation => {
  return {
    o: org.id,
    on: org.name,
    p: partnerId,
    n: partner.name,
    e: partner.contactEmail
  }
}

export const unshortenPartnerInvitation = (partnerPayload: ShortenedPartnerInvitation) => {
  return {
    orgId: partnerPayload.o,
    partnerId: partnerPayload.p,
    name: partnerPayload.n,
    contactEmail: partnerPayload.e
  }
}
