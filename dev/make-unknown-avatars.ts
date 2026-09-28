// Regenerates api/resources/unknown-*.png, the placeholder images served with a 404 when the
// owner of an avatar does not exist (see api/src/avatars/router.ts). Run once, commit the output:
//   node --experimental-strip-types dev/make-unknown-avatars.ts
import { resolve } from 'node:path'
import sharp from 'sharp'
import { mdiAccount, mdiAccountGroup, mdiFamilyTree } from '@mdi/js'
import colors from 'material-colors'

const resources = resolve(import.meta.dirname, '../api/resources')
const icons = { user: mdiAccount, organization: mdiAccountGroup, department: mdiFamilyTree }

for (const [name, path] of Object.entries(icons)) {
  // 100x100 like the generated avatars, white glyph scaled from 24 to 64px and centered
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${colors.grey['500']}"/><g transform="translate(18 18) scale(2.6667)"><path fill="#FFFFFF" d="${path}"/></g></svg>`
  await sharp(Buffer.from(svg)).removeAlpha().png().toFile(resolve(resources, `unknown-${name}.png`))
  console.log(`api/resources/unknown-${name}.png`)
}
