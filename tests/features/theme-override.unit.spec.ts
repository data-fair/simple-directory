// Local color override of a site theme (_t_* query parameters of the
// non-hashed presentation endpoints).

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { defaultTheme, fillTheme, type Theme } from '@data-fair/lib-common-types/theme/index.js'
import { parseThemeOverride, applyThemeOverride, getThemeOverrideWarnings } from '../../api/src/utils/theme-override.ts'

const siteTheme = (patch: Partial<Theme> = {}): Theme => fillTheme({ ...defaultTheme, ...patch } as Theme, defaultTheme as Theme)

test.describe('theme override', () => {
  test('parses the _t_* parameters', () => {
    assert.equal(parseThemeOverride({}), undefined)
    assert.equal(parseThemeOverride({ primary: '#ff0000', _c_foo: 'bar' }), undefined)
    assert.deepEqual(parseThemeOverride({ _t_primary: 'ff0000', _t_secondary: '#00aa00' }), { primary: '#FF0000', secondary: '#00AA00' })
    for (const value of ['red', '#fff', 'ff00000', ['ff0000', '00ff00'], '']) {
      assert.throws(() => parseThemeOverride({ _t_primary: value }), { status: 400 })
    }
  })

  test('derives on-* and contrast corrected text-* in every palette', () => {
    const theme = siteTheme({ dark: true, hc: true, hcDark: true })
    const overridden = applyThemeOverride(theme, { primary: '#FFEB3B' })
    for (const key of ['colors', 'darkColors', 'hcColors', 'hcDarkColors'] as const) {
      assert.equal(overridden[key]!.primary, '#FFEB3B')
      assert.equal(overridden[key]!['on-primary'], '#000000')
    }
    // yellow is unreadable as text on a light background, it is darkened there
    assert.notEqual(overridden.colors['text-primary']?.toUpperCase(), '#FFEB3B')
    // the hc palette asks for more contrast than the default one
    assert.notEqual(overridden.hcColors!['text-primary'], overridden.colors['text-primary'])
    // untouched keys and the source theme are preserved
    assert.equal(overridden.colors.secondary, theme.colors.secondary)
    assert.notEqual(theme.colors.primary, '#FFEB3B')
  })

  test('keeps the other colors of a manually themed site', () => {
    const theme = siteTheme({ colors: { ...defaultTheme.colors, background: '#FFF8E1' } })
    assert.equal(theme.assistedMode, undefined)
    const overridden = applyThemeOverride(theme, { secondary: '#123456' })
    assert.equal(overridden.colors.background, '#FFF8E1')
    assert.equal(overridden.colors.secondary, '#123456')
    assert.equal(overridden.colors['on-secondary'], '#FFFFFF')
  })

  test('reports only the warnings introduced by the override', () => {
    const theme = siteTheme({ hc: true })
    assert.deepEqual(getThemeOverrideWarnings('en', theme, applyThemeOverride(theme, { primary: '#0D47A1' })), [])
    // no on-color reaches AAA on a mid grey, in the high contrast palette
    const warnings = getThemeOverrideWarnings('en', theme, applyThemeOverride(theme, { primary: '#808080' }))
    assert.ok(warnings.length > 0)
    assert.ok(warnings.every(w => w.includes('high contrast')), warnings.join('\n'))
  })
})
