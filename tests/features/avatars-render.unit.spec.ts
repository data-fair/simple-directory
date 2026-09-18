import { strict as assert } from 'node:assert'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from '@playwright/test'

// The initials avatars are rendered by librsvg through fontconfig, which the render module
// pins to the Nunito file of api/resources: the output must not depend on the fonts installed
// on the machine, so it is compared byte for byte with references rendered under that setup.
// Regenerate them with UPDATE_AVATAR_REFERENCES=1 when the rendering changes on purpose.
test.describe('initials avatars rendering', () => {
  test('should render the same PNG whatever the fonts of the machine', async () => {
    const { makeAvatar } = await import('../../api/src/avatars/render.ts')
    const cases = [
      { name: 'initials-avatar-ab.png', text: 'AB', color: '#1976d2', robot: false },
      { name: 'initials-avatar-abc-robot.png', text: 'ABC', color: '#388e3c', robot: true }
    ]
    for (const c of cases) {
      const path = resolve(import.meta.dirname, '../resources', c.name)
      const png = await makeAvatar(c.text, c.color, c.robot)
      if (process.env.UPDATE_AVATAR_REFERENCES) await writeFile(path, png)
      assert.deepEqual(png, await readFile(path), `${c.name} differs from the reference`)
    }
  })
})
