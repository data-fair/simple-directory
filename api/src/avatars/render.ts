import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const resource = (name: string) => resolve(import.meta.dirname, `../../resources/${name}`)

// librsvg resolves the font through fontconfig, which is initialised lazily on the first text
// render: pinning its config here confines it to the Nunito file of api/resources, so the
// avatars render the same everywhere whatever the fonts installed on the machine
process.env.FONTCONFIG_FILE = resource('fonts.conf')

// white mdiRobot glyph (same as the UI's NHI icon), composited as a badge
const robotBadge = readFileSync(resource('robot.png'))

const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// librsvg ignores @font-face, the font-family is resolved by fontconfig (cf resources/fonts.conf)
const svgAvatar = (text: string, color: string, robot?: boolean) => {
  const fontSize = text.length === 3 ? 37 : 47
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
<rect width="100" height="100" fill="${color}"/>
<text x="50" y="${robot ? 44 : 52}" text-anchor="middle" dominant-baseline="central" font-family="Nunito, sans-serif" font-weight="800" font-size="${fontSize}" fill="#fff">${escapeXml(text)}</text>
</svg>`
}

export const makeAvatar = async (text: string, color: string, robot?: boolean): Promise<Buffer> => {
  let img = sharp(Buffer.from(svgAvatar(text, color, robot)))
  if (robot) {
    // bottom-center placement: avatars are displayed round-cropped, and the bottom of the
    // inscribed circle is where a 36px badge fits whole (a corner would be mostly cut off)
    img = img.composite([{ input: robotBadge, left: 32, top: 58 }])
  }
  return await img.png().toBuffer()
}
