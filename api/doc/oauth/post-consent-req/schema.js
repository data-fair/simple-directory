const scopes = { type: 'array', minItems: 1, maxItems: 50, items: { type: 'string', maxLength: 100 } }

// the decision posted by the consent page; the rules that depend on the interaction (scopes within
// the request, an NHI of the organization) are checked in code
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
        scopes,
        lifetime: { type: 'string', enum: ['1d', '7d', '30d', '90d', '1y'] },
        nhi: {
          oneOf: [{
            type: 'object',
            additionalProperties: false,
            required: ['id'],
            properties: { id: { type: 'string', maxLength: 100 } }
          }, {
            type: 'object',
            additionalProperties: false,
            required: ['create'],
            properties: {
              create: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'role', 'scopes'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 150 },
                  role: { type: 'string', minLength: 1, maxLength: 100 },
                  scopes
                }
              }
            }
          }]
        }
      }
    }
  }
}
