// Regression coverage for the theme merge in api/src/config.ts.
//
// @data-fair/lib-common-types/theme/index.js ships `bodyFontFamily: "Nunito"`
// plus a large `bodyFontFamilyCss` @font-face block. The SD config merges
// that lib default under any THEME_* env vars. If the operator provides
// only their own `bodyFontFamilyCss` via THEME_BODY_FONT_FAMILY_CSS env,
// the previous merge order still kept the lib's `bodyFontFamily: "Nunito"`
// AND prepended the lib's Nunito @font-face declarations to the env CSS.
// Net effect: operator's font CSS was shadowed by the lib's Nunito block.
//
// This test asserts that when the operator provides a font config via env,
// the lib's matching font defaults are stripped before merging — so the
// env-provided values are what _public.js advertises to the client.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

test.describe('Theme defaults merge (config.ts)', () => {
  test('lib font defaults stay when no env override is set', async () => {
    delete process.env.THEME_BODY_FONT_FAMILY
    delete process.env.THEME_BODY_FONT_FAMILY_CSS
    delete process.env.THEME_HEADING_FONT_FAMILY
    delete process.env.THEME_HEADING_FONT_FAMILY_CSS
    // Re-import so the side-effectful config merge re-runs against the
    // current process env.
    const mod = await import(`../../api/src/config.ts?nofontenv=${Date.now()}`)
    assert.equal(mod.default.theme.bodyFontFamily, 'Nunito')
    assert.match(mod.default.theme.bodyFontFamilyCss, /font-family:Nunito/)
  })

  test('env-provided bodyFontFamilyCss strips the lib font defaults', async () => {
    process.env.THEME_BODY_FONT_FAMILY_CSS = '@font-face{font-family:Inter;src:url(\'/studio/assets/fonts/inter.woff2\') format(\'woff2\');}'
    const mod = await import(`../../api/src/config.ts?env-css=${Date.now()}`)
    // The env CSS wins …
    assert.match(mod.default.theme.bodyFontFamilyCss, /font-family:Inter/)
    // … and is not shadowed by Nunito declarations from the lib default.
    assert.doesNotMatch(mod.default.theme.bodyFontFamilyCss, /font-family:Nunito/)
    // The matching bodyFontFamily lib default is dropped (operator hasn't
    // provided a name yet; we don't want Nunito as a stowaway).
    assert.equal(mod.default.theme.bodyFontFamily, undefined)
  })

  test('env-provided bodyFontFamily wins over Nunito', async () => {
    delete process.env.THEME_BODY_FONT_FAMILY_CSS
    process.env.THEME_BODY_FONT_FAMILY = 'Roboto'
    const mod = await import(`../../api/src/config.ts?env-name=${Date.now()}`)
    assert.equal(mod.default.theme.bodyFontFamily, 'Roboto')
    // bodyFontFamilyCss is dropped because the operator chose a font name
    // but didn't ship its @font-face — emitting Nunito's CSS under a
    // "Roboto" name would be worse than no CSS at all.
    assert.equal(mod.default.theme.bodyFontFamilyCss, undefined)
  })
})
