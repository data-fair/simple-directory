import type { Request } from 'express'
import { reqIp } from '@data-fair/lib-express'

export type IpInfo = {
  ip?: string,
  country?: string,
  asn?: string,
  asnOrg?: string
}

// origin of a request, used to describe a session to its owner and to detect suspicious changes.
// the geo parts come from enrichment headers set by our reverse-proxy, they are simply absent
// when it does not perform this enrichment.
// contrary to reqIp this never throws: failing to describe a session must not break a login
export const reqIpInfo = (req: Request): IpInfo => {
  const info: IpInfo = {}
  try {
    info.ip = reqIp(req)
  } catch (err) {
    // no usable X-Forwarded-For header, cf the reverse-proxy configuration
  }
  const country = req.get('x-country')
  if (country) info.country = country
  const asn = req.get('x-asn')
  if (asn) info.asn = asn
  const asnOrg = req.get('x-asn-org')
  if (asnOrg) info.asnOrg = asnOrg
  return info
}

// same info, prefixed, to store the origin of the last activity next to the original one
export const lastIpInfo = (req: Request) => {
  const { ip, country, asn, asnOrg } = reqIpInfo(req)
  const info: Record<string, string> = {}
  if (ip) info.lastIp = ip
  if (country) info.lastCountry = country
  if (asn) info.lastAsn = asn
  if (asnOrg) info.lastAsnOrg = asnOrg
  return info
}
