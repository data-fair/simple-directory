export const  shortenPartnerInvitation = (partner, org, partnerId) => {
  return {
    o: org.id,
    on: org.name,
    p: partnerId,
    n: partner.name,
    e: partner.contactEmail
  }
}

export const  unshortenPartnerInvitation = (partnerPayload) => {
  return {
    orgId: partnerPayload.o,
    partnerId: partnerPayload.p,
    name: partnerPayload.n,
    contactEmail: partnerPayload.e
  }
}
