export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 =
  | UniquementSurLeSiteLuiMeme
  | UniquementSurLeBackOffice
  | SurLeSiteEtSurLeBackOfficeParSSO
  | UniquementSurUnAutreDeVosSites;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type UniquementSurUnAutreDeVosSites = "onlyOtherSite";
export type ModeDAuthentification2 = string;
export type AutreSitePourLAuthentification = string;
/**
 * Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.
 */
export type ReduireLesInformationsPersonnellesALaCreationDeCompte = boolean;
export type Couleur = string;
export type URLDuLogoPetiteTaille = string;
export type TypeDeFournisseur = "oidc";
/**
 * probablement de la forme http://mon-fournisseur/.well-known/openid-configuration
 */
export type URLDeDecouverte = string;
export type IdentifiantDuClient = string;
export type Secret = string;
export type CreerLesUtilisateursEnTantQueMembres = "never";
export type NomDeDomaineDeLEmail = string;
/**
 * Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.
 */
export type AccepterLesUtilisateursAuxEmailsNonVerifies = boolean;
export type ControlezLaManiereDontLesUtilisateursSontRedirigesVersCeFournisseur = "button";
export type NomDeDomaineDeLEmail1 = string;
export type TypeDeFournisseur1 = "otherSite";
export type Site1 = string;
export type TypeDeFournisseur2 = "otherSiteProvider";
export type Site2 = string;
export type Fournisseur = string;
export type FournisseursDIdentiteSSO = (
  | OpenIDConnect
  | UnAutreDeVosSites
  | UnFournisseurDIdentiteConfigureSurAutreDeVosSites
)[];

export interface Site {
  _id: string;
  owner: {
    type: "user" | "organization";
    id: string;
    name: string;
    department?: string;
    departmentName?: string;
  };
  host: string;
  theme: {
    primaryColor: string;
  };
  logo?: string;
  authMode: ModeDAuthentification;
  authOnlyOtherSite?: AutreSitePourLAuthentification;
  reducedPersonalInfoAtCreation?: ReduireLesInformationsPersonnellesALaCreationDeCompte;
  authProviders?: FournisseursDIdentiteSSO;
  [k: string]: unknown;
}
export interface OpenIDConnect {
  color?: Couleur;
  img?: URLDuLogoPetiteTaille;
  type?: TypeDeFournisseur;
  discovery: URLDeDecouverte;
  client: {
    id: IdentifiantDuClient;
    secret: Secret;
    [k: string]: unknown;
  };
  /**
   * si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.
   */
  createMember?: Jamais | Toujours | QuandLEmailAppartientAUnNomDeDomaine;
  ignoreEmailVerified?: AccepterLesUtilisateursAuxEmailsNonVerifies;
  /**
   * Si vous utilisez un autre mode que 'bouton' alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.
   */
  redirectMode?: Bouton | RedirectionAutoQuandLEmailAppartientAUnNomDeDomaine;
  [k: string]: unknown;
}
export interface Jamais {
  type?: CreerLesUtilisateursEnTantQueMembres;
  [k: string]: unknown;
}
export interface Toujours {
  type?: "always";
  [k: string]: unknown;
}
export interface QuandLEmailAppartientAUnNomDeDomaine {
  type?: "emailDomain";
  emailDomain?: NomDeDomaineDeLEmail;
  [k: string]: unknown;
}
export interface Bouton {
  type?: ControlezLaManiereDontLesUtilisateursSontRedirigesVersCeFournisseur;
  [k: string]: unknown;
}
export interface RedirectionAutoQuandLEmailAppartientAUnNomDeDomaine {
  type?: "emailDomain";
  emailDomain?: NomDeDomaineDeLEmail1;
  [k: string]: unknown;
}
export interface UnAutreDeVosSites {
  type?: TypeDeFournisseur1;
  site: Site1;
  [k: string]: unknown;
}
export interface UnFournisseurDIdentiteConfigureSurAutreDeVosSites {
  type?: TypeDeFournisseur2;
  site?: Site2;
  provider: Fournisseur;
  [k: string]: unknown;
}

