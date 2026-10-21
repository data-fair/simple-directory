import config from '#config'
import JWK from './JWK.ts'
import user from '#types/user/schema.js'
import organization from '#types/organization/schema.js'
import mail from '#types/mail/schema.js'
import { vocabulary } from '../src/scopes/vocabulary.ts'

const authenticationParams = [{
  name: 'Authorization',
  in: 'header',
  description: '"Bearer" followed with a white space and a JWT',
  required: false,
  schema: {
    type: 'string'
  }
}, {
  name: 'id_token',
  in: 'cookie',
  description: 'JWT',
  required: false,
  schema: {
    type: 'string'
  }
}]

const oauthScopes = vocabulary.scopeDescriptions('en')

export default {
  openapi: '3.0.0',
  info: Object.assign({
    title: 'API documentation',
  }, config.info),
  servers: [{
    url: config.publicUrl,
    description: process.env.NODE_ENV || 'development' + ' server.'
  }],
  components: {
    securitySchemes: {
      oauth2: {
        type: 'oauth2',
        description: 'Access tokens issued by simple-directory. A token without scope claim is an unrestricted first party session. The token endpoint (RFC 6749) never takes a client secret. A non-human identity obtains a token either with the JWT bearer grant (grant_type urn:ietf:params:oauth:grant-type:jwt-bearer, client_id = the NHI id and assertion = a JWT signed by the identity provider declared on the NHI, RFC 7523) or, when the NHI declares inline jwks, with client_credentials authenticated by a private_key_jwt client assertion. Both accept an optional space-delimited scope and a resource indicator (RFC 8707). A person authorizes an application with the authorization code flow and PKCE (S256, required), on the consent screen of simple-directory, and the application refreshes its token with a rotating refresh token. Disabled unless the deployment enables the authorization server.',
        flows: {
          // OpenAPI has no jwt-bearer flow, clientCredentials is the closest entry. The endpoint is an
          // RFC 7523 assertion exchange: do not send a client secret.
          clientCredentials: {
            tokenUrl: '/simple-directory/api/oauth/token',
            scopes: oauthScopes
          },
          // clients are public (PKCE is required, no client secret): the site clients of dashboards and
          // the dynamic clients (client id metadata document or registration) of MCP agents
          authorizationCode: {
            authorizationUrl: '/simple-directory/api/oauth/authorize',
            tokenUrl: '/simple-directory/api/oauth/token',
            refreshUrl: '/simple-directory/api/oauth/token',
            scopes: oauthScopes
          }
        }
      }
    }
  },
  paths: {
    '/.well-known/jwks.json': {
      get: {
        tags: ['JWKS'],
        summary: 'JSON Web Key Set',
        responses: {
          200: {
            description: 'JSON Web Key Set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keys: {
                      type: 'array',
                      items: JWK
                    }
                  }
                },
                examples: [{
                  keys: [{
                    kty: 'RSA',
                    n: 'tbzexDIgsl8qlZ4sOPgBnCgkumaK5mi6fE-Vc8Gk3bpmerMOIEMoj3dzkheBVD3R_1y9LSidmyJBouh8yqT7wGNzsBlB8-6W2ihnrCtg437RKksjfcHheKeYV_Rv7v9jkNQj171KCbptCQV0orwDhhslWwNPS4Ss4Vwy0Ly1rMGyLI8qwinw7f2p5N6xDxo2tBUxqdfOrx-_YlpWajZgftYRkVITKiMeSPHMsdWxmX_qH1BqoOIy4-9zuBQFt_QxSSwjqWLKyH22ave69a3J_1_urqYLuCSxPnV8t0FquR6fghBiaB22DBbiQHtlUEnOrAUGlktF0lH_q6g1T4DYdQ',
                    e: 'AQAB',
                    kid: 'simple-directory-default',
                    alg: 'RS256',
                    use: 'sig'
                  }]
                }]
              }
            }
          }
        }
      }
    },
    '/api/auth/passwordless': {
      post: {
        tags: ['Authentication'],
        summary: 'To get a JWT from an email',
        operationId: 'authPasswordless',
        parameters: [{
          name: 'redirect',
          in: 'query',
          description: 'A redirect URL',
          required: false,
          schema: {
            type: 'string'
          }
        }],
        requestBody: {
          description: 'Email of the account',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    description: 'The main email of the account',
                    type: 'string',
                    format: 'email'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'A JWT, or the input redirect URL concatenated with a JWT'
          },
          400: {
            description: 'Input data has wrong format'
          },
          404: {
            description: 'There is no user associated with this email'
          }
        }
      }
    },
    '/api/auth/password': {
      post: {
        tags: ['Authentication'],
        summary: 'To get a JWT from an email',
        operationId: 'authPasswordless',
        parameters: [{
          name: 'redirect',
          in: 'query',
          description: 'A redirect URL',
          required: false,
          schema: {
            type: 'string'
          }
        }],
        requestBody: {
          description: 'Credentials of the account',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    description: 'The main email of the account',
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    description: 'The main email of the account',
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'A JWT, or the input redirect URL concatenated with a JWT'
          },
          400: {
            description: 'Input data has wrong format'
          },
          404: {
            description: 'There is no user associated with this email'
          }
        }
      }
    },
    '/api/auth/nhi-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Exchange a non-human identity assertion for a session',
        deprecated: true,
        description: 'Deprecated for bearer use, prefer the JWT bearer grant of /api/oauth/token. Its purpose remains the cookie session: it sets the session cookies in addition to returning an access token.',
        operationId: 'authNhiToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['client_id', 'assertion'],
                properties: {
                  client_id: { type: 'string', description: 'The id of the non-human identity' },
                  assertion: { type: 'string', description: 'A JWT signed by the identity provider declared on the NHI' },
                  scope: { type: 'string', description: 'Space-delimited scopes' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'The session cookies are set, the body contains an access_token, token_type and expires_in' },
          401: { description: 'Invalid credentials (uniform for every failure cause)' }
        }
      }
    },
    '/api/auth/exchange': {
      post: {
        tags: ['Authentication'],
        summary: 'Renew a JWT',
        operationId: 'authExchange',
        parameters: authenticationParams,
        responses: {
          200: {
            description: 'A JWT'
          },
          401: {
            description: 'Authentication error'
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Fetch user data',
        parameters: authenticationParams.concat([{
          name: 'id',
          in: 'path',
          description: 'Unique identifier of the user',
          required: true,
          schema: {
            type: 'string'
          }
        }]),
        responses: {
          200: {
            description: 'The requested user',
            content: {
              'application/json': {
                schema: user
              }
            }
          },
          401: {
            description: 'Authentication error'
          },
          403: {
            description: 'Not enough permissions'
          },
          404: {
            description: 'There is no user associated with this id'
          }
        }
      }
    },
    '/api/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'Retrieve a list of organizations',
        // one alternative per accepted scope (the scopes of one requirement are all needed)
        security: vocabulary.acceptedScopes('organizations', 'read').map(scope => ({ oauth2: [scope] })),
        parameters: authenticationParams.concat([{
          name: 'ids',
          in: 'query',
          description: 'Unique identifier of organizations to filter',
          required: false,
          schema: {
            type: 'string'
          }
        }, {
          name: 'is-member',
          in: 'query',
          description: 'Filter organizations the user belong to',
          required: false,
          schema: {
            type: 'boolean'
          }
        }]),
        responses: {
          200: {
            description: 'The organizations list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: {
                      type: 'number'
                    },
                    results: {
                      type: 'array',
                      items: organization
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication error'
          }
        }
      }
    },
    '/api/mails': {
      post: {
        tags: ['mails'],
        summary: 'Send emails to users and organizations members',
        parameters: [{
          name: 'key',
          in: 'query',
          description: 'A secret from the config to secure this specific operation.',
          required: true,
          schema: {
            type: 'string'
          }
        }],
        requestBody: {
          description: 'The email definition',
          required: true,
          content: {
            'application/json': {
              schema: mail
            }
          }
        },
        responses: {
          200: {
            description: 'A JWT, or the input redirect URL concatenated with a JWT'
          },
          400: {
            description: 'Input data has wrong format'
          }
        }
      }
    }
  }
}
