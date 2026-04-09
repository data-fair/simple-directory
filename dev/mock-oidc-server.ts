// Standalone mock OIDC server process for testing OAuth2/OIDC login flows.
// Follows the data-fair pattern of a separate mock server with dynamic test control.
//
// Start with: npm run dev-mock-oidc
// Uses MOCK_OIDC_PORT1 and MOCK_OIDC_PORT2 from .env
//
// Each server instance exposes test control endpoints alongside standard OAuth2 endpoints:
//   PATCH /_test/userinfo        — set the userinfo response body
//   PATCH /_test/token-config    — set token endpoint overrides (e.g. { "expires_in": 1 })
//   DELETE /_test                — reset to defaults

import 'dotenv/config'
import { OAuth2Server } from 'oauth2-mock-server'
import http from 'node:http'

interface ServerInstance {
  oauthServer: OAuth2Server
  controlServer: http.Server
  userinfo: Record<string, any>
  tokenConfig: Record<string, any>
}

const createInstance = async (oauthPort: number, controlPort: number): Promise<ServerInstance> => {
  const instance: ServerInstance = {
    oauthServer: new OAuth2Server(),
    controlServer: null as any,
    userinfo: {},
    tokenConfig: {}
  }

  await instance.oauthServer.issuer.keys.generate('RS256')

  instance.oauthServer.service.on('beforeUserinfo', (userInfoResponse, _req) => {
    userInfoResponse.body = { ...instance.userinfo }
  })

  instance.oauthServer.service.on('beforeResponse', (tokenEndpointResponse, _req) => {
    if (instance.tokenConfig.expires_in !== undefined) {
      tokenEndpointResponse.body.expires_in = instance.tokenConfig.expires_in
    }
  })

  await instance.oauthServer.start(oauthPort, 'localhost')
  console.log(`OAuth2 mock server listening on port ${oauthPort}`)

  // Control server for test management on a separate port
  instance.controlServer = http.createServer(async (req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    await new Promise(resolve => req.on('end', resolve))
    let body: any
    try {
      body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString()) : undefined
    } catch {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'invalid JSON body' }))
      return
    }

    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'PATCH' && req.url === '/_test/userinfo') {
      instance.userinfo = body || {}
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true }))
    } else if (req.method === 'PATCH' && req.url === '/_test/token-config') {
      instance.tokenConfig = body || {}
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true }))
    } else if (req.method === 'DELETE' && req.url === '/_test') {
      instance.userinfo = {}
      instance.tokenConfig = {}
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true }))
    } else if (req.method === 'GET' && req.url === '/_test/ping') {
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'not found' }))
    }
  })

  instance.controlServer.listen(controlPort, 'localhost')
  console.log(`Control server listening on port ${controlPort}`)

  return instance
}

const port1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const port2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')

// Control ports are oauth ports + 100 to avoid collisions
const controlPort1 = port1 + 100
const controlPort2 = port2 + 100

await createInstance(port1, controlPort1)
await createInstance(port2, controlPort2)

console.log(`Mock OIDC servers ready (OAuth: ${port1}, ${port2} | Control: ${controlPort1}, ${controlPort2})`)
