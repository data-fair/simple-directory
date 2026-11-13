/* eslint-disable no-template-curly-in-string */
export default {
  type: 'object',
  $id: 'https://github.com/data-fair/simple-directory/site',
  title: 'Site',
  'x-i18n-title': {
    fr: 'Site',
    // kept although equal to the base: the request body schemas append ' post' / ' patch' to the base
    // title to name their types, the form still shows "Site"
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
    updatedAt: {
      type: 'string',
      format: 'date-time'
    },
    owner: {
      $ref: 'https://github.com/data-fair/lib/session-state#/$defs/account',
      layout: {
        label: 'Owner',
        'x-i18n-label': {
          fr: 'Propriétaire',
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
      title: 'Domain name',
      'x-i18n-title': {
        fr: 'Nom de domaine',
        de: 'Domainname',
        it: 'Nome di dominio',
        pt: 'Nome de domínio',
        es: 'Nombre de dominio'
      }
    },
    path: {
      type: 'string',
      title: 'Path prefix',
      'x-i18n-title': {
        fr: 'Préfixe de chemin',
        es: 'Prefijo de ruta',
        it: 'Prefisso di percorso',
        pt: 'Prefixo de caminho',
        de: 'Pfadpräfix'
      }
    },
    tmp: {
      type: 'boolean',
      title: 'Temporary / draft',
      'x-i18n-title': {
        fr: 'Temporaire / brouillon',
        es: 'Temporal / borrador',
        it: 'Temporaneo / bozza',
        pt: 'Temporário / rascunho',
        de: 'Temporär / Entwurf'
      }
    },
    title: {
      type: 'string',
      title: 'Site title',
      'x-i18n-title': {
        fr: 'Titre du site',
        es: 'Título del sitio',
        it: 'Titolo del sito',
        pt: 'Título do site',
        de: 'Website-Titel'
      }
    },
    isAccountMain: {
      type: 'boolean',
      // inert on the main site document (it already *is* the main site), and
      // the admin form round-trips the whole document, so offering it there
      // would invite a save that rewrites the owner's other sites
      layout: { if: '!context.isMainSite' },
      title: 'Main site of the account',
      'x-i18n-title': {
        fr: 'Site principal du compte',
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
        if: '!context.hasAccountMainSite && !parent.data.isAccountMain'
      },
      default: 'onlyBackOffice',
      title: 'Authentication mode (deprecated, use "Main site of the account")',
      'x-i18n-title': {
        fr: "Mode d'authentification (obsolète, utilisez \"Site principal du compte\")",
        es: 'Modo de autenticación (obsoleto, use "Sitio principal de la cuenta")',
        it: 'Modalità di autenticazione (deprecata, usa "Sito principale dell\'account")',
        pt: 'Modo de autenticação (obsoleto, use "Site principal da conta")',
        de: 'Authentifizierungsmodus (veraltet, verwenden Sie "Hauptwebsite des Kontos")'
      },
      type: 'string',
      oneOf: [
        {
          const: 'onlyLocal',
          title: 'Only on the site itself',
          'x-i18n-title': {
            fr: 'Uniquement sur le site lui-même',
            es: 'Solo en el propio sitio',
            it: 'Solo sul sito stesso',
            pt: 'Apenas no próprio site',
            de: 'Nur auf der Website selbst'
          }
        },
        {
          const: 'onlyBackOffice',
          title: 'Only on the back-office',
          'x-i18n-title': {
            fr: 'Uniquement sur le back-office',
            es: 'Solo en el back-office',
            it: 'Solo sul back-office',
            pt: 'Apenas no back-office',
            de: 'Nur im Back-Office'
          }
        },
        {
          const: 'ssoBackOffice',
          title: 'On the site and on the back-office via SSO',
          'x-i18n-title': {
            fr: 'Sur le site et sur le back-office par SSO',
            es: 'En el sitio y en el back-office mediante SSO',
            it: 'Sul sito e sul back-office tramite SSO',
            pt: 'No site e no back-office via SSO',
            de: 'Auf der Website und im Back-Office über SSO'
          }
        },
        {
          const: 'onlyOtherSite',
          title: 'Only on another of your sites',
          'x-i18n-title': {
            fr: 'Uniquement sur un autre de vos sites',
            es: 'Solo en otro de sus sitios',
            it: 'Solo su un altro dei tuoi siti',
            pt: 'Apenas em outro de seus sites',
            de: 'Nur auf einer anderen Ihrer Websites'
          }
        }
      ]
    },
    authOnlyOtherSite: {
      deprecated: true,
      layout: {
        if: 'parent.data.authMode === "onlyOtherSite" && !context.hasAccountMainSite && !parent.data.isAccountMain',
        getItems: 'context.otherSites'
      },
      type: 'string',
      title: 'Other site for authentication (deprecated, use "Main site of the account")',
      'x-i18n-title': {
        fr: "Autre site pour l'authentification (obsolète, utilisez \"Site principal du compte\")",
        es: 'Otro sitio para la autenticación (obsoleto, use "Sitio principal de la cuenta")',
        it: 'Altro sito per l\'autenticazione (deprecato, usa "Sito principale dell\'account")',
        pt: 'Outro site para autenticação (obsoleto, use "Site principal da conta")',
        de: 'Andere Website für die Authentifizierung (veraltet, verwenden Sie "Hauptwebsite des Kontos")'
      }
    },
    reducedPersonalInfoAtCreation: {
      type: 'boolean',
      title: 'Reduce personal information at account creation',
      'x-i18n-title': {
        fr: 'Réduire les informations personnelles à la création de compte',
        es: 'Reducir la información personal en la creación de cuenta',
        it: 'Riduci le informazioni personali alla creazione dell\'account',
        pt: 'Reduzir as informações pessoais na criação da conta',
        de: 'Persönliche Informationen bei der Kontoerstellung reduzieren'
      },
      description: 'If this option is enabled, the personal information requested at account creation will be reduced to the email.',
      'x-i18n-description': {
        fr: "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.",
        es: 'Si esta opción está activada, la información personal solicitada en la creación de la cuenta se reducirá al correo electrónico.',
        it: "Se questa opzione è attivata, le informazioni personali richieste alla creazione dell'account saranno ridotte all'indirizzo e-mail.",
        pt: 'Se esta opção estiver ativada, as informações pessoais solicitadas na criação da conta serão reduzidas ao e-mail.',
        de: 'Wenn diese Option aktiviert ist, werden die bei der Kontoerstellung angeforderten persönlichen Informationen auf die E-Mail-Adresse beschränkt.'
      }
    },
    tosMessage: {
      type: 'string',
      layout: 'textarea',
      title: 'Terms of service message',
      'x-i18n-title': {
        fr: "Message des conditions d'utilisation",
        es: 'Mensaje de términos de servicio',
        it: 'Messaggio dei termini di servizio',
        pt: 'Mensagem dos termos de serviço',
        de: 'Nachricht zu den Nutzungsbedingungen'
      },
      description: 'You can replace the default terms of service message.',
      'x-i18n-description': {
        fr: "Vous pouvez remplacer le message des conditions d'utilisation par défaut.",
        es: 'Puede reemplazar el mensaje predeterminado de los términos de servicio.',
        it: 'Puoi sostituire il messaggio predefinito dei termini di servizio.',
        pt: 'Você pode substituir a mensagem padrão dos termos de serviço.',
        de: 'Sie können die Standardnachricht zu den Nutzungsbedingungen ersetzen.'
      }
    },
    mails: {
      type: 'object',
      title: 'Emails',
      'x-i18n-title': {
        fr: 'Emails',
        es: 'Correos electrónicos',
        it: 'E-mail',
        pt: 'E-mails',
        de: 'E-Mails'
      },
      properties: {
        contact: {
          type: 'string',
          title: 'Contact email address',
          'x-i18n-title': {
            fr: 'Adresse email de contact',
            es: 'Dirección de correo electrónico de contacto',
            it: 'Indirizzo e-mail di contatto',
            pt: 'Endereço de e-mail de contato',
            de: 'Kontakt-E-Mail-Adresse'
          }
        },
        from: {
          type: 'string',
          title: 'Sender email address',
          'x-i18n-title': {
            fr: 'Adresse email de l\'expéditeur',
            es: 'Dirección de correo electrónico del remitente',
            it: 'Indirizzo e-mail del mittente',
            pt: 'Endereço de e-mail do remetente',
            de: 'E-Mail-Adresse des Absenders'
          },
          description: 'Warning: the configuration must be set up on the mail sending service so that this sender is not considered illegitimate.',
          'x-i18n-description': {
            fr: 'Attention : la configuration doit être effectuée sur le service d\'envoi de mail pour que cet expéditeur ne soit pas considéré comme illégitime.',
            es: 'Atención: la configuración debe realizarse en el servicio de envío de correo para que este remitente no sea considerado ilegítimo.',
            it: 'Attenzione: la configurazione deve essere effettuata sul servizio di invio e-mail in modo che questo mittente non sia considerato illegittimo.',
            pt: 'Atenção: a configuração deve ser feita no serviço de envio de e-mail para que este remetente não seja considerado ilegítimo.',
            de: 'Achtung: Die Konfiguration muss im E-Mail-Versanddienst eingerichtet werden, damit dieser Absender nicht als unrechtmäßig gilt.'
          }
        }
      }
    },
    authProviders: {
      layout: {
        if: "parent.data.authMode !== 'onlyOtherSite' && parent.data.authMode !== 'onlyBackOffice'"
      },
      type: 'array',
      title: 'Identity providers (SSO)',
      'x-i18n-title': {
        fr: "Fournisseurs d'identité (SSO)",
        es: 'Proveedores de identidad (SSO)',
        it: 'Provider di identità (SSO)',
        pt: 'Provedores de identidade (SSO)',
        de: 'Identitätsanbieter (SSO)'
      },
      items: { $ref: '#/$defs/authProvider' }
    },
    oauthClients: {
      type: 'array',
      title: 'OAuth clients (dashboards)',
      'x-i18n-title': {
        fr: 'Clients OAuth (tableaux de bord)',
        es: 'Clientes OAuth (paneles)',
        it: 'Client OAuth (dashboard)',
        pt: 'Clientes OAuth (painéis)',
        de: 'OAuth-Clients (Dashboards)'
      },
      description: 'Web applications allowed to request access on behalf of a user of this site through the OAuth authorization code flow.',
      'x-i18n-description': {
        fr: 'Applications web autorisées à demander l\'accès au nom d\'un utilisateur de ce site par le flux OAuth authorization code.',
        es: 'Aplicaciones web autorizadas a solicitar acceso en nombre de un usuario de este sitio mediante el flujo OAuth authorization code.',
        it: 'Applicazioni web autorizzate a richiedere l\'accesso per conto di un utente di questo sito tramite il flusso OAuth authorization code.',
        pt: 'Aplicações web autorizadas a solicitar acesso em nome de um usuário deste site por meio do fluxo OAuth authorization code.',
        de: 'Webanwendungen, die im Namen eines Benutzers dieser Website über den OAuth-Authorization-Code-Flow Zugriff anfordern dürfen.'
      },
      items: { $ref: '#/$defs/oauthClient' }
    }
  },
  $defs: {
    oauthClient: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'redirectUris', 'scopes'],
      layout: { children: ['id', 'name', 'logoUri', 'redirectUris', 'scopes'] },
      properties: {
        id: {
          title: 'Identifier (client_id)',
          'x-i18n-title': {
            fr: 'Identifiant (client_id)',
            es: 'Identificador (client_id)',
            it: 'Identificatore (client_id)',
            pt: 'Identificador (client_id)',
            de: 'Kennung (client_id)'
          },
          readOnly: true,
          type: 'string',
          pattern: '^site-',
        },
        name: {
          title: 'Name',
          'x-i18n-title': {
            fr: 'Nom',
            es: 'Nombre',
            it: 'Nome',
            pt: 'Nome',
            de: 'Name'
          },
          type: 'string',
          minLength: 1,
        },
        logoUri: {
          title: 'Logo (https URL)',
          'x-i18n-title': {
            fr: 'Logo (URL https)',
            es: 'Logo (URL https)',
            it: 'Logo (URL https)',
            pt: 'Logotipo (URL https)',
            de: 'Logo (https-URL)'
          },
          type: 'string',
          pattern: '^https://',
        },
        redirectUris: {
          title: 'Redirect URIs',
          'x-i18n-title': {
            fr: 'URI de redirection',
            es: 'URIs de redirección',
            it: 'URI di reindirizzamento',
            pt: 'URIs de redirecionamento',
            de: 'Redirect-URIs'
          },
          type: 'array',
          minItems: 1,
          items: { type: 'string', pattern: '^https?://' },
        },
        scopes: {
          title: 'Maximum scopes',
          'x-i18n-title': {
            fr: 'Portées maximales',
            es: 'Permisos máximos',
            it: 'Permessi massimi',
            pt: 'Permissões máximas',
            de: 'Maximale Berechtigungen'
          },
          type: 'array',
          minItems: 1,
          layout: { getItems: 'context.scopes' },
          items: { type: 'string' },
        }
      }
    },
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
          title: 'Identifier',
          'x-i18n-title': {
            fr: 'Identifiant',
            es: 'Identificador',
            it: 'Identificatore',
            pt: 'Identificador',
            de: 'Kennung'
          },
          readOnly: true
        },
        title: {
          type: 'string',
          title: 'Name',
          'x-i18n-title': {
            fr: 'Nom',
            es: 'Nombre',
            it: 'Nome',
            pt: 'Nome',
            de: 'Name'
          }
        }
      },
      oneOfLayout: {
        label: 'Provider type',
        'x-i18n-label': {
          fr: 'Type de fournisseur',
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
          title: 'Another of your sites',
          'x-i18n-title': {
            fr: 'Un autre de vos sites',
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
          title: 'An identity provider configured on another of your sites',
          'x-i18n-title': {
            fr: "Un fournisseur d'identité configuré sur un autre de vos sites",
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
              title: 'Provider',
              'x-i18n-title': {
                fr: 'Fournisseur',
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
            fr: 'Métadonnées XML',
            es: 'Metadatos XML',
            it: 'Metadati XML',
            pt: 'Metadados XML',
            de: 'XML-Metadaten'
          },
          layout: { comp: 'textarea', slots: { before: { name: 'saml-help' } } }
        },
        color: {
          type: 'string',
          title: 'Color',
          'x-i18n-title': {
            fr: 'Couleur',
            es: 'Color',
            it: 'Colore',
            pt: 'Cor',
            de: 'Farbe'
          },
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'Logo URL (small size)',
          'x-i18n-title': {
            fr: 'URL du logo (petite taille)',
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
          title: 'Color',
          'x-i18n-title': {
            fr: 'Couleur',
            es: 'Color',
            it: 'Colore',
            pt: 'Cor',
            de: 'Farbe'
          },
          layout: 'color-picker'
        },
        img: {
          type: 'string',
          title: 'Logo URL (small size)',
          'x-i18n-title': {
            fr: 'URL du logo (petite taille)',
            es: 'URL del logo (tamaño pequeño)',
            it: 'URL del logo (dimensione piccola)',
            pt: 'URL do logotipo (tamanho pequeno)',
            de: 'Logo-URL (kleine Größe)'
          }
        },
        discovery: {
          type: 'string',
          title: 'Discovery URL',
          'x-i18n-title': {
            fr: 'URL de découverte',
            es: 'URL de descubrimiento',
            it: 'URL di scoperta',
            pt: 'URL de descoberta',
            de: 'Discovery-URL'
          },
          description: 'Probably of the form http://my-provider/.well-known/openid-configuration',
          'x-i18n-description': {
            fr: 'Probablement de la forme http://mon-fournisseur/.well-known/openid-configuration',
            es: 'Probablemente de la forma http://my-provider/.well-known/openid-configuration',
            it: 'Probabilmente del tipo http://my-provider/.well-known/openid-configuration',
            pt: 'Provavelmente no formato http://my-provider/.well-known/openid-configuration',
            de: 'Wahrscheinlich in der Form http://my-provider/.well-known/openid-configuration'
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
              title: 'Client ID',
              'x-i18n-title': {
                fr: 'Identifiant du client',
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
        scope: {
          type: 'string',
          title: 'Requested scopes',
          'x-i18n-title': {
            fr: 'Portées demandées',
            es: 'Scopes solicitados',
            it: 'Scope richiesti',
            pt: 'Scopes solicitados',
            de: 'Angeforderte Scopes'
          },
          description: 'Space separated list, "openid email profile" by default. For ProConnect: "openid email given_name usual_name".',
          'x-i18n-description': {
            fr: 'Liste séparée par des espaces, "openid email profile" par défaut. Pour ProConnect : "openid email given_name usual_name".',
            es: 'Lista separada por espacios, "openid email profile" por defecto. Para ProConnect: "openid email given_name usual_name".',
            it: 'Elenco separato da spazi, "openid email profile" per impostazione predefinita. Per ProConnect: "openid email given_name usual_name".',
            pt: 'Lista separada por espaços, "openid email profile" por padrão. Para ProConnect: "openid email given_name usual_name".',
            de: 'Durch Leerzeichen getrennte Liste, standardmäßig "openid email profile". Für ProConnect: "openid email given_name usual_name".'
          },
          pattern: '^\\S+( \\S+)*$'
        },
        credentialsEncodingMode: {
          type: 'string',
          title: 'Client credentials encoding',
          'x-i18n-title': {
            fr: 'Encodage des identifiants du client',
            es: 'Codificación de las credenciales del cliente',
            it: 'Codifica delle credenziali del client',
            pt: 'Codificação das credenciais do cliente',
            de: 'Kodierung der Client-Anmeldedaten'
          },
          description: 'Technical parameter, ignore it most of the time. If the provided secret contains special characters, the non-strict mode may be worth trying.',
          'x-i18n-description': {
            fr: 'Paramètre technique à ignorer la plupart du temps. Si le secret fourni contient des caractères spéciaux, il peut être utile de tester le mode non-strict.',
            es: 'Parámetro técnico que se puede ignorar la mayoría de las veces. Si el secreto proporcionado contiene caracteres especiales, puede ser útil probar el modo no estricto.',
            it: 'Parametro tecnico da ignorare nella maggior parte dei casi. Se il segreto fornito contiene caratteri speciali, può essere utile provare la modalità non rigida.',
            pt: 'Parâmetro técnico que pode ser ignorado na maioria das vezes. Se o segredo fornecido contiver caracteres especiais, pode ser útil testar o modo não rígido.',
            de: 'Technischer Parameter, der meistens ignoriert werden kann. Enthält das angegebene Geheimnis Sonderzeichen, kann es sinnvoll sein, den nicht strengen Modus zu testen.'
          },
          default: 'strict',
          oneOf: [
            {
              const: 'strict',
              title: 'Strict',
              'x-i18n-title': {
                fr: 'Strict',
                de: 'Streng',
                it: 'Rigido',
                pt: 'Rígido',
                es: 'Estricto'
              }
            },
            {
              const: 'loose',
              title: 'Non-strict',
              'x-i18n-title': {
                fr: 'Non-strict',
                de: 'Nicht streng',
                it: 'Non rigido',
                pt: 'Não rígido',
                es: 'No estricto'
              }
            }
          ],
          layout: { cols: 6 }
        },
        authorizationMethod: {
          type: 'string',
          title: 'Client credentials sending method',
          'x-i18n-title': {
            fr: 'Méthode d\'envoi des identifiants du client',
            es: 'Método de envío de las credenciales del cliente',
            it: 'Metodo di invio delle credenziali del client',
            pt: 'Método de envio das credenciais do cliente',
            de: 'Übermittlungsmethode der Client-Anmeldedaten'
          },
          description: 'If empty, the method is chosen from the provider\'s discovery document ("Authorization" header by default).',
          'x-i18n-description': {
            fr: "Si ce champ est vide, la méthode est choisie d'après le document de découverte du fournisseur (en-tête \"Authorization\" par défaut).",
            es: 'Si está vacío, el método se elige a partir del documento de descubrimiento del proveedor (encabezado "Authorization" por defecto).',
            it: 'Se vuoto, il metodo viene scelto in base al documento di discovery del provider (intestazione "Authorization" per impostazione predefinita).',
            pt: 'Se estiver vazio, o método é escolhido a partir do documento de descoberta do provedor (cabeçalho "Authorization" por padrão).',
            de: 'Wenn leer, wird die Methode anhand des Discovery-Dokuments des Anbieters gewählt (standardmäßig der Header "Authorization").'
          },
          oneOf: [
            {
              const: 'header',
              title: 'Authorization header',
              'x-i18n-title': {
                fr: 'En-tête "Authorization"',
                es: 'Encabezado "Authorization"',
                it: 'Intestazione "Authorization"',
                pt: 'Cabeçalho "Authorization"',
                de: 'Header "Authorization"'
              }
            },
            {
              const: 'body',
              title: 'Request body',
              'x-i18n-title': {
                fr: 'Corps de la requête',
                es: 'Cuerpo de la solicitud',
                it: 'Corpo della richiesta',
                pt: 'Corpo da solicitação',
                de: 'Anfrage-Body'
              }
            }
          ],
          layout: { cols: 6, props: { clearable: true } }
        },
        bodyFormat: {
          type: 'string',
          title: 'Request body format',
          'x-i18n-title': {
            fr: 'Format du corps de la requête',
            es: 'Formato del cuerpo de la solicitud',
            it: 'Formato del corpo della richiesta',
            pt: 'Formato do corpo da solicitação',
            de: 'Format des Anfrage-Bodys'
          },
          default: 'form',
          enum: ['form', 'json'],
          layout: { cols: 6 }
        },
        loginHintMode: {
          type: 'string',
          layout: { cols: 6 },
          title: 'login_hint sending mode',
          'x-i18n-title': {
            fr: 'Mode d\'envoi du login_hint',
            es: 'Modo de envío del login_hint',
            it: 'Modalità di invio del login_hint',
            pt: 'Modo de envio do login_hint',
            de: 'Übermittlungsmodus des login_hint'
          },
          default: 'email',
          oneOf: [
            {
              const: 'email',
              title: 'Full email',
              'x-i18n-title': {
                fr: 'Email complet',
                es: 'Correo electrónico completo',
                it: 'E-mail completa',
                pt: 'E-mail completo',
                de: 'Vollständige E-Mail-Adresse'
              }
            },
            {
              const: 'username',
              title: 'Part before @',
              'x-i18n-title': {
                fr: 'Partie avant le @',
                es: 'Parte antes del @',
                it: 'Parte prima della @',
                pt: 'Parte antes do @',
                de: 'Teil vor dem @'
              }
            },
            {
              const: 'none',
              title: 'Do not send',
              'x-i18n-title': {
                fr: 'Ne pas envoyer',
                es: 'No enviar',
                it: 'Non inviare',
                pt: 'Não enviar',
                de: 'Nicht senden'
              }
            }
          ]
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
          title: 'User information retrieval mode',
          'x-i18n-title': {
            fr: 'Mode de récupération des informations de l\'utilisateur',
            es: 'Modo de recuperación de la información del usuario',
            it: 'Modalità di recupero delle informazioni utente',
            pt: 'Modo de recuperação das informações do usuário',
            de: 'Modus zum Abrufen der Benutzerinformationen'
          },
          default: 'auto',
          oneOf: [
            {
              const: 'auto',
              title: 'Auto ("user_info" endpoint if available, otherwise the content of id_token or access_token)',
              'x-i18n-title': {
                fr: 'Auto (endpoint "user_info" si disponible, sinon contenu du jeton id_token ou access_token)',
                es: 'Auto (endpoint "user_info" si está disponible, de lo contrario, contenido del id_token o del access_token)',
                it: 'Auto (endpoint "user_info" se disponibile, altrimenti contenuto dell\'id_token o dell\'access_token)',
                pt: 'Auto (endpoint "user_info" se disponível, caso contrário, conteúdo do id_token ou do access_token)',
                de: 'Auto (Endpoint "user_info" falls verfügbar, sonst Inhalt des id_token oder des access_token)'
              }
            },
            {
              const: 'id_token',
              title: 'Content of id_token',
              'x-i18n-title': {
                fr: 'Contenu du jeton id_token',
                es: 'Contenido del id_token',
                it: 'Contenuto dell\'id_token',
                pt: 'Conteúdo do id_token',
                de: 'Inhalt des id_token'
              }
            },
            {
              const: 'access_token',
              title: 'Content of access_token',
              'x-i18n-title': {
                fr: 'Contenu du jeton access_token',
                es: 'Contenido del access_token',
                it: 'Contenuto dell\'access_token',
                pt: 'Conteúdo do access_token',
                de: 'Inhalt des access_token'
              }
            },
          ]
        },
        strict: {
          type: 'boolean',
          title: 'Strict token validation',
          'x-i18n-title': {
            fr: 'Validation stricte des jetons',
            es: 'Validación estricta de los tokens',
            it: 'Convalida rigorosa dei token',
            pt: 'Validação estrita dos tokens',
            de: 'Strenge Token-Validierung'
          },
          description: 'If enabled, logins whose tokens fail validation (signature, issuer, audience, expiration, nonce...) are refused. Otherwise only an alert is logged.',
          'x-i18n-description': {
            fr: 'Si cette option est activée, les connexions dont les jetons ne passent pas la validation (signature, émetteur, audience, expiration, nonce...) sont refusées. Sinon, une alerte est seulement enregistrée dans les logs.',
            es: 'Si se activa, se rechazan los inicios de sesión cuyos tokens no superan la validación (firma, emisor, audiencia, expiración, nonce...). De lo contrario, solo se registra una alerta.',
            it: 'Se attivata, gli accessi i cui token non superano la convalida (firma, emittente, audience, scadenza, nonce...) vengono rifiutati. Altrimenti viene registrato solo un avviso.',
            pt: 'Se ativada, os logins cujos tokens não passam na validação (assinatura, emissor, audiência, expiração, nonce...) são recusados. Caso contrário, apenas um alerta é registrado.',
            de: 'Wenn aktiviert, werden Anmeldungen abgelehnt, deren Token die Validierung nicht bestehen (Signatur, Aussteller, Audience, Ablauf, Nonce...). Andernfalls wird nur eine Warnung protokolliert.'
          }
        },
        rpInitiatedLogout: {
          type: 'boolean',
          title: 'Logout at the provider',
          'x-i18n-title': {
            fr: 'Déconnexion auprès du fournisseur',
            es: 'Cierre de sesión en el proveedor',
            it: 'Disconnessione presso il provider',
            pt: 'Logout no provedor',
            de: 'Abmeldung beim Anbieter'
          },
          description: "On logout, the user is redirected to the identity provider's logout. Requires registering <site>/simple-directory/api/auth/oidc-logout-callback as a post logout redirect URI at the provider.",
          'x-i18n-description': {
            fr: "À la déconnexion, l'utilisateur est redirigé vers la déconnexion du fournisseur d'identité. Nécessite de déclarer l'URL <site>/simple-directory/api/auth/oidc-logout-callback comme URL de redirection après déconnexion (post logout redirect URI) chez le fournisseur.",
            es: 'Al cerrar sesión, el usuario es redirigido al cierre de sesión del proveedor de identidad. Requiere registrar <site>/simple-directory/api/auth/oidc-logout-callback como URI de redirección posterior al cierre de sesión (post logout redirect URI) en el proveedor.',
            it: "Alla disconnessione, l'utente viene reindirizzato alla disconnessione del provider di identità. Richiede di registrare <site>/simple-directory/api/auth/oidc-logout-callback come URI di reindirizzamento dopo la disconnessione (post logout redirect URI) presso il provider.",
            pt: 'Ao fazer logout, o usuário é redirecionado para o logout do provedor de identidade. Requer o registro de <site>/simple-directory/api/auth/oidc-logout-callback como URI de redirecionamento após logout (post logout redirect URI) no provedor.',
            de: 'Beim Abmelden wird der Benutzer zur Abmeldung des Identitätsanbieters weitergeleitet. Erfordert die Registrierung von <site>/simple-directory/api/auth/oidc-logout-callback als Post-Logout-Redirect-URI beim Anbieter.'
          }
        },
        ignoreEmailVerified: {
          type: 'boolean',
          title: 'Accept users with unverified emails',
          'x-i18n-title': {
            fr: 'Accepter les utilisateurs aux emails non vérifiés',
            es: 'Aceptar usuarios con correos electrónicos no verificados',
            it: 'Accetta utenti con e-mail non verificate',
            pt: 'Aceitar usuários com e-mails não verificados',
            de: 'Benutzer mit nicht verifizierten E-Mail-Adressen akzeptieren'
          },
          description: 'By default, if the identity provider returns email_verified=false, authentication is rejected. Check this option to change this behavior.',
          'x-i18n-description': {
            fr: "Par défaut, si le fournisseur d'identité retourne email_verified=false, l'authentification est refusée. Cochez cette option pour changer ce comportement.",
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
        label: 'Create users as members',
        'x-i18n-label': {
          fr: 'Créer les utilisateurs en tant que membres',
          es: 'Crear usuarios como miembros',
          it: 'Crea utenti come membri',
          pt: 'Criar usuários como membros',
          de: 'Benutzer als Mitglieder erstellen'
        },
        help: 'If this option is enabled, all users created through this identity provider will automatically be members of the organization owning the site.',
        'x-i18n-help': {
          fr: "Si cette option est activée, tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
          es: 'Si esta opción está activada, todos los usuarios creados a través de este proveedor de identidad serán automáticamente miembros de la organización propietaria del sitio.',
          it: "Se questa opzione è attivata, tutti gli utenti creati tramite questo provider di identità saranno automaticamente membri dell'organizzazione proprietaria del sito.",
          pt: 'Se esta opção estiver ativada, todos os usuários criados por meio deste provedor de identidade serão automaticamente membros da organização proprietária do site.',
          de: 'Wenn diese Option aktiviert ist, werden alle Benutzer, die über diesen Identitätsanbieter erstellt werden, automatisch Mitglieder der Organisation, die die Website besitzt.'
        }
      },
      oneOf: [
        {
          title: 'Never (or only by invitation)',
          'x-i18n-title': {
            fr: 'Jamais (ou uniquement sur invitation)',
            es: 'Nunca (o solo por invitación)',
            it: 'Mai (o solo per invito)',
            pt: 'Nunca (ou apenas por convite)',
            de: 'Niemals (oder nur per Einladung)'
          },
          properties: {
            type: {
              const: 'never'
            }
          }
        },
        {
          title: 'Always',
          'x-i18n-title': {
            fr: 'Toujours',
            es: 'Siempre',
            it: 'Sempre',
            pt: 'Sempre',
            de: 'Immer'
          },
          properties: {
            type: {
              const: 'always'
            }
          }
        },
        {
          title: 'When the email belongs to a domain',
          'x-i18n-title': {
            fr: "Quand l'email appartient à un nom de domaine",
            es: 'Cuando el correo electrónico pertenece a un dominio',
            it: 'Quando l\'e-mail appartiene a un dominio',
            pt: 'Quando o e-mail pertence a um domínio',
            de: 'Wenn die E-Mail-Adresse zu einer Domain gehört'
          },
          properties: {
            type: {
              const: 'emailDomain'
            },
            emailDomain: {
              type: 'string',
              title: 'Email domain name',
              'x-i18n-title': {
                fr: "Nom de domaine de l'email",
                es: 'Nombre de dominio del correo electrónico',
                it: 'Nome di dominio dell\'e-mail',
                pt: 'Nome de domínio do e-mail',
                de: 'Domainname der E-Mail-Adresse'
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
        label: 'Member role assignment',
        'x-i18n-label': {
          fr: 'Attribution du rôle des membres',
          es: 'Asignación del rol de los miembros',
          it: 'Assegnazione del ruolo dei membri',
          pt: 'Atribuição da função dos membros',
          de: 'Zuweisung der Mitgliedsrolle'
        },
        help: 'The role of members automatically created by this identity provider.',
        'x-i18n-help': {
          fr: "Le rôle des membres créés automatiquement par ce fournisseur d'identité.",
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
          title: 'No default role (regular user)',
          'x-i18n-title': {
            fr: 'Aucun rôle par défaut (simple utilisateur)',
            es: 'Sin rol predeterminado (usuario normal)',
            it: 'Nessun ruolo predefinito (utente normale)',
            pt: 'Nenhuma função padrão (usuário comum)',
            de: 'Keine Standardrolle (normaler Benutzer)'
          },
          properties: {
            type: {
              const: 'none'
            }
          }
        },
        {
          title: 'Always this role: ',
          'x-i18n-title': {
            fr: 'Tout le temps ce rôle : ',
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
              title: 'Member role',
              'x-i18n-title': {
                fr: 'Rôle des membres',
                es: 'Rol de los miembros',
                it: 'Ruolo dei membri',
                pt: 'Função dos membros',
                de: 'Mitgliedsrolle'
              }
            }
          }
        },
        {
          title: 'Role read from an identity attribute',
          'x-i18n-title': {
            fr: "Rôle lu dans un attribut de l'identité",
            es: 'Rol leído de un atributo de identidad',
            it: 'Ruolo letto da un attributo di identità',
            pt: 'Função lida de um atributo de identidade',
            de: 'Aus einem Identitätsattribut gelesene Rolle'
          },
          required: ['attribute'],
          properties: {
            type: {
              const: 'attribute'
            },
            attribute: {
              type: 'string',
              title: 'Attribute name',
              'x-i18n-title': {
                fr: "Nom de l'attribut",
                es: 'Nombre del atributo',
                it: 'Nome dell\'attributo',
                pt: 'Nome do atributo',
                de: 'Attributname'
              }
            },
            defaultRole: {
              type: 'string',
              title: 'Default role',
              'x-i18n-title': {
                fr: 'Rôle par défaut',
                es: 'Rol predeterminado',
                it: 'Ruolo predefinito',
                pt: 'Função padrão',
                de: 'Standardrolle'
              },
              description: 'If the attribute is not present or does not match any known role',
              'x-i18n-description': {
                fr: "Si l'attribut n'est pas présent ou ne correspond à aucun rôle connu",
                es: 'Si el atributo no está presente o no coincide con ningún rol conocido',
                it: "Se l'attributo non è presente o non corrisponde a nessun ruolo noto",
                pt: 'Se o atributo não estiver presente ou não corresponder a nenhuma função conhecida',
                de: 'Wenn das Attribut nicht vorhanden ist oder keiner bekannten Rolle entspricht'
              }
            },
            values: {
              title: 'Role -> attribute value mappings',
              'x-i18n-title': {
                fr: 'Correspondances rôle -> liste de valeurs de l\'attribut',
                es: 'Correspondencias rol -> valores del atributo',
                it: 'Corrispondenze ruolo -> valori dell\'attributo',
                pt: 'Correspondências função -> valores do atributo',
                de: 'Zuordnungen Rolle -> Attributwerte'
              },
              type: 'object',
              patternPropertiesLayout: {
                messages: {
                  addItem: 'Enter a role',
                  'x-i18n-addItem': {
                    fr: 'Saisissez un rôle',
                    es: 'Ingrese un rol',
                    it: 'Inserisci un ruolo',
                    pt: 'Insira uma função',
                    de: 'Geben Sie eine Rolle ein'
                  }
                }
              },
              patternProperties: {
                '.*': {
                  title: 'Attribute values',
                  'x-i18n-title': {
                    fr: 'Valeurs de l\'attribut',
                    es: 'Valores del atributo',
                    it: 'Valori dell\'attributo',
                    pt: 'Valores do atributo',
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
        label: 'Member department assignment',
        'x-i18n-label': {
          fr: 'Attribution du département des membres',
          es: 'Asignación del departamento de los miembros',
          it: 'Assegnazione del dipartimento dei membri',
          pt: 'Atribuição do departamento dos membros',
          de: 'Zuweisung der Abteilung der Mitglieder'
        },
        help: 'The department of members automatically created by this identity provider.',
        'x-i18n-help': {
          fr: "Le département des membres créés automatiquement par ce fournisseur d'identité.",
          es: 'El departamento de los miembros creados automáticamente por este proveedor de identidad.',
          it: 'Il dipartimento dei membri creati automaticamente da questo provider di identità.',
          pt: 'O departamento dos membros criados automaticamente por este provedor de identidade.',
          de: 'Die Abteilung der Mitglieder, die automatisch von diesem Identitätsanbieter erstellt werden.'
        }
      },
      default: {
        type: 'none'
      },
      oneOf: [
        {
          title: 'No department (organization root)',
          'x-i18n-title': {
            fr: 'Aucun département (racine de l\'organisation)',
            es: 'Sin departamento (raíz de la organización)',
            it: 'Nessun dipartimento (radice dell\'organizzazione)',
            pt: 'Nenhum departamento (raiz da organização)',
            de: 'Keine Abteilung (oberste Ebene der Organisation)'
          },
          properties: {
            type: {
              const: 'none'
            }
          }
        },
        {
          title: 'Always this department: ',
          'x-i18n-title': {
            fr: 'Tout le temps ce département : ',
            es: 'Siempre este departamento: ',
            it: 'Sempre questo dipartimento: ',
            pt: 'Sempre este departamento: ',
            de: 'Immer diese Abteilung: '
          },
          required: ['department'],
          properties: {
            type: {
              const: 'static'
            },
            department: {
              type: 'string',
              title: 'Member department',
              'x-i18n-title': {
                fr: 'Département des membres',
                es: 'Departamento de los miembros',
                it: 'Dipartimento dei membri',
                pt: 'Departamento dos membros',
                de: 'Abteilung der Mitglieder'
              }
            }
          }
        },
        {
          title: 'Department read from an identity attribute',
          'x-i18n-title': {
            fr: "Département lu dans un attribut de l'identité",
            es: 'Departamento leído de un atributo de identidad',
            it: 'Dipartimento letto da un attributo di identità',
            pt: 'Departamento lido de um atributo de identidade',
            de: 'Aus einem Identitätsattribut gelesene Abteilung'
          },
          required: ['attribute'],
          properties: {
            type: {
              const: 'attribute'
            },
            attribute: {
              type: 'string',
              title: 'Attribute name',
              'x-i18n-title': {
                fr: "Nom de l'attribut",
                es: 'Nombre del atributo',
                it: 'Nome dell\'attributo',
                pt: 'Nome do atributo',
                de: 'Attributname'
              },
              description: 'The attribute value will be compared both with the department id and its label',
              'x-i18n-description': {
                fr: 'La valeur de l\'attribut sera comparée à la fois avec l\'identifiant du département et son libellé',
                es: 'El valor del atributo se comparará tanto con el id del departamento como con su etiqueta',
                it: 'Il valore dell\'attributo verrà confrontato sia con l\'id del dipartimento che con la sua etichetta',
                pt: 'O valor do atributo será comparado tanto com o id do departamento quanto com seu rótulo',
                de: 'Der Attributwert wird sowohl mit der Abteilungs-ID als auch mit ihrer Bezeichnung verglichen'
              }
            },
            required: {
              type: 'boolean',
              title: 'Make the attribute required',
              'x-i18n-title': {
                fr: 'Rendre l\'attribut obligatoire',
                es: 'Hacer que el atributo sea obligatorio',
                it: 'Rendere l\'attributo obbligatorio',
                pt: 'Tornar o atributo obrigatório',
                de: 'Attribut erforderlich machen'
              },
              description: 'If this option is not enabled and the attribute is not present, the user will be in the root of the organization',
              'x-i18n-description': {
                fr: "Si cette option n'est pas activée et que l'attribut n'est pas présent, l'utilisateur sera à la racine de l'organisation",
                es: 'Si esta opción no está habilitada y el atributo no está presente, el usuario estará en la raíz de la organización',
                it: "Se questa opzione non è attivata e l'attributo non è presente, l'utente sarà nella radice dell'organizzazione",
                pt: 'Se esta opção não estiver ativada e o atributo não estiver presente, o usuário estará na raiz da organização',
                de: 'Wenn diese Option nicht aktiviert ist und das Attribut nicht vorhanden ist, befindet sich der Benutzer auf der obersten Ebene der Organisation'
              }
            },
            orgRootValue: {
              type: 'string',
              title: 'Attribute value for the organization root',
              'x-i18n-title': {
                fr: 'Valeur de l\'attribut pour la racine de l\'organisation',
                es: 'Valor del atributo para la raíz de la organización',
                it: 'Valore dell\'attributo per la radice dell\'organizzazione',
                pt: 'Valor do atributo para a raiz da organização',
                de: 'Attributwert für die oberste Ebene der Organisation'
              },
              description: 'If the attribute has this value, the user will not be in a department',
              'x-i18n-description': {
                fr: "Si l'attribut a cette valeur, l'utilisateur ne sera pas dans un département",
                es: 'Si el atributo tiene este valor, el usuario no estará en un departamento',
                it: "Se l'attributo ha questo valore, l'utente non sarà in un dipartimento",
                pt: 'Se o atributo tiver este valor, o usuário não estará em um departamento',
                de: 'Wenn das Attribut diesen Wert hat, befindet sich der Benutzer in keiner Abteilung'
              }
            }
          }
        }
      ]
    },
    coreIdProvider: {
      type: 'boolean',
      title: 'Treat this provider as a primary identity source',
      'x-i18n-title': {
        fr: "Traiter ce fournisseur comme une source principale d'identité",
        es: 'Tratar este proveedor como una fuente principal de identidad',
        it: 'Trattare questo provider come una fonte primaria di identità',
        pt: 'Tratar este provedor como uma fonte principal de identidade',
        de: 'Diesen Anbieter als primäre Identitätsquelle behandeln'
      },
      description: 'This option has several effects:\n  - an account associated with this provider cannot have any other authentication method (password or another provider attached to the same account)\n  - account information will be read-only and automatically synchronized from the provider when the user has an active session\n  - this synchronization includes session destruction and account deactivation if the account no longer exists in the identity provider\n - if the "Member role" option is used, the role will also be synchronized and will not be editable in the back-office',
      'x-i18n-description': {
        fr: "Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de passe ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclut la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée, le rôle sera lui aussi synchronisé et ne sera pas modifiable dans le back-office",
        es: 'Esta opción tiene varios efectos:\n  - una cuenta asociada con este proveedor no puede tener otro método de autenticación (contraseña u otro proveedor vinculado a la misma cuenta)\n  - la información de la cuenta será de solo lectura y se sincronizará automáticamente desde el proveedor cuando el usuario tenga una sesión activa\n  - esta sincronización incluye la destrucción de la sesión y la desactivación de la cuenta si la cuenta ya no existe en el proveedor de identidad\n - si se utiliza la opción "Rol de los miembros", el rol también se sincronizará y no será editable en el back-office',
        it: "Questa opzione ha diversi effetti:\n  - un account associato a questo provider non può avere altri metodi di autenticazione (password o altro provider associato allo stesso account)\n  - le informazioni dell'account saranno in sola lettura e sincronizzate automaticamente dal provider quando l'utente ha una sessione attiva\n  - questa sincronizzazione include la distruzione della sessione e la disattivazione dell'account se l'account non esiste più nel provider di identità\n - se viene utilizzata l'opzione \"Ruolo dei membri\", il ruolo sarà anch'esso sincronizzato e non sarà modificabile nel back-office",
        pt: 'Esta opção tem vários efeitos:\n  - uma conta associada a este provedor não pode ter outro método de autenticação (senha ou outro provedor anexado à mesma conta)\n  - as informações da conta serão somente leitura e sincronizadas automaticamente a partir do provedor quando o usuário tiver uma sessão ativa\n  - esta sincronização inclui a destruição da sessão e a desativação da conta se a conta não existir mais no provedor de identidade\n - se a opção "Função dos membros" for usada, a função também será sincronizada e não será editável no back-office',
        de: 'Diese Option hat mehrere Auswirkungen:\n  - ein Konto, das mit diesem Anbieter verknüpft ist, kann keine andere Authentifizierungsmethode haben (Passwort oder ein anderer Anbieter, der mit demselben Konto verbunden ist)\n  - die Kontoinformationen sind schreibgeschützt und werden automatisch vom Anbieter synchronisiert, wenn der Benutzer eine aktive Sitzung hat\n  - diese Synchronisierung umfasst die Zerstörung der Sitzung und die Deaktivierung des Kontos, wenn das Konto beim Identitätsanbieter nicht mehr existiert\n - wenn die Option "Mitgliedsrolle" verwendet wird, wird die Rolle ebenfalls synchronisiert und kann im Back-Office nicht bearbeitet werden'
      }
    },
    redirectMode: {
      type: 'object',
      default: {
        type: 'button'
      },
      oneOfLayout: {
        label: 'Control how users are redirected to this provider',
        'x-i18n-label': {
          fr: 'Contrôlez la manière dont les utilisateurs sont redirigés vers ce fournisseur',
          es: 'Controle cómo se redirige a los usuarios a este proveedor',
          it: 'Controlla come gli utenti vengono reindirizzati a questo provider',
          pt: 'Controle como os usuários são redirecionados para este provedor',
          de: 'Steuern Sie, wie Benutzer zu diesem Anbieter weitergeleitet werden'
        },
        help: 'If you use an email-based mode, the authentication screen will ask for the user\'s email in the first step.',
        'x-i18n-help': {
          fr: "Si vous utilisez un mode basé sur l'email, la mire d'authentification demandera l'email de l'utilisateur à la première étape.",
          es: 'Si utiliza un modo basado en correo electrónico, la pantalla de autenticación pedirá el correo electrónico del usuario en el primer paso.',
          it: "Se si utilizza una modalità basata sull'e-mail, la schermata di autenticazione chiederà l'e-mail dell'utente al primo passaggio.",
          pt: 'Se você usar um modo baseado em e-mail, a tela de autenticação solicitará o e-mail do usuário na primeira etapa.',
          de: 'Wenn Sie einen E-Mail-basierten Modus verwenden, fordert der Anmeldebildschirm im ersten Schritt die E-Mail-Adresse des Benutzers an.'
        }
      },
      oneOf: [
        {
          title: 'Button',
          'x-i18n-title': {
            fr: 'Bouton',
            es: 'Botón',
            it: 'Pulsante',
            pt: 'Botão',
            de: 'Schaltfläche'
          },
          properties: {
            type: {
              const: 'button'
            }
          }
        },
        {
          title: 'Automatic redirection when the email belongs to a domain',
          'x-i18n-title': {
            fr: "Redirection automatique quand l'email appartient à un nom de domaine",
            es: 'Redirección automática cuando el correo electrónico pertenece a un dominio',
            it: 'Reindirizzamento automatico quando l\'e-mail appartiene a un dominio',
            pt: 'Redirecionamento automático quando o e-mail pertence a um domínio',
            de: 'Automatische Weiterleitung, wenn die E-Mail-Adresse zu einer Domain gehört'
          },
          properties: {
            type: {
              const: 'emailDomain'
            },
            emailDomain: {
              type: 'string',
              title: 'Email domain name',
              'x-i18n-title': {
                fr: "Nom de domaine de l'email",
                es: 'Nombre de dominio del correo electrónico',
                it: 'Nome di dominio dell\'e-mail',
                pt: 'Nome de domínio do e-mail',
                de: 'Domainname der E-Mail-Adresse'
              }
            }
          }
        },
        {
          title: 'Always redirect implicitly',
          'x-i18n-title': {
            fr: 'Toujours rediriger implicitement',
            es: 'Redirigir siempre implícitamente',
            it: 'Reindirizzare sempre implicitamente',
            pt: 'Sempre redirecionar implicitamente',
            de: 'Immer implizit weiterleiten'
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
