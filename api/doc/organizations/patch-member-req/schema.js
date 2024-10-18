export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/patch-member-req',
  title: 'Patch member req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['query', 'body'],
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        department: {
          type: 'string'
        }
      }
    },
    body: {
      type: 'object',
      title: 'Patch member body',
      additionalProperties: false,
      required: ['role'],
      properties: {
        role: {
          type: 'string'
        },
        department: {
          type: 'string'
        }
      }
    }
  }
}