export const resolvedSchema = {
  "type": "object",
  "$id": "https://github.com/data-fair/simple-directory/site",
  "title": "Site",
  "x-exports": [
    "types",
    "resolvedSchema"
  ],
  "required": [
    "_id",
    "owner",
    "host",
    "theme",
    "authMode"
  ],
  "properties": {
    "_id": {
      "type": "string"
    },
    "owner": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "type",
        "id",
        "name"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "user",
            "organization"
          ]
        },
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "department": {
          "type": "string"
        },
        "departmentName": {
          "type": "string"
        }
      }
    },
    "host": {
      "type": "string"
    },
    "theme": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "primaryColor"
      ],
      "properties": {
        "primaryColor": {
          "type": "string"
        }
      }
    },
    "logo": {
      "type": "string"
    },
    "authMode": {
      "default": "onlyBackOffice",
      "title": "Mode d'authentification",
      "type": "string",
      "oneOf": [
        {
          "const": "onlyLocal",
          "title": "uniquement sur le site lui même"
        },
        {
          "const": "onlyBackOffice",
          "title": "uniquement sur le back-office"
        },
        {
          "const": "ssoBackOffice",
          "title": "sur le site et sur le back-office par SSO"
        },
        {
          "const": "onlyOtherSite",
          "title": "uniquement sur un autre de vos sites"
        }
      ]
    },
    "authOnlyOtherSite": {
      "x-if": "parent.value.authMode === 'onlyOtherSite'",
      "type": "string",
      "title": "Autre site pour l'authentification",
      "x-fromData": "context.otherSites"
    },
    "reducedPersonalInfoAtCreation": {
      "type": "boolean",
      "title": "Réduire les informations personnelles à la création de compte",
      "description": "Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email."
    },
    "authProviders": {
      "x-if": "parent.value.authMode !== 'onlyOtherSite' && parent.value.authMode !== 'onlyBackOffice'",
      "type": "array",
      "title": "Fournisseurs d'identité (SSO)",
      "items": {
        "type": "object",
        "required": [
          "title",
          "type"
        ],
        "properties": {
          "id": {
            "type": "string",
            "title": "Identifiant",
            "readOnly": true
          },
          "title": {
            "type": "string",
            "title": "Nom"
          }
        },
        "oneOf": [
          {
            "type": "object",
            "title": "OpenID Connect",
            "required": [
              "discovery",
              "client"
            ],
            "properties": {
              "color": {
                "type": "string",
                "title": "Couleur",
                "x-display": "color-picker"
              },
              "img": {
                "type": "string",
                "title": "URL du logo (petite taille)"
              },
              "type": {
                "type": "string",
                "title": "Type de fournisseur",
                "const": "oidc"
              },
              "discovery": {
                "type": "string",
                "title": "URL de découverte",
                "description": "probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"
              },
              "client": {
                "type": "object",
                "required": [
                  "id",
                  "secret"
                ],
                "properties": {
                  "id": {
                    "type": "string",
                    "title": "Identifiant du client"
                  },
                  "secret": {
                    "type": "string",
                    "title": "Secret",
                    "writeOnly": true
                  }
                }
              },
              "createMember": {
                "type": "object",
                "description": "si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
                "default": {
                  "type": "never"
                },
                "oneOf": [
                  {
                    "title": "jamais",
                    "properties": {
                      "type": {
                        "const": "never",
                        "title": "Créer les utilisateurs en tant que membres"
                      }
                    }
                  },
                  {
                    "title": "toujours",
                    "properties": {
                      "type": {
                        "const": "always"
                      }
                    }
                  },
                  {
                    "title": "quand l'email appartient à un nom de domaine",
                    "properties": {
                      "type": {
                        "const": "emailDomain"
                      },
                      "emailDomain": {
                        "type": "string",
                        "title": "nom de domaine de l'email"
                      }
                    }
                  }
                ]
              },
              "ignoreEmailVerified": {
                "type": "boolean",
                "title": "Accepter les utilisateurs aux emails non vérifiés",
                "description": "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
              },
              "redirectMode": {
                "type": "object",
                "description": "Si vous utilisez un autre mode que 'bouton' alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
                "default": {
                  "type": "button"
                },
                "oneOf": [
                  {
                    "title": "bouton",
                    "properties": {
                      "type": {
                        "const": "button",
                        "title": "Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur"
                      }
                    }
                  },
                  {
                    "title": "redirection auto quand l'email appartient à un nom de domaine",
                    "properties": {
                      "type": {
                        "const": "emailDomain"
                      },
                      "emailDomain": {
                        "type": "string",
                        "title": "nom de domaine de l'email"
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            "type": "object",
            "title": "Un autre de vos sites",
            "required": [
              "site"
            ],
            "properties": {
              "type": {
                "type": "string",
                "title": "Type de fournisseur",
                "const": "otherSite"
              },
              "site": {
                "type": "string",
                "title": "Site",
                "x-fromData": "context.otherSites"
              }
            }
          },
          {
            "type": "object",
            "title": "Un fournisseur d'identité configuré sur autre de vos sites",
            "required": [
              "provider"
            ],
            "properties": {
              "type": {
                "type": "string",
                "title": "Type de fournisseur",
                "const": "otherSiteProvider"
              },
              "site": {
                "type": "string",
                "title": "Site",
                "x-fromData": "context.otherSites"
              },
              "provider": {
                "type": "string",
                "title": "Fournisseur",
                "x-if": "parent.value.site",
                "x-fromData": "context.otherSitesProviders[parent.value.site]"
              }
            }
          }
        ]
      }
    }
  }
}
