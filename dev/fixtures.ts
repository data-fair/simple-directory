/**
 * Dev fixtures: seed the RUNNING dev environment with representative accounts,
 * organizations, a themed secondary site and a partnership, so that every
 * back-office screen has something real to show without clicking through the
 * signup flow by hand.
 *
 * Run it (dev env must be up -- `bash dev/status.sh`):
 *   npm run dev-fixtures
 *
 * Idempotent: anything already present is skipped. The only thing it ever
 * deletes is a leftover `test_` site squatting the fixture site's host.
 *
 * Nothing here matches the test-suite cleanup patterns on purpose:
 * `tests/support/unit.ts#clean` deletes ids matching /^test_/ and emails
 * matching /@test\.com$/i, so accounts, organizations, partnerships and limits
 * survive `npm test`.
 *
 * Two exceptions, both re-created by simply re-running this script:
 * - the site: sites carry a unique index on host, so the test cleanup wipes the
 *   whole collection to stay free to claim any dev host;
 * - the service accounts (NHIs): their ids are `nhi-*`, which the test-env sweep
 *   removes (test NHIs share that namespace and would otherwise collide on the
 *   users' partial unique email index).
 *
 * Caveat: the dev config runs a cleanup cron with `deleteInactive` and a one
 * day delay, so fixture users nobody ever logs in with eventually get a planned
 * deletion and disappear. Just re-run this script.
 */
import { generateKeyPairSync } from 'node:crypto'
import { axios, axiosAuth, waitForMail, testEnvAx, getServerConfig } from '../tests/support/axios.ts'

const EMAIL_DOMAIN = 'dev-fixtures.org'
const PASSWORD = 'TestPasswd01'
const SITE_ID = 'dev-fixtures-portal'
const CORP_NAME = 'Dev Fixtures Corp'
const PARTNER_NAME = 'Dev Fixtures Partner'
const MEMBERS_LIMIT = 10

const email = (local: string) => `${local}@${EMAIL_DOMAIN}`

// Users created with a password, through the real email confirmation flow, so
// they are usable logins. `passwordless@` is deliberately absent: it is created
// by an invitation below and never gets a password.
const userSpecs = [
  { email: email('owner'), firstName: 'Olivia', lastName: 'Owner' },
  { email: email('member'), firstName: 'Marc', lastName: 'Member' },
  { email: email('depadmin'), firstName: 'Dana', lastName: 'DepAdmin' },
  { email: email('deleting'), firstName: 'Dimitri', lastName: 'Deleting' }
]

// Non-human identities (service accounts) shown in the org's back-office. Modelled
// on Kubernetes projected service-account tokens: a bound (issuer, subject) pair and
// no email, one with a department to exercise that path.
const K8S_ISSUER = 'https://kubernetes.default.svc.cluster.local'
const nhiSpecs = [
  { name: 'Agent pipeline de données', role: 'user', subject: 'system:serviceaccount:data-pipelines:etl-runner' },
  { name: 'Agent de déploiement Paris', role: 'admin', department: 'paris', subject: 'system:serviceaccount:ci:paris-deployer' }
]

let superAdminAx: any

const findUser = async (userEmail: string) => {
  const users = (await superAdminAx.get('/api/users', { params: { email: userEmail, allFields: true, size: 1 } })).data
  return users.results[0]
}

const findOrg = async (name: string) => {
  const orgs = (await superAdminAx.get('/api/organizations', { params: { q: name, allFields: true, size: 100 } })).data
  return orgs.results.find((o: any) => o.name === name)
}

// The anonymous-action token carries a `nbf` bot trap (8s by default). Read it
// from the token itself rather than guessing, so a config change can't silently
// turn every user creation into a 429.
const notBeforeMs = (token: string) => {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  return payload.nbf ? payload.nbf * 1000 : 0
}

const ensureUsers = async () => {
  const missing = []
  for (const spec of userSpecs) {
    if (await findUser(spec.email)) {
      console.log(`  ✓ user ${spec.email} (skipped)`)
    } else {
      missing.push(spec)
    }
  }
  if (!missing.length) return

  const anonymousAx = await axios()
  // Grab every token first, then wait out the bot trap once instead of once per user.
  const tokens = new Map<string, string>()
  for (const spec of missing) {
    tokens.set(spec.email, (await anonymousAx.get('/api/auth/anonymous-action')).data)
  }
  const waitMs = Math.max(0, ...[...tokens.values()].map(notBeforeMs)) - Date.now() + 500
  if (waitMs > 0) {
    console.log(`  … waiting ${Math.ceil(waitMs / 1000)}s for the anonymous-action bot trap`)
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }

  for (const spec of missing) {
    const mail = await waitForMail(
      () => anonymousAx.post('/api/users', { ...spec, password: PASSWORD, token: tokens.get(spec.email) }),
      (m: any) => m.to === spec.email && m.link?.includes('token_callback')
    )
    // following the emailed link is what confirms the address
    await anonymousAx(mail.link).catch((err: any) => { if (err.status !== 302) throw err })
    console.log(`  + user ${spec.email}`)
  }
}

