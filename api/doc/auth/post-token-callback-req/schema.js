export default {
  $id: 'https://github.com/data-fair/simple-directory/auth/post-token-callback-req',
  title: 'Post token callback req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id_token: { type: 'string' },
        id_token_org: { type: 'string' },
        id_token_dep: { type: 'string' },
        redirect: { type: 'string' }
      }
    }
  }
}
