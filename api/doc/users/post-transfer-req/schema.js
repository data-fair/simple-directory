export default {
  $id: 'https://github.com/data-fair/simple-directory/users/post-transfer-req',
  title: 'Post user transfer req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      // both omitted (or host empty) means transferring the user back to the main site
      properties: {
        host: { type: 'string' },
        path: { type: 'string' }
      }
    }
  }
}