// Everything past creation runs as the superadmin: an org that requires 2FA of
// its admins would otherwise refuse to hand this script an org-scoped session on
// the second run.
const ensureOrg = async (name: string, adminEmail: string, patch: Record<string, unknown>) => {
  let org = await findOrg(name)
  if (org) {
    console.log(`  ✓ organization ${name} (skipped)`)
  } else {
    // created by its admin, not by the superadmin, so that autoAdmin makes them a member
    const adminAx = await axiosAuth(adminEmail)
    org = (await adminAx.post('/api/organizations', { name })).data
    console.log(`  + organization ${name} (${org.id})`)
  }
  org = (await superAdminAx.patch(`/api/organizations/${org.id}`, patch)).data
  console.log(`  ~ patched organization ${name}`)
  return org
}

const ensureMember = async (org: any, invitation: { email: string, role: string, departments?: string[] }) => {
  const members = (await superAdminAx.get(`/api/organizations/${org.id}/members`, { params: { email: invitation.email } })).data
  if (members.count) {
    console.log(`  ✓ member ${invitation.email} of ${org.name} (skipped)`)
    return
  }
  // alwaysAcceptInvitation is on in the dev config: this adds the member (and
  // creates the user if needed) immediately, no email round-trip to follow
  await superAdminAx.post('/api/invitations', { id: org.id, name: org.name, ...invitation })
  console.log(`  + member ${invitation.email} of ${org.name}${invitation.departments ? ` (${invitation.departments.join(', ')})` : ''}`)
}

const ensureNhi = async (org: any, spec: { name: string, role: string, subject: string, department?: string }) => {
  // the superadmin (adminMode) is org-admin of every org, so it can manage NHIs here
  const nhis = (await superAdminAx.get(`/api/organizations/${org.id}/nhis`)).data
  if (nhis.results.find((n: any) => n.name === spec.name)) {
    console.log(`  ✓ service account ${spec.name} of ${org.name} (skipped)`)
    return
  }
  // Inline JWKS from a throwaway keypair: enough for the NHI to exist and be listed
  // in the back-office. The fixture never exchanges tokens, so the private key is
  // discarded (an exchange would need a token signed by it). `checkProvider` at
  // creation validates the issuer and that this JWKS parses.
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'dev-fixtures', alg: 'RS256', use: 'sig' }
  const body: Record<string, unknown> = {
    name: spec.name,
    role: spec.role,
    subject: spec.subject,
    provider: { issuer: K8S_ISSUER, jwks: { keys: [jwk] } }
  }
  if (spec.department) body.department = spec.department
  await superAdminAx.post(`/api/organizations/${org.id}/nhis`, body)
  console.log(`  + service account ${spec.name} of ${org.name}${spec.department ? ` (${spec.department})` : ''}`)
}

