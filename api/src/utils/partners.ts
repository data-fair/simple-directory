import { Organization, type Partner } from '#types'

export const shortenPartnerInvitation = (partner: Partner, org: Organization, partnerId: string) => {
  return {
    o: org.id,
    on: org.name,
    p: partnerId,
    n: partner.name,
    e: partner.contactEmail
  }
}

export const unshortenPartnerInvitation = (partnerPayload: ReturnType<typeof shortenPartnerInvitation>) => {
  return {
    orgId: partnerPayload.o,
    partnerId: partnerPayload.p,
    name: partnerPayload.n,
    contactEmail: partnerPayload.e
  }
}
