import { Router } from 'express'
import { getSignatureKeys } from './keys-manager.ts'

const router = Router()
export default router

router.get('/.well-known/jwks.json', async (req, res) => {
  const keys = await getSignatureKeys()
  res.json({ keys: keys.webKeys })
})

// keys of the tokens that carry scopes and of at+jwt access tokens; deliberately absent from
// jwks.json so libs released before scopes existed refuse those tokens
router.get('/.well-known/scoped-jwks.json', async (req, res) => {
  const keys = await getSignatureKeys('scoped')
  res.json({ keys: keys.webKeys })
})
