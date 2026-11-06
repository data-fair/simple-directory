// the decision posted by the consent page; the rules that depend on the interaction (an NHI of the
// organization) are checked in code. No scopes: a grant carries the requested scopes within the
// registration of the client or the scopes of the NHI, never a subselection
export default {
  $id: 'https://github.com/data-fair/simple-directory/oauth/post-consent-req',
  title: 'Post oauth consent req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['decision'],
      properties: {
        decision: { type: 'string', enum: ['allow', 'deny'] },
        account: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'id'],
          properties: {
            type: { type: 'string', enum: ['user', 'organization'] },
            id: { type: 'string', maxLength: 100 },
            department: { type: 'string', maxLength: 100 },
            // an account as /details lists it may be posted back as is
            name: { type: 'string' },
            departmentName: { type: 'string' }
          }
        },
        lifetime: { type: 'string', enum: ['1d', '7d', '30d', '90d', '1y'] },
        nhi: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: { id: { type: 'string', maxLength: 100 } }
        }
      }
    }
  }
}
