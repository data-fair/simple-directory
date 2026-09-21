// The main site document is the site whose host+path matches publicUrl.
// getMainSitePresentation merges its presentation fields over config.*
// according to config.mainSiteFromDb, and nothing else.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

test.describe('main site document resolver', () => {
  // the mongo client from initMongo is shared by every unit spec in this
  // worker process — do not close it here, the next spec's initMongo() would
  // try to reconnect an already-closed client and take the rest of the
  // project down with it
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    await mongo.sites.deleteMany({ _id: { $regex: /^test_/ } })
    const { getMainSiteDoc } = await import('../../api/src/sites/service.ts')
    const { clearMainSiteCache } = await import('../../api/src/sites/main-site.ts')
    getMainSiteDoc.clear()
    clearMainSiteCache()
  })

  const seedMainSiteDoc = async (doc: any = {}) => {
    const config = (await import('../../api/src/config.ts')).default
    const mongo = (await import('../../api/src/mongo.ts')).default
    const publicUrl = new URL(config.publicUrl)
    await mongo.sites.insertOne({
      _id: 'test_main_site',
      owner: { type: 'organization', id: 'test_org' },
      host: publicUrl.host,
      updatedAt: new Date().toISOString(),
      theme: { ...config.theme, colors: { ...config.theme.colors, primary: '#FF00FF' } },
      title: 'Portail de test',
      mails: { from: 'portal@test.com', contact: 'hello@test.com' },
      tosMessage: 'CGU du portail',
      reducedPersonalInfoAtCreation: true,
      authMode: 'onlyLocal',
      ...doc
    } as any)
    const { getMainSiteDoc } = await import('../../api/src/sites/service.ts')
    getMainSiteDoc.clear()
  }

  const withCategories = async (categories: string[]) => {
    const config = (await import('../../api/src/config.ts')).default
    Object.defineProperty(config, 'mainSiteFromDb', { value: categories, writable: true, configurable: true })
    const { clearMainSiteCache } = await import('../../api/src/sites/main-site.ts')
    clearMainSiteCache()
  }

  test('finds the document sitting on the publicUrl host', async () => {
    await seedMainSiteDoc()
    const { getMainSiteDoc } = await import('../../api/src/sites/service.ts')
    assert.equal((await getMainSiteDoc())?._id, 'test_main_site')
  })

  test('ignores a document on another host', async () => {
    await seedMainSiteDoc({ host: 'somewhere-else.test' })
    const { getMainSiteDoc } = await import('../../api/src/sites/service.ts')
    assert.equal(await getMainSiteDoc(), undefined)
  })

  test('with an empty category list everything comes from env', async () => {
    await seedMainSiteDoc()
    await withCategories([])
    const config = (await import('../../api/src/config.ts')).default
    const { getMainSitePresentation } = await import('../../api/src/sites/main-site.ts')
    const presentation = await getMainSitePresentation()
    assert.equal(presentation.theme.colors.primary, config.theme.colors.primary)
    assert.notEqual(presentation.theme.colors.primary, '#FF00FF')
    assert.equal(presentation.title, undefined)
    assert.equal(presentation.mails.from, config.mails.from)
    assert.equal(presentation.tosMessage, undefined)
    assert.equal(presentation.docKey, undefined)
  })

  test('each category is honoured independently', async () => {
    await seedMainSiteDoc()
    const config = (await import('../../api/src/config.ts')).default
    const { getMainSitePresentation } = await import('../../api/src/sites/main-site.ts')

    await withCategories(['theme'])
    let presentation = await getMainSitePresentation()
    assert.equal(presentation.theme.colors.primary, '#FF00FF')
    assert.equal(presentation.title, undefined)
    assert.equal(presentation.mails.from, config.mails.from)

    await withCategories(['title', 'mails', 'registration'])
    presentation = await getMainSitePresentation()
    assert.equal(presentation.theme.colors.primary, config.theme.colors.primary)
    assert.equal(presentation.title, 'Portail de test')
    assert.equal(presentation.mails.from, 'portal@test.com')
    assert.equal(presentation.mails.contact, 'hello@test.com')
    assert.equal(presentation.tosMessage, 'CGU du portail')
    assert.equal(presentation.reducedPersonalInfoAtCreation, true)
  })

  test('never exposes trust-bearing fields', async () => {
    await seedMainSiteDoc({ authProviders: [{ type: 'saml2', title: 'evil' }], applications: [{ id: 'x' }] })
    await withCategories(['theme', 'title', 'mails', 'registration'])
    const { getMainSiteResources } = await import('../../api/src/sites/main-site.ts')
    const { publicInfo } = await getMainSiteResources()
    assert.equal((publicInfo as any).authProviders, undefined)
    assert.equal((publicInfo as any).applications, undefined)
    assert.equal((publicInfo as any).owner, undefined)
    assert.equal(publicInfo.authMode, 'onlyLocal')
    assert.equal(publicInfo.main, true)
    assert.equal(publicInfo.isAccountMain, true)
  })

  test('the theme css hash describes the css actually produced', async () => {
    await seedMainSiteDoc()
    await withCategories(['theme'])
    const crypto = await import('node:crypto')
    const { getMainSiteResources } = await import('../../api/src/sites/main-site.ts')
    const { themeCss, themeCssHash } = await getMainSiteResources()
    assert.equal(crypto.createHash('md5').update(themeCss).digest('hex'), themeCssHash)
  })

  // Regression: getSiteExtraParams used to call getSiteByUrl directly, with no
  // publicUrl exclusion, while the /api/sites/_* endpoints call reqSite. On a
  // host that is both the publicUrl host and carries a document, the served
  // HTML asked for /api/sites/<document-hash>/_theme.css and got the *env* CSS
  // back under max-age=31536000, immutable.
  test('the hashes injected into the html match the resources actually served', async () => {
    await seedMainSiteDoc()
    const config = (await import('../../api/src/config.ts')).default
    const { getSiteExtraParams } = await import('../../api/src/sites/spa-params.ts')
    const { getMainSiteResources } = await import('../../api/src/sites/main-site.ts')
    const siteUrl = config.publicUrl.replace(/\/simple-directory$/, '')

    for (const categories of [[], ['theme'], ['theme', 'title']]) {
      await withCategories(categories)
      const params = await getSiteExtraParams(siteUrl)
      const resources = await getMainSiteResources()
      assert.equal(params.THEME_CSS_HASH, resources.themeCssHash, `categories=${categories.join(',')}`)
      assert.equal(params.PUBLIC_SITE_INFO_HASH, resources.publicInfoHash, `categories=${categories.join(',')}`)
    }

    await withCategories(['title'])
    assert.equal((await getSiteExtraParams(siteUrl)).SITE_TITLE, 'Portail de test')
    await withCategories([])
    assert.equal((await getSiteExtraParams(siteUrl)).SITE_TITLE, 'Simple Directory')
  })
})
