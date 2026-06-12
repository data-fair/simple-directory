export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/post-partner-create-req',
  'x-exports': [
    'types',
    'validate'
  ],
  title: 'Post partner create req',
  type: 'object',
  required: [
    'body'
  ],
  properties: {
    body: {
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        contactEmail: {
          type: 'string'
        }
      }
    }
  }
}
