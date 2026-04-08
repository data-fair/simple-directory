# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features/external-apps-authorization.api.spec.ts >> External Apps Authorization Flow >> should fall back to global applications when site has no applications
- Location: tests/features/external-apps-authorization.api.spec.ts:146:3

# Error details

```
AxiosRequestError: 400 - Unknown client_id
```

# Test source

```ts
  77  |     // 6. Exchange code for session (simulating native app request)
  78  |     const appAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })
  79  | 
  80  |     const loginRes2 = await appAx.post('/api/auth/apps/login', {
  81  |       code
  82  |     })
  83  | 
  84  |     assert.equal(loginRes2.status, 200)
  85  |     // Check if user is returned
  86  |     assert.equal(loginRes2.data.email, 'native-test@test.com')
  87  | 
  88  |     // Check if cookies are set
  89  |     const appCookies = loginRes2.headers['set-cookie']
  90  |     assert.ok(appCookies, 'Session cookies should be set')
  91  |     assert.ok(appCookies.some((c: string) => c.startsWith('id_token')), 'id_token should be present')
  92  | 
  93  |     // 7. Verify session works
  94  |     const appSessionAx = await axios({
  95  |       baseURL: `http://${siteHost}/simple-directory`,
  96  |       headers: { Cookie: appCookies }
  97  |     })
  98  |     const meRes = await appSessionAx.get('/api/auth/me')
  99  |     assert.equal(meRes.status, 200)
  100 |     assert.equal(meRes.data.email, 'native-test@test.com')
  101 | 
  102 |     // 8. Replay Check: Code reuse (stateless JWT)
  103 |     // Since it's stateless, it CAN be reused within validity period.
  104 |     const replayRes = await appAx.post('/api/auth/apps/login', {
  105 |       code
  106 |     })
  107 |     assert.equal(replayRes.status, 200)
  108 |   })
  109 | 
  110 |   test('should reject POST authorize without authentication', async () => {
  111 |     const config = (await import('../../api/src/config.ts')).default
  112 |     const { ax: adminAx } = await createUser('admin@test.com', true)
  113 |     const org = (await adminAx.post('/api/organizations', { name: 'Site Org Auth' })).data
  114 |     const port = new URL(adminAx.defaults.baseURL || '').port
  115 |     const siteHost = `127.0.0.1:${port}`
  116 | 
  117 |     const anonymousAx = await axios()
  118 |     await anonymousAx.post('/api/sites',
  119 |       {
  120 |         _id: 'test-site-auth',
  121 |         owner: { type: 'organization', id: org.id, name: org.name },
  122 |         host: siteHost,
  123 |         theme: { primaryColor: '#000000' },
  124 |         applications: [{
  125 |           id: 'native-app-client',
  126 |           name: 'Native App',
  127 |           redirectUris: ['native-app://auth-callback']
  128 |         }]
  129 |       },
  130 |       { params: { key: config.secretKeys.sites } }
  131 |     )
  132 | 
  133 |     const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })
  134 | 
  135 |     // POST without authentication should fail
  136 |     const authorizeRes = await siteAx.post('/api/auth/apps/authorize', {
  137 |       client_id: 'native-app-client',
  138 |       redirect_uri: 'native-app://auth-callback'
  139 |     }, {
  140 |       validateStatus: (status: number) => status === 401
  141 |     })
  142 | 
  143 |     assert.match(authorizeRes.data, /Not authenticated/)
  144 |   })
  145 | 
  146 |   test('should fall back to global applications when site has no applications', async () => {
  147 |     const config = (await import('../../api/src/config.ts')).default
  148 |     const { ax: adminAx } = await createUser('admin@test.com', true)
  149 |     const org = (await adminAx.post('/api/organizations', { name: 'Site Org Fallback' })).data
  150 |     const port = new URL(adminAx.defaults.baseURL || '').port
  151 |     const siteHost = `127.0.0.1:${port}`
  152 | 
  153 |     const originalApps = config.applications
  154 |     config.applications = [{
  155 |       id: 'global-app',
  156 |       name: 'Global App',
  157 |       redirectUris: ['native-app://global-callback']
  158 |     }]
  159 | 
  160 |     try {
  161 |       const anonymousAx = await axios()
  162 |       await anonymousAx.post('/api/sites',
  163 |         {
  164 |           _id: 'test-site-fallback',
  165 |           owner: { type: 'organization', id: org.id, name: org.name },
  166 |           host: siteHost,
  167 |           theme: { primaryColor: '#000000' }
  168 |         },
  169 |         { params: { key: config.secretKeys.sites } }
  170 |       )
  171 | 
  172 |       await adminAx.patch('/api/sites/test-site-fallback', { authMode: 'onlyLocal' })
  173 | 
  174 |       const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })
  175 | 
  176 |       // Should find global-app via fallback
> 177 |       const authorizeRes = await siteAx.get(
      |                            ^ AxiosRequestError: 400 - Unknown client_id
  178 |         '/api/auth/apps/authorize?client_id=global-app&redirect_uri=native-app://global-callback',
  179 |         { maxRedirects: 0, validateStatus: (status: number) => status === 302 }
  180 |       )
  181 |       const loginRedirectUrl = new URL(authorizeRes.headers.location)
  182 |       assert.equal(loginRedirectUrl.searchParams.get('client_id'), 'global-app')
  183 |       assert.equal(loginRedirectUrl.searchParams.get('client_name'), 'Global App')
  184 |     } finally {
  185 |       config.applications = originalApps
  186 |     }
  187 |   })
  188 | 
  189 |   test('should merge global and site applications, site takes priority', async () => {
  190 |     const config = (await import('../../api/src/config.ts')).default
  191 |     const { ax: adminAx } = await createUser('admin@test.com', true)
  192 |     const org = (await adminAx.post('/api/organizations', { name: 'Site Org Merge' })).data
  193 |     const port = new URL(adminAx.defaults.baseURL || '').port
  194 |     const siteHost = `127.0.0.1:${port}`
  195 | 
  196 |     const originalApps = config.applications
  197 |     config.applications = [
  198 |       { id: 'global-only', name: 'Global Only', redirectUris: ['native-app://global-only'] },
  199 |       { id: 'shared-id', name: 'Global Shared', redirectUris: ['native-app://global-shared'] }
  200 |     ]
  201 | 
  202 |     try {
  203 |       const anonymousAx = await axios()
  204 |       await anonymousAx.post('/api/sites',
  205 |         {
  206 |           _id: 'test-site-merge',
  207 |           owner: { type: 'organization', id: org.id, name: org.name },
  208 |           host: siteHost,
  209 |           theme: { primaryColor: '#000000' },
  210 |           applications: [
  211 |             { id: 'site-only', name: 'Site Only', redirectUris: ['native-app://site-only'] },
  212 |             { id: 'shared-id', name: 'Site Shared', redirectUris: ['native-app://site-shared'] }
  213 |           ]
  214 |         },
  215 |         { params: { key: config.secretKeys.sites } }
  216 |       )
  217 | 
  218 |       await adminAx.patch('/api/sites/test-site-merge', { authMode: 'onlyLocal' })
  219 | 
  220 |       const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })
  221 | 
  222 |       // Site-only app should work
  223 |       const res1 = await siteAx.get(
  224 |         '/api/auth/apps/authorize?client_id=site-only&redirect_uri=native-app://site-only',
  225 |         { maxRedirects: 0, validateStatus: (status: number) => status === 302 }
  226 |       )
  227 |       assert.equal(new URL(res1.headers.location).searchParams.get('client_name'), 'Site Only')
  228 | 
  229 |       // Global-only app should work via merge
  230 |       const res2 = await siteAx.get(
  231 |         '/api/auth/apps/authorize?client_id=global-only&redirect_uri=native-app://global-only',
  232 |         { maxRedirects: 0, validateStatus: (status: number) => status === 302 }
  233 |       )
  234 |       assert.equal(new URL(res2.headers.location).searchParams.get('client_name'), 'Global Only')
  235 | 
  236 |       // Shared ID should use site version (site overrides global)
  237 |       const res3 = await siteAx.get(
  238 |         '/api/auth/apps/authorize?client_id=shared-id&redirect_uri=native-app://site-shared',
  239 |         { maxRedirects: 0, validateStatus: (status: number) => status === 302 }
  240 |       )
  241 |       assert.equal(new URL(res3.headers.location).searchParams.get('client_name'), 'Site Shared')
  242 | 
  243 |       // Global redirect URI for shared-id should be rejected (site version takes priority)
  244 |       const res4 = await siteAx.get(
  245 |         '/api/auth/apps/authorize?client_id=shared-id&redirect_uri=native-app://global-shared',
  246 |         { maxRedirects: 0, validateStatus: (status: number) => status === 400 }
  247 |       )
  248 |       assert.match(res4.data, /Invalid redirect_uri/)
  249 |     } finally {
  250 |       config.applications = originalApps
  251 |     }
  252 |   })
  253 | 
  254 |   test('should reject invalid client_id', async () => {
  255 |     const config = (await import('../../api/src/config.ts')).default
  256 |     const { ax: adminAx } = await createUser('admin@test.com', true)
  257 |     const org = (await adminAx.post('/api/organizations', { name: 'Site Org 2' })).data
  258 |     const port = new URL(adminAx.defaults.baseURL || '').port
  259 |     const siteHost = `127.0.0.1:${port}`
  260 | 
  261 |     const anonymousAx = await axios()
  262 |     await anonymousAx.post('/api/sites',
  263 |       {
  264 |         _id: 'test-site-2',
  265 |         owner: { type: 'organization', id: org.id, name: org.name },
  266 |         host: siteHost,
  267 |         theme: { primaryColor: '#000000' },
  268 |         applications: []
  269 |       },
  270 |       { params: { key: config.secretKeys.sites } }
  271 |     )
  272 | 
  273 |     const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })
  274 | 
  275 |     const authorizeUrl = '/api/auth/apps/authorize?client_id=invalid-client&redirect_uri=native-app://auth-callback'
  276 | 
  277 |     const authorizeRes = await siteAx.get(authorizeUrl, {
```