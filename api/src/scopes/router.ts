import { Router } from 'express'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { reqI18n } from '#i18n'
import { getKnownScopes } from './service.ts'

const router = Router()
export default router

router.get('', async (req, res) => {
  reqSessionAuthenticated(req)
  const { localeCode, messages } = reqI18n(req)
  res.send({ scopes: await getKnownScopes(localeCode, messages.scopes) })
})
