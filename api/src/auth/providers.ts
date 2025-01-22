import { oauthGlobalProviders, getOidcProviderId, saml2GlobalProviders, getSiteByUrl } from '#services'
import type { Site, PublicAuthProvider } from '#types'
import _slug from 'slugify'

const slug = _slug.default

export const publicProviders = async (site?: Site) => {
  const providers: PublicAuthProvider[] = []
  for (const p of saml2GlobalProviders()) {
    providers.push({
      type: 'saml2',
      id: p.id,
      title: p.title,
      color: p.color,
      icon: p.icon,
      img: p.img,
      redirectMode: p.redirectMode
    })
  }
  for (const p of oauthGlobalProviders()) {
    providers.push({
      type: 'oauth',
      id: p.id,
      title: p.title,
      color: p.color,
      icon: p.icon,
      img: p.img,
      redirectMode: p.redirectMode
    })
  }

  if (site) {
    const siteProviders = await site.authProviders || []
    for (const p of siteProviders) {
      if (p.type === 'oidc') {
        providers.push({
          type: p.type,
          id: getOidcProviderId(p.discovery),
          title: p.title as string,
          color: p.color,
          img: p.img,
          redirectMode: p.redirectMode
        })
      }
      if (p.type === 'otherSite') {
        const otherSiteUrl = (p.site.startsWith('http://') || p.site.startsWith('https://')) ? p.site : `https://${p.site}`
        const otherSite = await getSiteByUrl(otherSiteUrl)
        if (otherSite && otherSite.owner.type === site.owner.type && otherSite.owner.id === site.owner.id) {
          providers.push({ type: 'otherSite', id: slug(otherSite.host + (otherSite.path ?? ''), { lower: true, strict: true }), title: p.title as string, color: site.theme.colors.primary, img: site.theme.logo, host: otherSite.host })
        }
      }
    }
  }

  return providers
}
