export default {
  // absolute $id so that the absolute $ref below can be resolved against it; without
  // one the types builder falls back to the bare directory name, which is not a valid
  // URL base (cf @data-fair/lib-utils makeLocalDefs)
  $id: 'https://github.com/data-fair/simple-directory/mail',
  title: 'Mail',
  type: 'object',
  required: ['to', 'subject'],
  'x-exports': ['types', 'validate'],
  additionalProperties: false,
  properties: {
    sender: {
      $ref: 'https://github.com/data-fair/lib/session-state#/$defs/account'
    },
    to: {
      type: 'array',
      items: {
        oneOf: [{
          type: 'string'
        }, {
          type: 'object',
          required: ['type', 'id'],
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              const: 'user'
            },
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            }
          }
        }, {
          type: 'object',
          required: ['type', 'id'],
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              const: 'organization'
            },
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            role: {
              type: 'string'
            },
            department: {
              type: 'string'
            },
            departmentName: {
              type: 'string'
            }
          }
        }]
      }
    },
    replyTo: {
      type: 'string'
    },
    subject: {
      type: 'string'
    },
    text: {
      type: 'string'
    },
    html: {
      type: 'string'
    }
  }
}
