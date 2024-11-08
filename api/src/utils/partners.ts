import { type Organization, type Partner, type ShortenedPartnerInvitation } from '#types'

export const shortenPartnerInvitation = (partner: Pick<Partner, 'name' | 'contactEmail'>, org: Organization, partnerId: string): ShortenedPartnerInvitation => {
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
