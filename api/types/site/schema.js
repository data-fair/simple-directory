/* eslint-disable no-template-curly-in-string */
export default {
  type: 'object',
  $id: 'https://github.com/data-fair/simple-directory/site',
  title: 'Site',
  layout: {
    title: ''
  },
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
      type: 'string',
      layout: 'none'
    },
    owner: {
      $ref: 'https://github.com/data-fair/lib/session-state#/$defs/account',
      layout: {
        label: 'Propriétaire',
        getItems: {
          url: '${context.sdUrl}/api/accounts?type=organization&q={q}',
          itemsResults: 'data.results',
          itemKey: {
            type: 'js-tpl',
            expr: '${item.type}:${item.id}'
          },
          itemTitle: {
            type: 'js-tpl',
            expr: '${item.name} (${item.id})'
          }
        }
      }
    },
    host: {
      type: 'string',
      title: 'Nom de domaine'
    },
    path: {
      type: 'string',
      title: 'Préfixe de chemin'
    },
    theme: { $ref: 'https://github.com/data-fair/simple-directory/api/config#/$defs/theme' },
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
      layout: {
        if: 'parent.data.authMode === "onlyOtherSite"',
        getItems: 'context.otherSites'
      },
      type: 'string',
      title: "Autre site pour l'authentification"
    },
    reducedPersonalInfoAtCreation: {
      type: 'boolean',
      title: 'Réduire les informations personnelles à la création de compte',
      description: "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email."
    },
    tosMessage: {
      type: 'string',
      layout: 'textarea',
      title: "Message des conditions d'utilisation",
      description: "Vous pouvez remplacer le message des conditions d'utilisation par défaut."
    },
    mails: {
      type: 'object',
      title: 'Emails',
      properties: {
        from: {
          type: 'string',
          title: 'Adresse email de l\'expéditeur',
          description: 'Attention, la configuration doit être effectuée sur le service d\'envoi de mail pour que cet expéditeur ne soit pas considéré comme illégitime.'
        }
      }
    },
    authProviders: {
      layout: {
        if: "parent.data.authMode !== 'onlyOtherSite' && parent.data.authMode !== 'onlyBackOffice'"
      },
      type: 'array',
      title: "Fournisseurs d'identité (SSO)",
      items: { $ref: '#/$defs/authProvider' }
    }
  },
  $defs: {
    authProvider: {
      type: 'object',
      layout: {
        switch: [{
          if: 'summary',
          children: ['title']
        }]
      },
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
      oneOfLayout: {
        label: 'Type de fournisseur',
      },
      oneOf: [
        {
          $ref: '#/$defs/oidcProvider'
        },
        {
          $ref: '#/$defs/saml2Provider'
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
              const: 'otherSite'
            },
            site: {
              type: 'string',
              title: 'Site',
              layout: {
                getItems: 'context.otherSites'
              }
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
              const: 'otherSiteProvider'
            },
            site: {
              type: 'string',
              title: 'Site',
              layout: {
                getItems: 'context.otherSites'
              }
            },
            provider: {
              type: 'string',
              title: 'Fournisseur',
              layout: {
                if: 'parent.data.site',
                getItems: 'context.otherSitesProviders[parent.data.site]'
              }
            }
          }
        }
      ]
    },
    saml2Provider: {
      type: 'object',
      title: 'SAML 2',
      required: [
        'metadata'
      ],
      properties: {
        type: {
          type: 'string',
          const: 'saml2'
        },
        metadata: {
          type: 'string',
          title: 'XML metadata',
          layout: { comp: 'textarea', slots: { before: { name: 'saml-help' } } }
        },
        color: {
          type: 'string',
          title: 'Couleur',
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'URL du logo (petite taille)'
        },
        createMember: {
          $ref: '#/$defs/createMember'
        },
        memberRole: {
          $ref: '#/$defs/memberRole'
        },
        memberDepartment: {
          $ref: '#/$defs/memberDepartment'
        },
        coreIdProvider: {
          $ref: '#/$defs/coreIdProvider'
        },
        redirectMode: {
          $ref: '#/$defs/redirectMode'
        }
      }
    },
    oidcProvider: {
      type: 'object',
      title: 'OpenID Connect',
      required: [
        'discovery',
        'client'
      ],
      properties: {
        type: {
          type: 'string',
          const: 'oidc'
        },
        color: {
          type: 'string',
          title: 'Couleur',
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'URL du logo (petite taille)'
        },
        discovery: {
          type: 'string',
          title: 'URL de découverte',
          description: 'probablement de la forme http://mon-fournisseur/.well-known/openid-configuration',
          layout: { slots: { before: { name: 'oidc-help' } } }
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
              title: 'Identifiant du client',
              layout: { cols: 6 }
            },
            secret: {
              type: ['string', 'object'],
              title: 'Secret',
              writeOnly: true,
              layout: { comp: 'text-field', cols: 6 }
            }
          }
        },
        createMember: {
          $ref: '#/$defs/createMember'
        },
        memberRole: {
          $ref: '#/$defs/memberRole'
        },
        memberDepartment: {
          $ref: '#/$defs/memberDepartment'
        },
        userInfoSource: {
          type: 'string',
          title: 'Mode de récupération des informations de l\'utilisateur',
          default: 'auto',
          oneOf: [
            { const: 'auto', title: 'Auto (endpoint "user_info" si disponible, sinon contenu id_token ou contenu access_token)' },
            { const: 'id_token', title: 'Contenu du jeton id_token' },
            { const: 'access_token', title: 'Contenu du jeton access_token' },
          ]
        },
        ignoreEmailVerified: {
          type: 'boolean',
          title: 'Accepter les utilisateurs aux emails non vérifiés',
          description: "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
        },
        coreIdProvider: {
          $ref: '#/$defs/coreIdProvider'
        },
        redirectMode: {
          $ref: '#/$defs/redirectMode'
        }
      }
    },
    createMember: {
      type: 'object',
      default: {
        type: 'never'
      },
      oneOfLayout: {
        label: 'Créer les utilisateurs en tant que membres',
        help: "Si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
      },
      oneOf: [
        {
          title: 'jamais (ou uniquement sur invitation)',
          properties: {
            type: {
              const: 'never'
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
      layout: { cols: 6, if: 'parent.data.createMember && parent.data.createMember.type !== "never"' },
      oneOfLayout: {
        label: 'Attribution du rôle des membres',
        help: "Le rôle des membres créés automatiquement par ce fournisseur d'identité.",
      },
      default: {
        type: 'none'
      },
      oneOf: [
        {
          title: 'Aucun rôle par défaut (simple utilisateur)',
          properties: {
            type: {
              const: 'none'
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
            },
            defaultRole: {
              type: 'string',
              title: 'Rôle par défaut',
              description: "Si l'attribut n'est pas présent ou ne correspond à aucun rôle connu"
            },
            values: {
              title: 'Correspondances rôle -> liste de valeurs de l\'attribut',
              type: 'object',
              patternPropertiesLayout: {
                messages: {
                  addItem: 'Saisissez un rôle',
                }
              },
              patternProperties: {
                '.*': {
                  title: 'Valeurs de d\'attribut',
                  type: 'array',
                  default: [],
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      ]
    },
    memberDepartment: {
      type: 'object',
      layout: { cols: 6, if: 'parent.data.createMember && parent.data.createMember.type !== "never"' },
      oneOfLayout: {
        label: 'Attribution du département des membres',
        help: "Le département des membres créés automatiquement par ce fournisseur d'identité.",
      },
      default: {
        type: 'none'
      },
      oneOf: [
        {
          title: 'Aucun département (racine de l\'organisation)',
          properties: {
            type: {
              const: 'none'
            }
          }
        },
        {
          title: 'Tout le temps ce département : ',
          required: ['department'],
          properties: {
            type: {
              const: 'static'
            },
            department: {
              type: 'string',
              title: 'Département des membres'
            }
          }
        },
        {
          title: "Département lu dans un attribut de l'identité",
          required: ['attribute'],
          properties: {
            type: {
              const: 'attribute'
            },
            attribute: {
              type: 'string',
              title: "Nom de l'attribut",
              description: 'La valeur de l\'attribut sera comparée à la fois avec l\'id du départment et son libellé'
            },
            required: {
              type: 'boolean',
              title: 'Rendre l\'attribut obligatoire',
              description: "Si cette option n'est pas activée et que l'attribut n'est pas présent l'utilisateur sera dans la racine de l'organisation"
            },
            orgRootValue: {
              type: 'string',
              title: 'Valeur de l\'attribut pour la racine de l\'organisation',
              description: "Si l'attribut a cette valeur l'utilisateur ne sera pas dans un département"
            }
          }
        }
      ]
    },
    coreIdProvider: {
      type: 'boolean',
      title: "Traiter ce fournisseur comme une source principale d'identité",
      description: "Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office"
    },
    redirectMode: {
      type: 'object',
      default: {
        type: 'button'
      },
      oneOfLayout: {
        label: 'Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur',
        help: "Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
      },
      oneOf: [
        {
          title: 'bouton',
          properties: {
            type: {
              const: 'button'
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
