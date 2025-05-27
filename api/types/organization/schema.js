const ldapParamsSchema = import('../ldap-params/schema.js')

const partialLdapParamsSchema = { ...ldapParamsSchema, required: ['url', 'baseDN'] }

export default {
  $id: 'https://github.com/data-fair/simple-directory/organization',
  'x-exports': ['types'],
  title: 'Organization',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name'],
  properties: {
    created: { $ref: 'https://github.com/data-fair/simple-directory/partial#/$defs/modifier' },
    updated: { $ref: 'https://github.com/data-fair/simple-directory/partial#/$defs/modifier' },
    id: {
      description: 'The unique id of the organization',
      type: 'string'
    },
    name: {
      description: 'Name of the organization',
      type: 'string',
      maxLength: 150
    },
    description: {
      description: 'Description of the organization',
      type: 'string'
    },
    roles: {
      description: 'The list or roles used inside this organization',
      type: 'array',
      items: {
        type: 'string'
      }
    },
    rolesLabels: {
      description: 'How the different roles should be labelled inside this organization',
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    '2FA': {
      properties: {
        roles: {
          description: 'The list of roles that require 2FA inside this organization',
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },
    departmentLabel: {
      description: 'How the department concept is named in the context of this organization',
      type: 'string'
    },
    departments: {
      description: 'The list of departments inside the organization',
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          }
        }
      }
    },
    members: {
      description: 'The members of the organization',
      type: 'array',
      readOnly: true,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'role'],
        properties: {
          id: {
            type: 'string',
            description: 'Identifier of the account for this member'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            description: 'Role for this member in this organization'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          departments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Identifier of the department'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'user'],
                  description: 'Role for this member in this department'
                }
              }
            }
          }
        }
      }
    },
    avatarUrl: {
      description: "URL of this organization's avatar",
      type: 'string',
      readOnly: true
    },
    orgStorage: {
      type: 'object',
      description: 'Manage a secondary user storage per-organization (super admin only)',
      additionalProperties: false,
      required: ['type'],
      properties: {
        active: { type: 'boolean' },
        type: {
          type: 'string',
          enum: ['ldap']
        },
        readonly: { type: 'boolean' },
        config: partialLdapParamsSchema
      }
    },
    partners: {
      type: 'array',
      readOnly: true,
      items: { $ref: 'https://github.com/data-fair/simple-directory/partner' }
    },
    host: {
      description: 'Site where the organization was created (leave empty if it is the main public site or if siteOrgs option is not activated)',
      type: 'string'
    },
    path: {
      type: 'string',
      title: 'Path prefix of the site where the user was created'
    }
  }
}
