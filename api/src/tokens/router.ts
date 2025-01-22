import { Router } from 'express'
import { getSignatureKeys } from './keys-manager.ts'

const router = Router()
export default router

router.get('/.well-known/jwks.json', async (req, res) => {
  const keys = await getSignatureKeys()
  res.json({ keys: keys.webKeys })
})
