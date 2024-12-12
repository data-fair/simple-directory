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
    'organizations'
  ],
  properties: {
    created: {
      allOf: [
        { $ref: 'https://github.com/data-fair/simple-directory/partial#/$defs/modifier' },
        {
          properties: {
            host: {
              type: 'string'
            },
            path: {
              type: 'string'
            }
          }
        }
      ]
    },
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
    path: {
      type: 'string',
      title: 'Path prefix of the site where the user was created'
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
      type: 'boolean',
      readOnly: true
    },
    maxCreatedOrgs: {
      description: 'The maximum number of organizations this user can create. -1 means indeterminate number. Fallback to a global default value if not defined.',
      type: 'number'
    },
    birthday: {
      description: 'Birth date of the user',
      type: 'string',
      format: 'date'
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
    saml2: {
      description: 'Identity rattached to SAML 2 providers',
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
      items: { $ref: '#/$defs/fullOrganizationMembership' }
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
    },
    sessions: {
      type: 'array',
      items: { $ref: '#/$defs/serverSession' }
    }
  },
  $defs: {
    fullOrganizationMembership: {
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
        },
        readOnly: {
          type: 'boolean'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        }
      }
    },
    serverSession: {
      type: 'object',
      additionalProperties: false,
      required: ['deviceName', 'id', 'createdAt'],
      properties: {
        deviceName: {
          type: 'string'
        },
        id: {
          type: 'string'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        },
        lastKeepalive: {
          type: 'string',
          format: 'date-time'
        }
      }
    }
  }
}
