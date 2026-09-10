import { BlockList, isIP } from 'node:net'
import { httpError } from '@data-fair/lib-express'

// An NHI can restrict the client addresses its token exchange is accepted from. Entries are
// plain addresses or CIDR subnets, of either family. Matching is delegated to node:net's
// BlockList, as in keys.ts but with the opposite polarity (an allowlist instead of a
// denylist): it also understands IPv4-mapped IPv6 client addresses (::ffff:10.0.0.1) against
// ipv4 rules, which is what a dual-stack reverse-proxy commonly reports.

const family = (addr: string) => {
  const f = isIP(addr)
  return f === 4 ? 'ipv4' : f === 6 ? 'ipv6' : undefined
}

const addEntry = (list: BlockList, entry: string) => {
  const slash = entry.indexOf('/')
  const addr = slash === -1 ? entry : entry.slice(0, slash)
  const addrFamily = family(addr)
  if (!addrFamily) throw httpError(400, `invalid address in allowedIps (${entry})`)
  try {
    if (slash === -1) {
      list.addAddress(addr, addrFamily)
    } else {
      const prefix = entry.slice(slash + 1)
      if (!/^\d{1,3}$/.test(prefix)) throw httpError(400, `invalid prefix length in allowedIps (${entry})`)
      if (Number(prefix) > (addrFamily === 'ipv4' ? 32 : 128)) throw httpError(400, `prefix length out of range in allowedIps (${entry})`)
      list.addSubnet(addr, Number(prefix), addrFamily)
    }
  } catch (err: any) {
    throw err.status === 400 ? err : httpError(400, `invalid entry in allowedIps (${entry})`)
  }
}

const buildAllowList = (allowedIps: string[]) => {
  const list = new BlockList()
  for (const entry of allowedIps) addEntry(list, entry)
  return list
}

// fail-fast validation at NHI create/patch time, same split as checkProvider: a descriptive
// 400 on the admin-only management surface, while the exchange keeps its uniform 401
export const checkAllowedIps = (allowedIps: string[]) => {
  if (!allowedIps.length) throw httpError(400, 'allowedIps must not be empty, omit it instead')
  buildAllowList(allowedIps)
}

export const ipAllowed = (ip: string, allowedIps: string[]): boolean => {
  const ipFamily = family(ip)
  if (!ipFamily || !allowedIps.length) return false
  let list: BlockList
  try {
    list = buildAllowList(allowedIps)
  } catch {
    // entries are validated at create/patch time, so this only happens for a record written
    // before that validation or edited out of band: refuse rather than let the exchange through
    return false
  }
  return list.check(ip, ipFamily)
}
