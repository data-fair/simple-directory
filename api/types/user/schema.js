export default {
  $id: 'https://github.com/data-fair/simple-directory/user',
  'x-exports': [
    'types'
  ],
  title: 'User',
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'email',
    'name',
    'created',
    'updated',
    'organizations'
  ],
  properties: {
    created: { $ref: 'https://github.com/data-fair/simple-directory/partial#/$defs/modifier' },
    updated: { $ref: 'https://github.com/data-fair/simple-directory/partial#/$defs/modifier' },
    id: {
      description: 'The unique id of the user',
      type: 'string'
    },
    email: {
      description: 'The main email of the user',
      type: 'string'
    },
    emailConfirmed: {
      type: 'boolean'
    },
    host: {
      description: 'Site where the user created his account (leave empty if it is the main public site)',
      type: 'string'
    },
    firstName: {
      description: 'First name of the user',
      type: 'string',
      maxLength: 100
    },
    lastName: {
      description: 'Family name of the user',
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      readOnly: true
    },
    isAdmin: {
      description: 'Is this user a global admin (independant of organizations)',
      type: 'boolean'
    },
    maxCreatedOrgs: {
      description: 'The maximum number of organizations this user can create. -1 means indeterminate number. Fallback to a global default value if not defined.',
      type: 'number'
    },
    birthday: {
      description: 'Birth date of the user',
      type: 'string',
      format: 'date-time'
    },
    avatarUrl: {
      description: "URL of this user's avatar",
      type: 'string',
      readOnly: true
    },
    oauth: {
      description: 'Identity rattached to oauth providers',
      type: 'object',
      readOnly: true
    },
    oidc: {
      description: 'Identity rattached to OIDC providers',
      type: 'object',
      readOnly: true
    },
    defaultOrg: {
      type: 'string'
    },
    defaultDep: {
      type: 'string'
    },
    ignorePersonalAccount: {
      type: 'boolean',
      default: false
    },
    plannedDeletion: {
      type: 'string',
      format: 'date'
    },
    organizations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'name',
          'role'
        ],
        properties: {
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
      }
    },
    coreIdProvider: {
      type: 'object',
      title: 'Is the user coming from a core ID provider ?',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: {
          type: 'string'
        },
        id: {
          type: 'string'
        }
      }
    },
    orgStorage: {
      type: 'boolean'
    },
    password: {
      type: 'object'
    },
    '2FA': {
      type: 'object',
      additionalProperties: false,
      required: ['active', 'recovery'],
      properties: {
        active: {
          type: 'boolean'
        }
      }
    },
    logged: {
      type: 'string',
      format: 'date-time'
    }
  }
}
