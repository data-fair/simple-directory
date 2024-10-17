import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import UserSchema from '#types/user/schema.js'

export default jsonSchema(UserSchema)
  .removeReadonlyProperties()
  .removeProperties(['created', 'updated'])
  .removeFromRequired('organizations')
  .removeId()
  .appendTitle(' writable')
  .schema
