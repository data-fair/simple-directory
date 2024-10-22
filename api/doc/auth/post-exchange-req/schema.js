export default {
  $id: 'https://github.com/data-fair/simple-directory/auth/post-exchange-req',
  title: 'Post exchange token req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id_token: { type: 'string' }
      }
    }
  }
}
