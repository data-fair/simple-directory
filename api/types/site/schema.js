export default {
  type: 'object',
  $id: 'https://github.com/data-fair/simple-directory/site',
  title: 'Site',
  'x-exports': [
    'types',
    'resolvedSchema'
  ],
  required: [
    '_id',
    'owner',
    'host',
    'theme',
    'authMode'
  ],
  additionalProperties: false,
  properties: {
    _id: {
      type: 'string'
    },
    owner: {
      $ref: 'https://github.com/data-fair/lib/session-state#/$defs/account'
    },
    host: {
      type: 'string',
      title: 'Nom de domaine'
    },
    path: {
      type: 'string',
      title: 'Préfixe de chemin'
    },
    theme: {
      type: 'object',
      additionalProperties: false,
      required: [
        'primaryColor'
      ],
      properties: {
        primaryColor: {
          type: 'string',
          'x-display': 'color-picker'
        }
      }
    },
    logo: {
      type: 'string',
      title: "URL d'un logo"
    },
    authMode: {
      default: 'onlyBackOffice',
      title: "Mode d'authentification",
      type: 'string',
      oneOf: [
        {
          const: 'onlyLocal',
          title: 'uniquement sur le site lui même'
        },
        {
          const: 'onlyBackOffice',
          title: 'uniquement sur le back-office'
        },
        {
          const: 'ssoBackOffice',
          title: 'sur le site et sur le back-office par SSO'
        },
        {
          const: 'onlyOtherSite',
          title: 'uniquement sur un autre de vos sites'
        }
      ]
    },
    authOnlyOtherSite: {
      'x-if': "parent.value.authMode === 'onlyOtherSite'",
      type: 'string',
      title: "Autre site pour l'authentification",
      'x-fromData': 'context.otherSites'
    },
    reducedPersonalInfoAtCreation: {
      type: 'boolean',
      title: 'Réduire les informations personnelles à la création de compte',
      description: "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email."
    },
    tosMessage: {
      type: 'string',
      'x-display': 'textarea',
      title: "Message des conditions d'utilisation",
      description: "Vous pouvez remplacer le message des conditions d'utilisation par défaut."
    },
    authProviders: {
      'x-if': "parent.value.authMode !== 'onlyOtherSite' && parent.value.authMode !== 'onlyBackOffice'",
      type: 'array',
      title: "Fournisseurs d'identité (SSO)",
      items: {
        type: 'object',
        required: [
          'title',
          'type'
        ],
        properties: {
          id: {
            type: 'string',
            title: 'Identifiant',
            readOnly: true
          },
          title: {
            type: 'string',
            title: 'Nom'
          }
        },
        oneOf: [
          {
            $ref: '#/$defs/oidcProvider'
          },
          {
            type: 'object',
            title: 'Un autre de vos sites',
            required: [
              'site'
            ],
            properties: {
              type: {
                type: 'string',
                title: 'Type de fournisseur',
                const: 'otherSite'
              },
              site: {
                type: 'string',
                title: 'Site',
                'x-fromData': 'context.otherSites'
              }
            }
          },
          {
            type: 'object',
            title: "Un fournisseur d'identité configuré sur autre de vos sites",
            required: [
              'provider'
            ],
            properties: {
              type: {
                type: 'string',
                title: 'Type de fournisseur',
                const: 'otherSiteProvider'
              },
              site: {
                type: 'string',
                title: 'Site',
                'x-fromData': 'context.otherSites'
              },
              provider: {
                type: 'string',
                title: 'Fournisseur',
                'x-if': 'parent.value.site',
                'x-fromData': 'context.otherSitesProviders[parent.value.site]'
              }
            }
          }
        ]
      }
    }
  },
  $defs: {
    oidcProvider: {
      type: 'object',
      title: 'OpenID Connect',
      required: [
        'discovery',
        'client'
      ],
      properties: {
        color: {
          type: 'string',
          title: 'Couleur',
          'x-display': 'color-picker'
        },
        img: {
          type: 'string',
          title: 'URL du logo (petite taille)'
        },
        type: {
          type: 'string',
          title: 'Type de fournisseur',
          const: 'oidc'
        },
        discovery: {
          type: 'string',
          title: 'URL de découverte',
          description: 'probablement de la forme http://mon-fournisseur/.well-known/openid-configuration'
        },
        client: {
          type: 'object',
          required: [
            'id',
            'secret'
          ],
          properties: {
            id: {
              type: 'string',
              title: 'Identifiant du client'
            },
            secret: {
              type: 'string',
              title: 'Secret',
              writeOnly: true
            }
          }
        },
        createMember: {
          type: 'object',
          description: "si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
          default: {
            type: 'never'
          },
          oneOf: [
            {
              title: 'jamais',
              properties: {
                type: {
                  const: 'never',
                  title: 'Créer les utilisateurs en tant que membres'
                }
              }
            },
            {
              title: 'toujours',
              properties: {
                type: {
                  const: 'always'
                }
              }
            },
            {
              title: "quand l'email appartient à un nom de domaine",
              properties: {
                type: {
                  const: 'emailDomain'
                },
                emailDomain: {
                  type: 'string',
                  title: "nom de domaine de l'email"
                }
              }
            }
          ]
        },
        memberRole: {
          type: 'object',
          description: "Le rôle des membres créés automatiquement par ce fournisseur d'identité.",
          default: {
            type: 'none'
          },
          oneOf: [
            {
              title: 'Aucun rôle par défaut (simple utilisateur)',
              properties: {
                type: {
                  const: 'none',
                  title: 'Attribution du rôle des membres'
                }
              }
            },
            {
              title: 'Tout le temps ce rôle : ',
              required: ['role'],
              properties: {
                type: {
                  const: 'static'
                },
                role: {
                  type: 'string',
                  title: 'Rôle des membres'
                }
              }
            },
            {
              title: "Rôle lu dans un attribut de l'identité",
              required: ['attribute'],
              properties: {
                type: {
                  const: 'attribute'
                },
                attribute: {
                  type: 'string',
                  title: "Nom de l'attribut"
                }
              }
            }
          ]
        },
        ignoreEmailVerified: {
          type: 'boolean',
          title: 'Accepter les utilisateurs aux emails non vérifiés',
          description: "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
        },
        coreIdProvider: {
          type: 'boolean',
          title: "Traiter ce fournisseur comme une source principale d'identité",
          description: "Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office"
        },
        redirectMode: {
          type: 'object',
          description: "Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
          default: {
            type: 'button'
          },
          oneOf: [
            {
              title: 'bouton',
              properties: {
                type: {
                  const: 'button',
                  title: 'Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur'
                }
              }
            },
            {
              title: "redirection auto quand l'email appartient à un nom de domaine",
              properties: {
                type: {
                  const: 'emailDomain'
                },
                emailDomain: {
                  type: 'string',
                  title: "nom de domaine de l'email"
                }
              }
            },
            {
              title: 'toujours rediriger implicitement',
              properties: {
                type: {
                  const: 'always'
                }
              }
            }
          ]
        }
      }
    }
  }
}
