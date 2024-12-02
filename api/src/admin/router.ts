import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { Router } from 'express'
import { session } from '@data-fair/lib-express/index.js'

const router = Router()
export default router

// All routes in the router are only for the super admins of the service
router.use(async (req, res, next) => {
  await session.reqAdminMode(req)
  next()
})

let info = { version: process.env.NODE_ENV }
try { info = JSON.parse(await readFile(resolve(import.meta.dirname, '../../BUILD.json'), 'utf8')) } catch (err) {}
router.get('/info', (req, res) => {
  res.send(info)
})