const main = async () => {
  const config = await getServerConfig()
  console.log(`→ Seeding ${config.publicUrl}`)

  // the superadmin from `adminCredentials` lives in config, not in mongo, so it
  // is immune to the test-suite cleanup
  superAdminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })

  console.log('\n→ Users')
  await ensureUsers()

  console.log('\n→ Organizations')
  const corp = await ensureOrg(CORP_NAME, email('owner'), {
    description: 'Organisation de démonstration créée par npm run dev-fixtures',
    departmentLabel: 'Agence',
    departments: [{ id: 'paris', name: 'Agence de Paris' }, { id: 'lyon', name: 'Agence de Lyon' }],
    rolesLabels: { admin: 'Administrateur', user: 'Utilisateur' }
  })
  // the 2FA requirement lives on the partner org, never on the main one: an
  // admin of a 2FA org cannot open it until they enrol, and the main fixture org
  // has to stay usable straight after seeding
  const partner = await ensureOrg(PARTNER_NAME, email('member'), {
    description: 'Organisation partenaire de démonstration, ses administrateurs doivent activer la double authentification',
    '2FA': { roles: ['admin'] }
  })

  console.log('\n→ Members')
  await ensureMember(corp, { email: email('member'), role: 'user' })
  await ensureMember(corp, { email: email('depadmin'), role: 'admin', departments: ['paris'] })
  await ensureMember(corp, { email: email('deleting'), role: 'user' })
  // this one does not exist yet: the invitation creates it without a password,
  // which is what makes it a passwordless-login showcase
  await ensureMember(corp, { email: email('passwordless'), role: 'user', departments: ['lyon'] })

  // like Partners above, this assumes the dev config has the feature on (manageNhis)
  console.log('\n→ Service accounts (non-human identities)')
  for (const spec of nhiSpecs) await ensureNhi(corp, spec)

  console.log('\n→ Planned deletion')
  const deletingUser = await findUser(email('deleting'))
  if (deletingUser.plannedDeletion) {
    console.log(`  ✓ ${deletingUser.email} already has a planned deletion (skipped)`)
  } else {
    // far enough in the future that the cleanup cron (which deletes anything
    // planned before today) leaves it alone
    const plannedDeletion = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    await superAdminAx.patch(`/api/users/${deletingUser.id}`, { plannedDeletion })
    console.log(`  + ${deletingUser.email} planned for deletion on ${plannedDeletion}`)
  }

  console.log('\n→ Limits')
  // GET first: it lazily creates the limits doc with a freshly counted
  // consumption, and POST replaces the whole doc, so the count has to be carried
  // over or the back-office would show 0 members used out of MEMBERS_LIMIT
  const corpLimits = (await superAdminAx.get(`/api/limits/organization/${corp.id}`)).data
  if (corpLimits.store_nb_members?.limit === MEMBERS_LIMIT) {
    console.log(`  ✓ ${corp.name} limited to ${MEMBERS_LIMIT} members (skipped)`)
  } else {
    await superAdminAx.post(`/api/limits/organization/${corp.id}`, {
      name: corp.name,
      lastUpdate: new Date().toISOString(),
      store_nb_members: { limit: MEMBERS_LIMIT, consumption: corpLimits.store_nb_members?.consumption ?? 0 }
    })
    console.log(`  + ${corp.name} limited to ${MEMBERS_LIMIT} members`)
  }

  console.log('\n→ Partners')
  const corpFull = (await superAdminAx.get(`/api/organizations/${corp.id}`)).data
  if (corpFull.partners?.find((p: any) => p.id === partner.id)) {
    console.log(`  ✓ partner ${partner.name} of ${corp.name} (skipped)`)
  } else {
    // the superadmin route establishes the partnership immediately, with no
    // invitation workflow and no stored contact email
    await superAdminAx.post(`/api/organizations/${corp.id}/partners/_create`, { id: partner.id, name: partner.name })
    console.log(`  + partner ${partner.name} of ${corp.name}`)
  }

  console.log('\n→ Site')
  const siteHost = `127.0.0.1:${process.env.NGINX_PORT2}`
  const anonymousAx = await axios()
  // a test run that ended without a cleanup can leave a site squatting our host,
  // and the unique index on host would turn that into an opaque 409
  const allSites = (await superAdminAx.get('/api/sites', { params: { showAll: true } })).data
  const squatter = allSites.results.find((s: any) => s.host === siteHost && s._id !== SITE_ID)
  if (squatter) {
    if (!squatter._id.startsWith('test_')) {
      throw new Error(`site ${squatter._id} already uses host ${siteHost}, refusing to touch it — delete it or free the host first`)
    }
    await anonymousAx.delete(`/api/sites/${squatter._id}`, { params: { key: config.secretKeys.sites } })
    console.log(`  - removed leftover test site ${squatter._id} from ${siteHost}`)
  }
  // POST /api/sites is an upsert, so it is idempotent on its own
  await anonymousAx.post('/api/sites', {
    _id: SITE_ID,
    owner: { type: 'organization', id: corp.id, name: corp.name },
    host: siteHost,
    title: 'Portail Dev Fixtures',
    theme: { primaryColor: '#1E88E5' }
  }, { params: { key: config.secretKeys.sites } })
  // authMode is not part of the POST body schema, only a superadmin can set it
  await superAdminAx.patch(`/api/sites/${SITE_ID}`, { authMode: 'ssoBackOffice' })
  await testEnvAx.post('/clear-site-cache')
  console.log(`  ~ site ${SITE_ID} on http://${siteHost}/simple-directory (ssoBackOffice)`)
  console.log('    note: a test run wipes the sites collection, re-run this script to get it back')

  console.log(`\n✔ Fixtures applied. Log in at ${config.publicUrl}/login with ${email('owner')} / ${PASSWORD}`)
}

main().then(
  () => process.exit(0),
  (err: any) => {
    const status = err?.response?.status || err?.status
    const data = err?.response?.data ?? err?.data
    console.error('✘ Fixture injection failed:', err?.message || err)
    if (status) console.error(`   HTTP ${status}`, data ?? '')
    process.exit(1)
  }
)
