import { test, expect } from '../support/e2e-fixtures.ts'

test.describe('Default theme', () => {
  test('produces no readability warnings on /dev page', async ({ page, appUrl }) => {
    await page.goto(appUrl('/dev'))

    // The /dev page renders one <colors-preview> per theme variant
    // (colors, darkColors, hcColors, hcDarkColors). Each variant emits one
    // <v-alert type="warning"> per message returned by getColorsWarnings —
    // so the default theme must yield zero alerts across all four variants.
    await expect(page.getByRole('heading', { name: 'Theme' })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.v-container h3')).toHaveCount(4)

    const warnings = page.locator('.v-alert').filter({ hasText: /lisible|readable/ })
    await expect(warnings).toHaveCount(0)
  })
})
