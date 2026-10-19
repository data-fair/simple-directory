import type { IncomingMessage } from 'node:http'

// shared by the server and the test-env session.init calls so both are identical:
// on keepalive route we accept a older token if it is accompanied by a valid exchange token
export const onlyDecode = (req: IncomingMessage) => {
  return req.method === 'POST' && req.url === '/api/auth/keepalive'
}
