/* eslint-disable no-template-curly-in-string */
export default {
  type: 'object',
  $id: 'https://github.com/data-fair/simple-directory/site',
  title: 'Site',
  'x-i18n-title': {
    fr: 'Site',
    en: 'Site',
    de: 'Website',
    it: 'Sito',
    pt: 'Site',
    es: 'Sitio'
  },
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
        'x-i18n-label': {
          fr: 'Propriétaire',
          en: 'Owner',
          de: 'Besitzer',
          it: 'Proprietario',
          pt: 'Proprietário',
          es: 'Propietario'
        },
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
      title: 'Nom de domaine',
      'x-i18n-title': {
        fr: 'Nom de domaine',
        en: 'Domain name',
        de: 'Domainname',
        it: 'Nome di dominio',
        pt: 'Nome de domínio',
        es: 'Nombre de dominio'
      }
    },
    path: {
      type: 'string',
      title: 'Préfixe de chemin',
      'x-i18n-title': {
        fr: 'Préfixe de chemin',
        en: 'Path prefix',
        es: 'Prefijo de ruta',
        it: 'Prefisso di percorso',
        pt: 'Prefixo de caminho',
        de: 'Pfadpräfix'
      }
    },
    title: {
      type: 'string',
      title: 'Titre du site',
      'x-i18n-title': {
        fr: 'Titre du site',
        en: 'Site title',
        es: 'Título del sitio',
        it: 'Titolo del sito',
        pt: 'Título do site',
        de: 'Website-Titel'
      }
    },
    isAccountMain: {
      type: 'boolean',
      title: 'Site principal du compte',
      'x-i18n-title': {
        fr: 'Site principal du compte',
        en: 'Main site of the account',
        de: 'Hauptwebsite des Kontos',
        it: 'Sito principale dell\'account',
        pt: 'Site principal da conta',
        es: 'Sitio principal de la cuenta'
      }
    },
    theme: { $ref: 'https://github.com/data-fair/lib/theme' },
    authMode: {
      deprecated: true,
      layout: {
        if: '!context.otherSites.some(s => s.isAccountMain) && !parent.data.isAccountMain'
      },
      default: 'onlyBackOffice',
      title: "Mode d'authentification (déprécié, utilisez \"Site principal du compte\")",
      'x-i18n-title': {
        fr: "Mode d'authentification (déprécié, utilisez \"Site principal du compte\")",
        en: 'Authentication mode (deprecated, use "Main site of the account")',
        es: 'Modo de autenticación (obsoleto, use "Sitio principal de la cuenta")',
        it: 'Modalità di autenticazione (deprecata, usa "Sito principale dell\'account")',
        pt: 'Modo de autenticação (obsoleto, use "Site principal da conta")',
        de: 'Authentifizierungsmodus (veraltet, verwenden Sie "Hauptwebsite des Kontos")'
      },
      type: 'string',
      oneOf: [
        {
          const: 'onlyLocal',
          title: 'uniquement sur le site lui même',
          'x-i18n-title': {
            fr: 'uniquement sur le site lui même',
            en: 'only on the site itself',
            es: 'solo en el sitio mismo',
            it: 'solo sul sito stesso',
            pt: 'apenas no site em si',
            de: 'nur auf der Website selbst'
          }
        },
        {
          const: 'onlyBackOffice',
          title: 'uniquement sur le back-office',
          'x-i18n-title': {
            fr: 'uniquement sur le back-office',
            en: 'only on the back-office',
            es: 'solo en el back-office',
            it: 'solo sul back-office',
            pt: 'apenas no back-office',
            de: 'nur im Back-Office'
          }
        },
        {
          const: 'ssoBackOffice',
          title: 'sur le site et sur le back-office par SSO',
          'x-i18n-title': {
            fr: 'sur le site et sur le back-office par SSO',
            en: 'on the site and on the back-office via SSO',
            es: 'en el sitio y en el back-office mediante SSO',
            it: 'sul sito e sul back-office tramite SSO',
            pt: 'no site e no back-office via SSO',
            de: 'auf der Website und im Back-Office über SSO'
          }
        },
        {
          const: 'onlyOtherSite',
          title: 'uniquement sur un autre de vos sites',
          'x-i18n-title': {
            fr: 'uniquement sur un autre de vos sites',
            en: 'only on another of your sites',
            es: 'solo en otro de sus sitios',
            it: 'solo su un altro dei tuoi siti',
            pt: 'apenas em outro de seus sites',
            de: 'nur auf einer anderen Ihrer Websites'
          }
        }
      ]
    },
    authOnlyOtherSite: {
      deprecated: true,
      layout: {
        if: 'parent.data.authMode === "onlyOtherSite" && !context.otherSites.some(s => s.isAccountMain) && !parent.data.isAccountMain',
        getItems: 'context.otherSites'
      },
      type: 'string',
      title: "Autre site pour l'authentification (déprécié, utilisez \"Site principal du compte\")",
      'x-i18n-title': {
        fr: "Autre site pour l'authentification (déprécié, utilisez \"Site principal du compte\")",
        en: 'Other site for authentication (deprecated, use "Main site of the account")',
        es: 'Otro sitio para autenticación (obsoleto, use "Sitio principal de la cuenta")',
        it: 'Altro sito per l\'autenticazione (deprecato, usa "Sito principale dell\'account")',
        pt: 'Outro site para autenticação (obsoleto, use "Site principal da conta")',
        de: 'Andere Website für die Authentifizierung (veraltet, verwenden Sie "Hauptwebsite des Kontos")'
      }
    },
    reducedPersonalInfoAtCreation: {
      type: 'boolean',
      title: 'Réduire les informations personnelles à la création de compte',
      'x-i18n-title': {
        fr: 'Réduire les informations personnelles à la création de compte',
        en: 'Reduce personal information at account creation',
        es: 'Reducir la información personal en la creación de cuenta',
        it: 'Riduci le informazioni personali alla creazione dell\'account',
        pt: 'Reduzir as informações pessoais na criação da conta',
        de: 'Reduzieren Sie persönliche Informationen bei der Kontoerstellung'
      },
      description: "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.",
      'x-i18n-description': {
        fr: "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.",
        en: 'If this option is enabled, the personal information requested at account creation will be reduced to the email.',
        es: 'Si esta opción está activada, la información personal solicitada en la creación de la cuenta se reducirá al correo electrónico.',
        it: "Se questa opzione è attivata, le informazioni personali richieste alla creazione dell'account saranno ridotte all'email.",
        pt: 'Se esta opção estiver ativada, as informações pessoais solicitadas na criação da conta serão reduzidas ao e-mail.',
        de: 'Wenn diese Option aktiviert ist, werden die bei der Kontoerstellung angeforderten persönlichen Informationen auf die E-Mail reduziert.'
      }
    },
    tosMessage: {
      type: 'string',
      layout: 'textarea',
      title: "Message des conditions d'utilisation",
      'x-i18n-title': {
        fr: "Message des conditions d'utilisation",
        en: 'Terms of service message',
        es: 'Mensaje de términos de servicio',
        it: 'Messaggio dei termini di servizio',
        pt: 'Mensagem dos termos de serviço',
        de: 'Nachricht der Nutzungsbedingungen'
      },
      description: "Vous pouvez remplacer le message des conditions d'utilisation par défaut.",
      'x-i18n-description': {
        fr: "Vous pouvez remplacer le message des conditions d'utilisation par défaut.",
        en: 'You can replace the default terms of service message.',
        es: 'Puede reemplazar el mensaje predeterminado de los términos de servicio.',
        it: 'Puoi sostituire il messaggio predefinito dei termini di servizio.',
        pt: 'Você pode substituir a mensagem padrão dos termos de serviço.',
        de: 'Sie können die Standard-Nutzungsbedingungen-Nachricht ersetzen.'
      }
    },
    mails: {
      type: 'object',
      title: 'Emails',
      'x-i18n-title': {
        fr: 'Emails',
        en: 'Emails',
        es: 'Correos electrónicos',
        it: 'Email',
        pt: 'E-mails',
        de: 'E-Mails'
      },
      properties: {
        from: {
          type: 'string',
          title: 'Adresse email de l\'expéditeur',
          'x-i18n-title': {
            fr: 'Adresse email de l\'expéditeur',
            en: 'Sender email address',
            es: 'Dirección de correo electrónico del remitente',
            it: 'Indirizzo email del mittente',
            pt: 'Endereço de e-mail do remetente',
            de: 'E-Mail-Adresse des Absenders'
          },
          description: 'Attention, la configuration doit être effectuée sur le service d\'envoi de mail pour que cet expéditeur ne soit pas considéré comme illégitime.',
          'x-i18n-description': {
            fr: 'Attention, la configuration doit être effectuée sur le service d\'envoi de mail pour que cet expéditeur ne soit pas considéré comme illégitime.',
            en: 'Attention, the configuration must be set up on the mail sending service so that this sender is not considered illegitimate.',
            es: 'Atención, la configuración debe realizarse en el servicio de envío de correo para que este remitente no sea considerado ilegítimo.',
            it: 'Attenzione, la configurazione deve essere effettuata sul servizio di invio di posta in modo che questo mittente non sia considerato illegittimo.',
            pt: 'Atenção, a configuração deve ser feita no serviço de envio de e-mail para que este remetente não seja considerado ilegítimo.',
            de: 'Achtung, die Konfiguration muss im E-Mail-Versanddienst eingerichtet werden, damit dieser Absender nicht als unrechtmäßig gilt.'
          }
        }
      }
    },
    authProviders: {
      layout: {
        if: "parent.data.authMode !== 'onlyOtherSite' && parent.data.authMode !== 'onlyBackOffice'"
      },
      type: 'array',
      title: "Fournisseurs d'identité (SSO)",
      'x-i18n-title': {
        fr: "Fournisseurs d'identité (SSO)",
        en: 'Identity providers (SSO)',
        es: 'Proveedores de identidad (SSO)',
        it: 'Provider di identità (SSO)',
        pt: 'Provedores de identidade (SSO)',
        de: 'Identitätsanbieter (SSO)'
      },
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
          'x-i18n-title': {
            fr: 'Identifiant',
            en: 'Identifier',
            es: 'Identificador',
            it: 'Identificatore',
            pt: 'Identificador',
            de: 'Identifikator'
          },
          readOnly: true
        },
        title: {
          type: 'string',
          title: 'Nom',
          'x-i18n-title': {
            fr: 'Nom',
            en: 'Name',
            es: 'Nombre',
            it: 'Nome',
            pt: 'Nome',
            de: 'Name'
          }
        }
      },
      oneOfLayout: {
        label: 'Type de fournisseur',
        'x-i18n-label': {
          fr: 'Type de fournisseur',
          en: 'Provider type',
          es: 'Tipo de proveedor',
          it: 'Tipo di provider',
          pt: 'Tipo de provedor',
          de: 'Anbietertyp'
        }
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
          'x-i18n-title': {
            fr: 'Un autre de vos sites',
            en: 'Another of your sites',
            es: 'Otro de sus sitios',
            it: 'Un altro dei tuoi siti',
            pt: 'Outro de seus sites',
            de: 'Eine andere Ihrer Websites'
          },
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
              'x-i18n-title': {
                fr: 'Site',
                en: 'Site',
                es: 'Sitio',
                it: 'Sito',
                pt: 'Site',
                de: 'Website'
              },
              layout: {
                getItems: 'context.otherSites'
              }
            }
          }
        },
        {
          type: 'object',
          title: "Un fournisseur d'identité configuré sur autre de vos sites",
          'x-i18n-title': {
            fr: "Un fournisseur d'identité configuré sur autre de vos sites",
            en: 'An identity provider configured on another of your sites',
            es: 'Un proveedor de identidad configurado en otro de sus sitios',
            it: 'Un provider di identità configurato su un altro dei tuoi siti',
            pt: 'Um provedor de identidade configurado em outro de seus sites',
            de: 'Ein Identitätsanbieter, der auf einer anderen Ihrer Websites konfiguriert ist'
          },
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
              'x-i18n-title': {
                fr: 'Site',
                en: 'Site',
                es: 'Sitio',
                it: 'Sito',
                pt: 'Site',
                de: 'Website'
              },
              layout: {
                getItems: 'context.otherSites'
              }
            },
            provider: {
              type: 'string',
              title: 'Fournisseur',
              'x-i18n-title': {
                fr: 'Fournisseur',
                en: 'Provider',
                es: 'Proveedor',
                it: 'Provider',
                pt: 'Provedor',
                de: 'Anbieter'
              },
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
          'x-i18n-title': {
            fr: 'XML metadata',
            en: 'XML metadata',
            es: 'XML metadata',
            it: 'XML metadata',
            pt: 'XML metadata',
            de: 'XML-Metadaten'
          },
          layout: { comp: 'textarea', slots: { before: { name: 'saml-help' } } }
        },
        color: {
          type: 'string',
          title: 'Couleur',
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'URL du logo (petite taille)',
          'x-i18n-title': {
            fr: 'URL du logo (petite taille)',
            en: 'Logo URL (small size)',
            es: 'URL del logo (tamaño pequeño)',
            it: 'URL del logo (dimensione piccola)',
            pt: 'URL do logotipo (tamanho pequeno)',
            de: 'Logo-URL (kleine Größe)'
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
          'x-i18n-title': {
            fr: 'Couleur',
            en: 'Color',
            es: 'Color',
            it: 'Colore',
            pt: 'Cor',
            de: 'Farbe'
          },
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'URL du logo (petite taille)',
          'x-i18n-title': {
            fr: 'URL du logo (petite taille)',
            en: 'Logo URL (small size)',
            es: 'URL del logo (tamaño pequeño)',
            it: 'URL del logo (dimensione piccola)',
            pt: 'URL do logotipo (tamanho pequeno)',
            de: 'Logo-URL (kleine Größe)'
          }
        },
        discovery: {
          type: 'string',
          title: 'URL de découverte',
          'x-i18n-title': {
            fr: 'URL de découverte',
            en: 'Discovery URL',
            es: 'URL de descubrimiento',
            it: 'URL di scoperta',
            pt: 'URL de descoberta',
            de: 'Entdeckungs-URL'
          },
          description: 'probablement de la forme http://mon-fournisseur/.well-known/openid-configuration',
          'x-i18n-description': {
            fr: 'probablement de la forme http://mon-fournisseur/.well-known/openid-configuration',
            en: 'probably in the form http://mon-fournisseur/.well-known/openid-configuration',
            es: 'probablemente en la forma http://mon-fournisseur/.well-known/openid-configuration',
            it: 'probabilmente nella forma http://mon-fournisseur/.well-known/openid-configuration',
            pt: 'provavelmente na forma http://mon-fournisseur/.well-known/openid-configuration',
            de: 'wahrscheinlich in der Form http://mon-fournisseur/.well-known/openid-configuration'
          },
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
              'x-i18n-title': {
                fr: 'Identifiant du client',
                en: 'Client ID',
                es: 'ID del cliente',
                it: 'ID del client',
                pt: 'ID do cliente',
                de: 'Client-ID'
              },
              layout: { cols: 6 }
            },
            secret: {
              type: ['string', 'object'],
              title: 'Secret',
              'x-i18n-title': {
                fr: 'Secret',
                en: 'Secret',
                es: 'Secreto',
                it: 'Segreto',
                pt: 'Segredo',
                de: 'Geheimnis'
              },
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
          'x-i18n-title': {
            fr: 'Mode de récupération des informations de l\'utilisateur',
            en: 'User information retrieval mode',
            es: 'Modo de recuperación de información del usuario',
            it: 'Modalità di recupero delle informazioni utente',
            pt: 'Modo de recuperação de informações do usuário',
            de: 'Modus zur Abrufung von Benutzerinformationen'
          },
          default: 'auto',
          oneOf: [
            {
              const: 'auto',
              title: 'Auto (endpoint "user_info" si disponible, sinon contenu id_token ou contenu access_token)',
              'x-i18n-title': {
                fr: 'Auto (endpoint "user_info" si disponible, sinon contenu id_token ou contenu access_token)',
                en: 'Auto (endpoint "user_info" if available, otherwise content id_token or content access_token)',
                es: 'Auto (endpoint "user_info" si está disponible, de lo contrario contenido id_token o contenido access_token)',
                it: 'Auto (endpoint "user_info" se disponibile, altrimenti contenuto id_token o contenuto access_token)',
                pt: 'Auto (endpoint "user_info" se disponível, caso contrário conteúdo id_token ou conteúdo access_token)',
                de: 'Auto (Endpoint "user_info" falls verfügbar, sonst Inhalt id_token oder Inhalt access_token)'
              }
            },
            {
              const: 'id_token',
              title: 'Contenu du jeton id_token',
              'x-i18n-title': {
                fr: 'Contenu du jeton id_token',
                en: 'Content of id_token',
                es: 'Contenido del id_token',
                it: 'Contenuto del id_token',
                pt: 'Conteúdo do id_token',
                de: 'Inhalt des id_token'
              }
            },
            {
              const: 'access_token',
              title: 'Contenu du jeton access_token',
              'x-i18n-title': {
                fr: 'Contenu du jeton access_token',
                en: 'Content of access_token',
                es: 'Contenido del access_token',
                it: 'Contenuto del access_token',
                pt: 'Conteúdo do access_token',
                de: 'Inhalt des access_token'
              }
            },
          ]
        },
        ignoreEmailVerified: {
          type: 'boolean',
          title: 'Accepter les utilisateurs aux emails non vérifiés',
          'x-i18n-title': {
            fr: 'Accepter les utilisateurs aux emails non vérifiés',
            en: 'Accept users with unverified emails',
            es: 'Aceptar usuarios con correos electrónicos no verificados',
            it: 'Accetta utenti con email non verificati',
            pt: 'Aceitar usuários com e-mails não verificados',
            de: 'Benutzer mit nicht verifizierten E-Mails akzeptieren'
          },
          description: "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.",
          'x-i18n-description': {
            fr: "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.",
            en: 'By default, if the identity provider returns email_verified=false, authentication is rejected. Check this option to change this behavior.',
            es: 'Por defecto, si el proveedor de identidad devuelve email_verified=false, se rechaza la autenticación. Marque esta opción para cambiar este comportamiento.',
            it: "Per impostazione predefinita, se il provider di identità restituisce email_verified=false, l'autenticazione viene rifiutata. Selezionare questa opzione per modificare questo comportamento.",
            pt: 'Por padrão, se o provedor de identidade retornar email_verified=false, a autenticação será rejeitada. Marque esta opção para alterar este comportamento.',
            de: 'Standardmäßig wird die Authentifizierung abgelehnt, wenn der Identitätsanbieter email_verified=false zurückgibt. Aktivieren Sie diese Option, um dieses Verhalten zu ändern.'
          }
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
        'x-i18n-label': {
          fr: 'Créer les utilisateurs en tant que membres',
          en: 'Create users as members',
          es: 'Crear usuarios como miembros',
          it: 'Crea utenti come membri',
          pt: 'Criar usuários como membros',
          de: 'Benutzer als Mitglieder erstellen'
        },
        help: "Si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
        'x-i18n-help': {
          fr: "Si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
          en: 'If this option is enabled, all users created through this identity provider will automatically be members of the organization owning the site.',
          es: 'Si esta opción está activada, todos los usuarios creados a través de este proveedor de identidad serán automáticamente miembros de la organización propietaria del sitio.',
          it: "Se questa opzione è attivata, tutti gli utenti creati tramite questo provider di identità saranno automaticamente membri dell'organizzazione proprietaria del sito.",
          pt: 'Se esta opção estiver ativada, todos os usuários criados por meio deste provedor de identidade serão automaticamente membros da organização proprietária do site.',
          de: 'Wenn diese Option aktiviert ist, werden alle Benutzer, die über diesen Identitätsanbieter erstellt werden, automatisch Mitglieder der Organisation, die die Website besitzt.'
        }
      },
      oneOf: [
        {
          title: 'jamais (ou uniquement sur invitation)',
          'x-i18n-title': {
            fr: 'jamais (ou uniquement sur invitation)',
            en: 'never (or only by invitation)',
            es: 'nunca (o solo por invitación)',
            it: 'mai (o solo per invito)',
            pt: 'nunca (ou apenas por convite)',
            de: 'niemals (oder nur per Einladung)'
          },
          properties: {
            type: {
              const: 'never'
            }
          }
        },
        {
          title: 'toujours',
          'x-i18n-title': {
            fr: 'toujours',
            en: 'always',
            es: 'siempre',
            it: 'sempre',
            pt: 'sempre',
            de: 'immer'
          },
          properties: {
            type: {
              const: 'always'
            }
          }
        },
        {
          title: "quand l'email appartient à un nom de domaine",
          'x-i18n-title': {
            fr: "quand l'email appartient à un nom de domaine",
            en: 'when the email belongs to a domain',
            es: 'cuando el correo electrónico pertenece a un dominio',
            it: 'quando l\'email appartiene a un dominio',
            pt: 'quando o e-mail pertence a um domínio',
            de: 'wenn die E-Mail zu einer Domain gehört'
          },
          properties: {
            type: {
              const: 'emailDomain'
            },
            emailDomain: {
              type: 'string',
              title: "nom de domaine de l'email",
              'x-i18n-title': {
                fr: "nom de domaine de l'email",
                en: 'email domain name',
                es: 'nombre de dominio del correo electrónico',
                it: 'nome di dominio dell\'email',
                pt: 'nome de domínio do e-mail',
                de: 'Domainname der E-Mail'
              }
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
        'x-i18n-label': {
          fr: 'Attribution du rôle des membres',
          en: 'Member role assignment',
          es: 'Asignación de roles de miembros',
          it: 'Assegnazione del ruolo dei membri',
          pt: 'Atribuição de função de membros',
          de: 'Zuweisung der Mitgliedsrolle'
        },
        help: "Le rôle des membres créés automatiquement par ce fournisseur d'identité.",
        'x-i18n-help': {
          fr: "Le rôle des membres créés automatiquement par ce fournisseur d'identité.",
          en: 'The role of members automatically created by this identity provider.',
          es: 'El rol de los miembros creados automáticamente por este proveedor de identidad.',
          it: 'Il ruolo dei membri creati automaticamente da questo provider di identità.',
          pt: 'A função dos membros criados automaticamente por este provedor de identidade.',
          de: 'Die Rolle der Mitglieder, die automatisch von diesem Identitätsanbieter erstellt werden.'
        }
      },
      default: {
        type: 'none'
      },
      oneOf: [
        {
          title: 'Aucun rôle par défaut (simple utilisateur)',
          'x-i18n-title': {
            fr: 'Aucun rôle par défaut (simple utilisateur)',
            en: 'No default role (regular user)',
            es: 'Sin rol predeterminado (usuario regular)',
            it: 'Nessun ruolo predefinito (utente regolare)',
            pt: 'Nenhuma função padrão (usuário regular)',
            de: 'Keine Standardrolle (regulärer Benutzer)'
          },
          properties: {
            type: {
              const: 'none'
            }
          }
        },
        {
          title: 'Tout le temps ce rôle : ',
          'x-i18n-title': {
            fr: 'Tout le temps ce rôle : ',
            en: 'Always this role: ',
            es: 'Siempre este rol: ',
            it: 'Sempre questo ruolo: ',
            pt: 'Sempre esta função: ',
            de: 'Immer diese Rolle: '
          },
          required: ['role'],
          properties: {
            type: {
              const: 'static'
            },
            role: {
              type: 'string',
              title: 'Rôle des membres',
              'x-i18n-title': {
                fr: 'Rôle des membres',
                en: 'Member role',
                es: 'Rol de miembros',
                it: 'Ruolo dei membri',
                pt: 'Função dos membros',
                de: 'Mitgliedsrolle'
              }
            }
          }
        },
        {
          title: "Rôle lu dans un attribut de l'identité",
          'x-i18n-title': {
            fr: "Rôle lu dans un attribut de l'identité",
            en: 'Role read from an identity attribute',
            es: 'Rol leído de un atributo de identidad',
            it: 'Ruolo letto da un attributo di identità',
            pt: 'Função lida de um atributo de identidade',
            de: 'Rolle aus einem Identitätsattribut gelesen'
          },
          required: ['attribute'],
          properties: {
            type: {
              const: 'attribute'
            },
            attribute: {
              type: 'string',
              title: "Nom de l'attribut",
              'x-i18n-title': {
                fr: "Nom de l'attribut",
                en: 'Attribute name',
                es: 'Nombre del atributo',
                it: 'Nome dell\'attributo',
                pt: 'Nome do atributo',
                de: 'Attributname'
              }
            },
            defaultRole: {
              type: 'string',
              title: 'Rôle par défaut',
              'x-i18n-title': {
                fr: 'Rôle par défaut',
                en: 'Default role',
                es: 'Rol predeterminado',
                it: 'Ruolo predefinito',
                pt: 'Função padrão',
                de: 'Standardrolle'
              },
              description: "Si l'attribut n'est pas présent ou ne correspond à aucun rôle connu",
              'x-i18n-description': {
                fr: "Si l'attribut n'est pas présent ou ne correspond à aucun rôle connu",
                en: 'If the attribute is not present or does not match any known role',
                es: 'Si el atributo no está presente o no coincide con ningún rol conocido',
                it: "Se l'attributo non è presente o non corrisponde a nessun ruolo noto",
                pt: 'Se o atributo não estiver presente ou não corresponder a nenhuma função conhecida',
                de: 'Wenn das Attribut nicht vorhanden ist oder keinem bekannten Rollen entspricht'
              }
            },
            values: {
              title: 'Correspondances rôle -> liste de valeurs de l\'attribut',
              'x-i18n-title': {
                fr: 'Correspondances rôle -> liste de valeurs de l\'attribut',
                en: 'Role -> attribute value mappings',
                es: 'Mapeos de rol -> valores de atributo',
                it: 'Mappature ruolo -> valori attributo',
                pt: 'Mapeamentos de função -> valores de atributo',
                de: 'Rollen -> Attributwert-Zuordnungen'
              },
              type: 'object',
              patternPropertiesLayout: {
                messages: {
                  addItem: 'Saisissez un rôle',
                  'x-i18n-addItem': {
                    fr: 'Saisissez un rôle',
                    en: 'Enter a role',
                    es: 'Ingrese un rol',
                    it: 'Inserisci un ruolo',
                    pt: 'Insira uma função',
                    de: 'Geben Sie eine Rolle ein'
                  }
                }
              },
              patternProperties: {
                '.*': {
                  title: 'Valeurs de d\'attribut',
                  'x-i18n-title': {
                    fr: 'Valeurs de d\'attribut',
                    en: 'Attribute values',
                    es: 'Valores de atributo',
                    it: 'Valori dell\'attributo',
                    pt: 'Valores de atributo',
                    de: 'Attributwerte'
                  },
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
        'x-i18n-label': {
          fr: 'Attribution du département des membres',
          en: 'Member department assignment',
          es: 'Asignación de departamento de miembros',
          it: 'Assegnazione del dipartimento dei membri',
          pt: 'Atribuição de departamento de membros',
          de: 'Zuweisung des Abteilungsmitglieds'
        },
        help: "Le département des membres créés automatiquement par ce fournisseur d'identité.",
        'x-i18n-help': {
          fr: "Le département des membres créés automatiquement par ce fournisseur d'identité.",
          en: 'The department of members automatically created by this identity provider.',
          es: 'El departamento de los miembros creados automáticamente por este proveedor de identidad.',
          it: 'Il dipartimento dei membri creati automaticamente da questo provider di identità.',
          pt: 'O departamento dos membros criados automaticamente por este provedor de identidade.',
          de: 'Das Abteilungsmitglied, das automatisch von diesem Identitätsanbieter erstellt wird.'
        }
      },
      default: {
        type: 'none'
      },
      oneOf: [
        {
          title: 'Aucun département (racine de l\'organisation)',
          'x-i18n-title': {
            fr: 'Aucun département (racine de l\'organisation)',
            en: 'No department (organization root)',
            es: 'Sin departamento (raíz de la organización)',
            it: 'Nessun dipartimento (radice dell\'organizzazione)',
            pt: 'Nenhum departamento (raiz da organização)',
            de: 'Kein Abteilungsmitglied (Organisationswurzel)'
          },
          properties: {
            type: {
              const: 'none'
            }
          }
        },
        {
          title: 'Tout le temps ce département : ',
          'x-i18n-title': {
            fr: 'Tout le temps ce département : ',
            en: 'Always this department: ',
            es: 'Siempre este departamento: ',
            it: 'Sempre questo dipartimento: ',
            pt: 'Sempre este departamento: ',
            de: 'Immer dieses Abteilungsmitglied: '
          },
          required: ['department'],
          properties: {
            type: {
              const: 'static'
            },
            department: {
              type: 'string',
              title: 'Département des membres',
              'x-i18n-title': {
                fr: 'Département des membres',
                en: 'Member department',
                es: 'Departamento de miembros',
                it: 'Dipartimento dei membri',
                pt: 'Departamento de membros',
                de: 'Abteilungsmitglied'
              }
            }
          }
        },
        {
          title: "Département lu dans un attribut de l'identité",
          'x-i18n-title': {
            fr: "Département lu dans un attribut de l'identité",
            en: 'Department read from an identity attribute',
            es: 'Departamento leído de un atributo de identidad',
            it: 'Dipartimento letto da un attributo di identità',
            pt: 'Departamento lido de um atributo de identidade',
            de: 'Abteilungsmitglied aus einem Identitätsattribut gelesen'
          },
          required: ['attribute'],
          properties: {
            type: {
              const: 'attribute'
            },
            attribute: {
              type: 'string',
              title: "Nom de l'attribut",
              'x-i18n-title': {
                fr: "Nom de l'attribut",
                en: 'Attribute name',
                es: 'Nombre del atributo',
                it: 'Nome dell\'attributo',
                pt: 'Nome do atributo',
                de: 'Attributname'
              },
              description: 'La valeur de l\'attribut sera comparée à la fois avec l\'id du départment et son libellé',
              'x-i18n-description': {
                fr: 'La valeur de l\'attribut sera comparée à la fois avec l\'id du départment et son libellé',
                en: 'The attribute value will be compared both with the department id and its label',
                es: 'El valor del atributo se comparará tanto con el id del departamento como con su etiqueta',
                it: 'Il valore dell\'attributo verrà confrontato sia con l\'id del dipartimento che con la sua etichetta',
                pt: 'O valor do atributo será comparado tanto com o id do departamento quanto com seu rótulo',
                de: 'Der Attributwert wird sowohl mit der Abteilungs-ID als auch mit ihrer Bezeichnung verglichen'
              }
            },
            required: {
              type: 'boolean',
              title: 'Rendre l\'attribut obligatoire',
              'x-i18n-title': {
                fr: 'Rendre l\'attribut obligatoire',
                en: 'Make the attribute required',
                es: 'Hacer que el atributo sea obligatorio',
                it: 'Rendere l\'attributo obbligatorio',
                pt: 'Tornar o atributo obrigatório',
                de: 'Attribut erforderlich machen'
              },
              description: "Si cette option n'est pas activée et que l'attribut n'est pas présent l'utilisateur sera dans la racine de l'organisation",
              'x-i18n-description': {
                fr: "Si cette option n'est pas activée et que l'attribut n'est pas présent l'utilisateur sera dans la racine de l'organisation",
                en: 'If this option is not enabled and the attribute is not present, the user will be in the root of the organization',
                es: 'Si esta opción no está habilitada y el atributo no está presente, el usuario estará en la raíz de la organización',
                it: "Se questa opzione non è attivata e l'attributo non è presente, l'utente sarà nella radice dell'organizzazione",
                pt: 'Se esta opção não estiver ativada e o atributo não estiver presente, o usuário estará na raiz da organização',
                de: 'Wenn diese Option nicht aktiviert ist und das Attribut nicht vorhanden ist, befindet sich der Benutzer am Stamm der Organisation'
              }
            },
            orgRootValue: {
              type: 'string',
              title: 'Valeur de l\'attribut pour la racine de l\'organisation',
              'x-i18n-title': {
                fr: 'Valeur de l\'attribut pour la racine de l\'organisation',
                en: 'Attribute value for the organization root',
                es: 'Valor del atributo para la raíz de la organización',
                it: 'Valore dell\'attributo per la radice dell\'organizzazione',
                pt: 'Valor do atributo para a raiz da organização',
                de: 'Attributwert für die Organisationswurzel'
              },
              description: "Si l'attribut a cette valeur l'utilisateur ne sera pas dans un département",
              'x-i18n-description': {
                fr: "Si l'attribut a cette valeur l'utilisateur ne sera pas dans un département",
                en: 'If the attribute has this value, the user will not be in a department',
                es: 'Si el atributo tiene este valor, el usuario no estará en un departamento',
                it: "Se l'attributo ha questo valore, l'utente non sarà in un dipartimento",
                pt: 'Se o atributo tiver este valor, o usuário não estará em um departamento',
                de: 'Wenn das Attribut diesen Wert hat, befindet sich der Benutzer nicht in einem Abteilungsmitglied'
              }
            }
          }
        }
      ]
    },
    coreIdProvider: {
      type: 'boolean',
      title: "Traiter ce fournisseur comme une source principale d'identité",
      'x-i18n-title': {
        fr: "Traiter ce fournisseur comme une source principale d'identité",
        en: 'Treat this provider as a primary identity source',
        es: 'Tratar este proveedor como una fuente principal de identidad',
        it: 'Trattare questo provider come una fonte primaria di identità',
        pt: 'Tratar este provedor como uma fonte principal de identidade',
        de: 'Behandeln Sie diesen Anbieter als primäre Identitätsquelle'
      },
      description: "Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office",
      'x-i18n-description': {
        fr: "Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office",
        en: 'This option has several effects:\n  - an account associated with this provider cannot have any other authentication method (password or another provider attached to the same account)\n  - account information will be read-only and automatically synchronized from the provider when the user has an active session\n  - this synchronization includes session destruction and account deactivation if the account no longer exists in the identity provider\n - if the "Member role" option is used, the role will also be synchronized and will not be editable in the back-office',
        es: 'Esta opción tiene varios efectos:\n  - una cuenta asociada con este proveedor no puede tener otro método de autenticación (contraseña u otro proveedor adjunto a la misma cuenta)\n  - la información de la cuenta será de solo lectura y se sincronizará automáticamente desde el proveedor cuando el usuario tenga una sesión activa\n  - esta sincronización incluye la destrucción de la sesión y la desactivación de la cuenta si la cuenta ya no existe en el proveedor de identidad\n - si se utiliza la opción "Rol de miembros", el rol también se sincronizará y no será editable en el back-office',
        it: "Questa opzione ha diversi effetti:\n  - un account associato a questo provider non può avere altri metodi di autenticazione (password o altro provider allegato allo stesso account)\n  - le informazioni dell'account saranno in sola lettura e sincronizzate automaticamente dal provider quando l'utente ha una sessione attiva\n  - questa sincronizzazione include la distruzione della sessione e la disattivazione dell'account se l'account non esiste più nel provider di identità\n - se l'opzione \"Ruolo dei membri\" è utilizzata, il ruolo sarà anch'esso sincronizzato e non sarà modificabile nel back-office",
        pt: 'Esta opção tem vários efeitos:\n  - uma conta associada a este provedor não pode ter outro método de autenticação (senha ou outro provedor anexado à mesma conta)\n  - as informações da conta serão somente leitura e sincronizadas automaticamente a partir do provedor quando o usuário tiver uma sessão ativa\n  - esta sincronização inclui a destruição da sessão e a desativação da conta se a conta não existir mais no provedor de identidade\n - se a opção "Função dos membros" for usada, a função também será sincronizada e não será editável no back-office',
        de: 'Diese Option hat mehrere Auswirkungen:\n  - ein Konto, das mit diesem Anbieter verknüpft ist, kann keine andere Authentifizierungsmethode haben (Passwort oder ein anderer Anbieter, der mit demselben Konto verbunden ist)\n  - die Kontoinformationen sind schreibgeschützt und werden automatisch vom Anbieter synchronisiert, wenn der Benutzer eine aktive Sitzung hat\n  - diese Synchronisierung umfasst die Zerstörung der Sitzung und die Deaktivierung des Kontos, wenn das Konto nicht mehr im Identitätsanbieter existiert\n - wenn die Option "Mitgliedsrolle" verwendet wird, wird die Rolle ebenfalls synchronisiert und ist nicht im Back-Office editierbar'
      }
    },
    redirectMode: {
      type: 'object',
      default: {
        type: 'button'
      },
      oneOfLayout: {
        label: 'Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur',
        'x-i18n-label': {
          fr: 'Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur',
          en: 'Control how users are redirected to this provider',
          es: 'Controle cómo los usuarios son redirigidos a este proveedor',
          it: 'Controlla come gli utenti vengono reindirizzati a questo provider',
          pt: 'Controle como os usuários são redirecionados para este provedor',
          de: 'Steuern Sie, wie Benutzer zu diesem Anbieter weitergeleitet werden'
        },
        help: "Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
        'x-i18n-help': {
          fr: "Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
          en: 'If you use an email-based mode, the authentication screen will ask for the user\'s email in the first step.',
          es: 'Si utiliza un modo basado en correo electrónico, la pantalla de autenticación pedirá el correo electrónico del usuario en el primer paso.',
          it: "Se si utilizza una modalità basata sull'email, la schermata di autenticazione chiederà l'email dell'utente nel primo passo.",
          pt: 'Se você usar um modo baseado em e-mail, a tela de autenticação solicitará o e-mail do usuário na primeira etapa.',
          de: 'Wenn Sie einen E-Mail-basierten Modus verwenden, fordert der Authentifizierungsschirm im ersten Schritt die E-Mail des Benutzers an.'
        }
      },
      oneOf: [
        {
          title: 'bouton',
          'x-i18n-title': {
            fr: 'bouton',
            en: 'button',
            es: 'botón',
            it: 'pulsante',
            pt: 'botão',
            de: 'Schaltfläche'
          },
          properties: {
            type: {
              const: 'button'
            }
          }
        },
        {
          title: "redirection auto quand l'email appartient à un nom de domaine",
          'x-i18n-title': {
            fr: "redirection auto quand l'email appartient à un nom de domaine",
            en: 'auto redirect when email belongs to a domain',
            es: 'redirección automática cuando el correo electrónico pertenece a un dominio',
            it: 'reindirizzamento automatico quando l\'email appartiene a un dominio',
            pt: 'redirecionamento automático quando o e-mail pertence a um domínio',
            de: 'automatische Weiterleitung, wenn die E-Mail zu einer Domain gehört'
          },
          properties: {
            type: {
              const: 'emailDomain'
            },
            emailDomain: {
              type: 'string',
              title: "nom de domaine de l'email",
              'x-i18n-title': {
                fr: "nom de domaine de l'email",
                en: 'email domain name',
                es: 'nombre de dominio del correo electrónico',
                it: 'nome di dominio dell\'email',
                pt: 'nome de domínio do e-mail',
                de: 'Domainname der E-Mail'
              }
            }
          }
        },
        {
          title: 'toujours rediriger implicitement',
          'x-i18n-title': {
            fr: 'toujours rediriger implicitement',
            en: 'always redirect implicitly',
            es: 'siempre redirigir implícitamente',
            it: 'sempre reindirizzare implicitamente',
            pt: 'sempre redirecionar implicitamente',
            de: 'immer implizit weiterleiten'
          },
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
