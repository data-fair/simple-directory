/**
 * Dev fixtures: seed the RUNNING dev environment with representative accounts,
 * organizations, a themed secondary site, an organization's main site with its
 * own accounts (site admin) and a partnership, so that every back-office screen
 * has something real to show without clicking through the signup flow by hand.
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
 * - the sites: sites carry a unique index on host, so the test cleanup wipes the
 *   whole collection to stay free to claim any dev host (the accounts living on
 *   the organization's main site survive, they only need their site back);
 * - the service accounts (NHIs): their ids are `nhi-*`, which the test-env sweep
 *   removes wholesale (test NHIs share that id namespace, so the sweep cannot
 *   tell fixture NHIs apart from test leftovers).
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
const MAIN_SITE_ID = 'dev-fixtures-main'
const CORP_NAME = 'Dev Fixtures Corp'
const PARTNER_NAME = 'Dev Fixtures Partner'
// an organization whose main site (isAccountMain) is its back-office: the root admins
// of the organization administer the accounts living on that site (siteAdmin)
const SITE_ORG_NAME = 'Dev Fixtures Site Owner'
const ORG_MAIN_SITE_ID = 'dev-fixtures-org-main-site'
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

// Accounts created on the organization's main site (they carry its host), see SITE_ORG_NAME
const siteUserSpecs = [
  { email: email('siteadmin'), firstName: 'Sacha', lastName: 'SiteAdmin' },
  { email: email('sitedepadmin'), firstName: 'Sam', lastName: 'SiteDepAdmin' },
  { email: email('siteuser'), firstName: 'Suzanne', lastName: 'SiteUser' },
  { email: email('sitedeleting'), firstName: 'Simon', lastName: 'SiteDeleting' },
  { email: email('site2fa'), firstName: 'Selma', lastName: 'Site2FA' }
]

// Non-human identities (service accounts) shown in the org's back-office. Modelled
// on Kubernetes projected service-account tokens: a bound (issuer, subject) pair,
// one with a department to exercise that path.
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

// directoryUrl: the users are created on the site serving it (no host for the main back-office)
const ensureUsers = async (specs: typeof userSpecs, directoryUrl?: string) => {
  const missing = []
  for (const spec of specs) {
    if (await findUser(spec.email)) {
      console.log(`  ✓ user ${spec.email} (skipped)`)
    } else {
      missing.push(spec)
    }
  }
  if (!missing.length) return

  const anonymousAx = await axios(directoryUrl ? { baseURL: directoryUrl } : {})
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

const ensureMember = async (org: any, invitation: { email: string, role: string, departments?: string[], redirect?: string }) => {
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

// a test run that ended without a cleanup can leave a site squatting a host,
// and the unique index on host would turn that into an opaque 409
const freeSiteHost = async (allSites: any[], host: string, siteId: string, secretKey: string) => {
  const squatter = allSites.find((s: any) => s.host === host && s._id !== siteId)
  if (!squatter) return
  if (!squatter._id.startsWith('test_')) {
    throw new Error(`site ${squatter._id} already uses host ${host}, refusing to touch it — delete it or free the host first`)
  }
  await (await axios()).delete(`/api/sites/${squatter._id}`, { params: { key: secretKey } })
  console.log(`  - removed leftover test site ${squatter._id} from ${host}`)
}

const main = async () => {
  const config = await getServerConfig()
  console.log(`→ Seeding ${config.publicUrl}`)

  // the superadmin from `adminCredentials` lives in config, not in mongo, so it
  // is immune to the test-suite cleanup
  superAdminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })

  // the memberships below rely on alwaysAcceptInvitation (on in the dev config), but the
  // invitations tests switch it off on the running server and leave it that way
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })

  console.log('\n→ Users')
  await ensureUsers(userSpecs)

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
  const allSites = (await superAdminAx.get('/api/sites', { params: { showAll: true } })).data.results
  await freeSiteHost(allSites, siteHost, SITE_ID, config.secretKeys.sites)
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

  // the main site document: a site on the publicUrl host. It drives
  // presentation only, and only for the categories in MAIN_SITE_FROM_DB —
  // which is empty by default, so nothing visibly changes until you set
  // MAIN_SITE_FROM_DB='["theme","title","mails","registration"]' in .env.
  // See docs/architecture/main-site-config.md
  const mainSiteHost = new URL(config.publicUrl).host
  await freeSiteHost(allSites, mainSiteHost, MAIN_SITE_ID, config.secretKeys.sites)
  await anonymousAx.post('/api/sites', {
    _id: MAIN_SITE_ID,
    owner: { type: 'organization', id: corp.id, name: corp.name },
    host: mainSiteHost,
    title: 'Annuaire Dev Fixtures',
    theme: { primaryColor: '#6A1B9A' }
  }, { params: { key: config.secretKeys.sites } })
  await superAdminAx.patch(`/api/sites/${MAIN_SITE_ID}`, {
    mails: { contact: 'contact-main@fixtures.dev' },
    tosMessage: 'CGU du site principal (fixtures)'
  })
  await testEnvAx.post('/clear-site-cache')
  console.log(`  ~ main site document ${MAIN_SITE_ID} on ${config.publicUrl}`)
  console.log(`    MAIN_SITE_FROM_DB is currently ${process.env.MAIN_SITE_FROM_DB ?? '[]'}; set it in .env to see it take effect`)
  console.log('    note: a test run wipes the sites collection, re-run this script to get it back')

  console.log('\n→ Organization main site (site admin)')
  // a distinct organization: flagging a main site switches every other site of
  // its owner to onlyOtherSite, which would rewrite the Corp's sites above
  let siteOrg = await findOrg(SITE_ORG_NAME)
  if (siteOrg) {
    console.log(`  ✓ organization ${SITE_ORG_NAME} (skipped)`)
  } else {
    // created by the superadmin (no autoAdmin in adminMode): its admins are accounts
    // of its own site, which cannot exist before the site
    siteOrg = (await superAdminAx.post('/api/organizations', { name: SITE_ORG_NAME })).data
    console.log(`  + organization ${SITE_ORG_NAME} (${siteOrg.id})`)
  }
  siteOrg = (await superAdminAx.patch(`/api/organizations/${siteOrg.id}`, {
    description: 'Organisation dont le site principal sert de back-office, ses administrateurs gèrent les comptes de ce site',
    departments: [{ id: 'nantes', name: 'Agence de Nantes' }]
  })).data

  const orgMainSiteHost = `127.0.0.1:${process.env.NGINX_PORT3}`
  const orgMainSiteUrl = `http://${orgMainSiteHost}/simple-directory`
  await freeSiteHost(allSites, orgMainSiteHost, ORG_MAIN_SITE_ID, config.secretKeys.sites)
  await anonymousAx.post('/api/sites', {
    _id: ORG_MAIN_SITE_ID,
    owner: { type: 'organization', id: siteOrg.id, name: siteOrg.name },
    host: orgMainSiteHost,
    title: 'Back-office Dev Fixtures Site Owner',
    theme: { primaryColor: '#2E7D32' }
  }, { params: { key: config.secretKeys.sites } })
  // isAccountMain also switches the site to onlyLocal: its accounts live there
  await superAdminAx.patch(`/api/sites/${ORG_MAIN_SITE_ID}`, { isAccountMain: true })
  await testEnvAx.post('/clear-site-cache')
  console.log(`  ~ main site ${ORG_MAIN_SITE_ID} of ${SITE_ORG_NAME} on ${orgMainSiteUrl} (isAccountMain, onlyLocal)`)

  await ensureUsers(siteUserSpecs, orgMainSiteUrl)
  // the redirect makes the invitation resolve the accounts of the site, not of the back-office
  const ensureSiteMember = (invitation: { email: string, role: string, departments?: string[] }) =>
    ensureMember(siteOrg, { ...invitation, redirect: orgMainSiteUrl })
  await ensureSiteMember({ email: email('siteadmin'), role: 'admin' })
  await ensureSiteMember({ email: email('sitedepadmin'), role: 'admin', departments: ['nantes'] })
  await ensureSiteMember({ email: email('siteuser'), role: 'user' })
  // sitedeleting and site2fa stay outside of the organization: a site admin manages
  // every account of the site, members or not

  const siteDeletingUser = await findUser(email('sitedeleting'))
  if (siteDeletingUser.plannedDeletion) {
    console.log(`  ✓ ${siteDeletingUser.email} already has a planned deletion (skipped)`)
  } else {
    const plannedDeletion = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    await superAdminAx.patch(`/api/users/${siteDeletingUser.id}`, { plannedDeletion })
    console.log(`  + ${siteDeletingUser.email} planned for deletion on ${plannedDeletion}`)
  }
  const site2FAUser = await findUser(email('site2fa'))
  if (site2FAUser['2FA']?.active) {
    console.log(`  ✓ ${site2FAUser.email} has 2FA active (skipped)`)
  } else {
    // a placeholder secret: the account cannot log in any more, it only shows the 2FA reset
    await testEnvAx.patch(`/user/${encodeURIComponent(site2FAUser.email)}`, { '2FA': { active: true, secret: 'DEVFIXTURESPLACEHOLDER' } })
    console.log(`  + ${site2FAUser.email} with 2FA active (placeholder, cannot log in)`)
  }
  console.log(`    log in at ${orgMainSiteUrl}/login with ${email('siteadmin')} / ${PASSWORD}`)
  console.log(`    then open ${orgMainSiteUrl}/organization/${siteOrg.id} ("Comptes du site")`)

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
