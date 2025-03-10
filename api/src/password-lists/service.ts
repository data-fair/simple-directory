import mongo from '#mongo'

export const checkForbiddenPassword = async (password: string) => {
  const passwordLists = await mongo.passwordLists.find({ active: true }).toArray()
  for (const passwordList of passwordLists) {
    const collection = mongo.db.collection<{ _id: string }>('password-list-' + passwordList._id)
    if (await collection.findOne({ _id: password })) {
      return { found: true, passwordList }
    }
  }
  return { found: false }
}
