export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 =
  | UniquementSurLeSiteLuiMeme
  | UniquementSurLeBackOffice
  | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;
export type TypeDeFounisseur = "oidc";
/**
 * probablement de la forme http://mon-fournisseur/.well-known/openid-configuration
 */
export type URLDeDecouverte = string;
export type IdentifiantDuClient = string;
export type Secret = string;
export type FournisseursDIdentiteSSO = OpenIDConnect[];

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
  authProviders?: FournisseursDIdentiteSSO;
  [k: string]: unknown;
}
export interface OpenIDConnect {
  type?: TypeDeFounisseur;
  discovery: URLDeDecouverte;
  client: {
    id: IdentifiantDuClient;
    secret: Secret;
    [k: string]: unknown;
  };
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
        }
      ]
    },
    "authProviders": {
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
          },
          "color": {
            "type": "string",
            "title": "Couleur",
            "x-display": "color-picker"
          },
          "img": {
            "type": "string",
            "title": "URL du logo (petite taille)"
          },
          "createMember": {
            "type": "boolean",
            "title": "Créer les utilisateurs en tant que membres",
            "description": "si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site."
          },
          "ignoreEmailVerified": {
            "type": "boolean",
            "title": "Accepter les utilisateurs aux emails non vérifiés",
            "description": "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
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
              "type": {
                "type": "string",
                "title": "Type de founisseur",
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
              }
            }
          }
        ]
      }
    }
  }
}
