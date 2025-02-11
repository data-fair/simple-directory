export default {
  $id: 'https://github.com/data-fair/simple-directory/ldap-params',
  'x-exports': ['types'],
  type: 'object',
  title: 'ldap params',
  additionalProperties: false,
  required: ['url', 'baseDN', 'users', 'organizations', 'members'],
  properties: {
    url: { type: 'string' },
    clientOptions: { type: 'object' },
    searchUserDN: { type: 'string' },
    searchUserPassword: { type: ['string', 'object'] },
    baseDN: { type: 'string' },
    readonly: { type: 'boolean' },
    overwrite: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['members', 'departments', 'organizations', 'partners']
      }
    },
    cacheMS: {
      type: 'number'
    },
    users: {
      type: 'object',
      additionalProperties: false,
      required: ['objectClass', 'dnKey', 'mapping'],
      properties: {
        objectClass: { type: 'string' },
        dnKey: { type: 'string' },
        mapping: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'string'
            }
          }
        },
        overwrite: {
          type: 'array',
          items: { $ref: '#/$defs/userOverwrite' }
        },
        extraFilters: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },
    organizations: {
      type: 'object',
      additionalProperties: false,
      required: ['objectClass', 'dnKey', 'mapping'],
      properties: {
        staticSingleOrg: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        objectClass: { type: 'string' },
        dnKey: { type: 'string' },
        mapping: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'string'
            }
          }
        },
        overwrite: {
          type: 'array',
          items: { $ref: '#/$defs/organizationOverwrite' }
        },
        extraFilters: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },
    members: {
      type: 'object',
      additionalProperties: false,
      required: ['role'],
      properties: {
        organizationAsDC: { type: ['number', 'boolean'] },
        onlyWithRole: { type: 'boolean' },
        role: {
          type: 'object',
          additionalProperties: false,
          required: ['default'],
          properties: {
            attr: { type: 'string' },
            default: { type: 'string' },
            values: {
              type: 'object',
              patternProperties: {
                '.*': {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        department: {
          type: 'object',
          additionalProperties: false,
          required: ['attr'],
          properties: {
            attr: { type: 'string' },
            captureRegexp: { type: 'string' }
          }
        },
        overwrite: {
          type: 'array',
          items: { $ref: '#/$defs/memberOverwrite' }
        }
      }
    }
  },
  $defs: {
    memberOverwrite: {
      type: 'object',
      required: ['orgId'],
      title: 'member overwrite',
      properties: {
        orgId: { type: 'string' },
        department: { type: 'string' },
        role: { type: 'string' },
        email: { type: 'string' }
      }
    },
    userOverwrite: {
      type: 'object',
      required: ['email'],
      title: 'user overwrite',
      properties: {
        email: { type: 'string' }
      }
    },
    organizationOverwrite: {
      type: 'object',
      required: ['id'],
      title: 'organization overwrite',
      properties: {
        id: { type: 'string' }
      }
    }
  }
}
