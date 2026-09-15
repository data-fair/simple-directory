// Regenerates api/resources/unknown-*.png, the placeholder images served with a 404 when the
// owner of an avatar does not exist (see api/src/avatars/router.ts). Run once, commit the output:
//   node --experimental-strip-types dev/make-unknown-avatars.ts
// Needs ImageMagick (`convert`) with SVG support, which is why the images are committed rather
// than rendered at runtime (the docker image only ships GraphicsMagick for the initials avatars).
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { mdiAccount, mdiAccountGroup, mdiFamilyTree } from '@mdi/js'

const resources = resolve(import.meta.dirname, '../api/resources')
const icons = { user: mdiAccount, organization: mdiAccountGroup, department: mdiFamilyTree }

for (const [name, path] of Object.entries(icons)) {
  // 100x100 like the generated avatars, grey 500 background, white glyph scaled from 24 to 64px and centered
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#9E9E9E"/><g transform="translate(18 18) scale(2.6667)"><path fill="#FFFFFF" d="${path}"/></g></svg>`
  const svgFile = resolve(resources, `unknown-${name}.svg`)
  writeFileSync(svgFile, svg)
  execFileSync('convert', ['-background', 'none', svgFile, resolve(resources, `unknown-${name}.png`)])
  execFileSync('rm', [svgFile])
  console.log(`api/resources/unknown-${name}.png`)
}
