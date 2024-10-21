import { oauthGlobalProviders } from '../oauth/service.ts'
import type { RedirectMode } from '../../config/type/index.ts'

export type PublicAuthProvider = {
  type: string,
  id: string,
  title?: string,
  color?: string,
  img?: string,
  icon?: string,
  redirectMode?: RedirectMode
}

export const providers = () => {
  const providers: PublicAuthProvider[] = []
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
}
