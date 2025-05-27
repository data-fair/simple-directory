export default {
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
