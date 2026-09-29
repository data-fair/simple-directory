import { getSiteByUrl, isMainSiteUrl } from './service.ts'
import { getThemeCssHash } from '../utils/theme.ts'
import { getPublicSiteInfoHash } from '../utils/public-site-info.ts'
import { getEffectiveMainSite } from './main-site.ts'

// the site title is injected as text into the served HTML, it must not be able to break out of its tag.
// it must also survive the micro-template passes that follow: '{' is neutralized so a title cannot
// smuggle a later placeholder (CSP_NONCE is substituted after us), and '$' is doubled because
// microTemplate interpolates through String.replace, where $&, $` and $' are replacement patterns.
const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\{/g, '&#123;')
  .replace(/\$/g, '$$$$')

/**
 * Values injected into the served index.html for a given site URL.
 *
 * This mirrors reqSite(): on the main host the document is never read raw, it
 * goes through getEffectiveMainSite like everywhere else. Reading it raw here
 * while the /api/sites/_* endpoints read env is what made the immutable
 * theme-css cache key describe bytes it was not serving — the hash came from
 * the document, the CSS came from the environment, and the mismatch was cached
 * for a year.
 */
export const getSiteExtraParams = async (siteUrl: string) => {
  const site = (isMainSiteUrl(siteUrl) ? undefined : await getSiteByUrl(siteUrl)) ?? await getEffectiveMainSite()
  return {
    THEME_CSS_HASH: getThemeCssHash(site),
    PUBLIC_SITE_INFO_HASH: getPublicSiteInfoHash(site),
    // the SPA sets the definitive title, this one fills the <title> of the
    // served document, which the W3C validator requires (RGAA 8.2)
    SITE_TITLE: escapeHtml(site.title || 'Simple Directory')
  }
}
