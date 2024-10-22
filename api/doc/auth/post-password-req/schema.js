export default {
  $id: 'https://github.com/data-fair/simple-directory/auth/post-password-req',
  title: 'Post password auth req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['email', 'password'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        org: { type: 'string' },
        dep: { type: 'string' },
        '2fa': { type: 'string' },
        membersOnly: { type: 'boolean' },
        adminMode: { type: 'boolean' },
        rememberMe: { type: 'boolean' },
        orgStorage: { type: 'boolean' }
      }
    },
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        redirect: { type: 'string' },
        org: { type: 'string' },
        dep: { type: 'string' }
      }
    }
  }
}
