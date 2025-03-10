import { Router } from 'express'
import { reqSessionAuthenticated, assertAdminMode, httpError } from '@data-fair/lib-express'
import { createReadStream } from 'node:fs'
import mongo from '#mongo'
import multer from 'multer'
import { parse } from 'csv-parse'
import { nanoid } from 'nanoid'
import type { PasswordList } from '#types'
import { checkForbiddenPassword } from './service.ts'

const router = Router()
export default router

router.get('', async (req, res, next) => {
  assertAdminMode(reqSessionAuthenticated(req))
  const passwordLists = await mongo.passwordLists.find().toArray()
  res.send(passwordLists)
})

const upload = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 200000, files: 1, fields: 0 }
})

router.post('', (req, res, next) => {
  assertAdminMode(reqSessionAuthenticated(req))
  next()
}, upload.single('passwords'), async (req, res, next) => {
  const file = req.file
  if (!file) throw httpError(400, 'missing "passwords" file')
  const id = nanoid()
  const collection = mongo.db.collection('password-list-' + id)
  const iterator = createReadStream(file.path).compose(parse())
  let bulk = collection.initializeUnorderedBulkOp()
  for await (const password of iterator) {
    bulk.insert({ _id: password[0] })
    if (bulk.length === 1000) {
      await bulk.execute()
      bulk = collection.initializeUnorderedBulkOp()
    }
  }
  if (bulk.length) await bulk.execute()
  const stats: any = await collection.aggregate([{ $collStats: { storageStats: {} } }]).next()
  const passwordList = {
    _id: id,
    name: file.originalname,
    active: false,
    createdAt: new Date().toISOString(),
    count: stats.storageStats.count as number,
    size: stats.storageStats.size as number,
  }
  await mongo.passwordLists.insertOne(passwordList)
  res.status(201).send(passwordList)
})

router.patch('/:id', async (req, res, next) => {
  assertAdminMode(reqSessionAuthenticated(req))
  const id = req.params.id
  const name = req.body.name as string | undefined
  const active = req.body.active as boolean | undefined
  const patch: Partial<PasswordList> = {}
  if (name !== undefined) patch.name = name
  if (active !== undefined) patch.active = active
  await mongo.passwordLists.updateOne({ _id: id }, { $set: patch })
  res.send()
})

router.delete('/:id', async (req, res, next) => {
  assertAdminMode(reqSessionAuthenticated(req))
  const id = req.params.id
  await mongo.passwordLists.deleteOne({ _id: id })
  await mongo.db.collection('password-list-' + id).drop()
  res.send()
})

router.post('/_check', async (req, res, next) => {
  assertAdminMode(reqSessionAuthenticated(req))
  const password = req.body.password as string
  res.send(await checkForbiddenPassword(password))
})
