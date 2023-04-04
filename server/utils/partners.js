exports.shortenPartnerInvitation = (partner, orgId, pendingId) => {
  return {
    o: orgId,
    p: pendingId,
    n: partner.name,
    e: partner.contactEmail
  }
}

exports.unshortenPartnerInvitation = (partnerPayload) => {
  return {
    orgId: partnerPayload.o,
    pendingId: partnerPayload.p,
    name: partnerPayload.n,
    contactEmail: partnerPayload.e
  }
}
