exports.shortenPartnerInvitation = (partner, orgId, partnerId) => {
  return {
    o: orgId,
    p: partnerId,
    n: partner.name,
    e: partner.contactEmail
  }
}

exports.unshortenPartnerInvitation = (partnerPayload) => {
  return {
    orgId: partnerPayload.o,
    partnerId: partnerPayload.p,
    name: partnerPayload.n,
    contactEmail: partnerPayload.e
  }
}
