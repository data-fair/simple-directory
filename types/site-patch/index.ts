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

export interface SitePatch {
  _id: string;
  authMode: ModeDAuthentification;
  authProviders?: FournisseursDIdentiteSSO;
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

// validate function compiled using ajv
// @ts-ignore
import validateUnsafe from './validate.js'
import { validateThrow } from '@data-fair/lib/cjs/types/validation'
import { type ValidateFunction } from 'ajv'
export const validate = (data: any, lang: string = 'fr', name: string = 'data', internal?: boolean): SitePatch => {
  return validateThrow<SitePatch>(validateUnsafe as unknown as ValidateFunction, data, lang, name, internal)
}
        
// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: SitePatch): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        
export const resolvedSchema = {
  "$id": "https://github.com/data-fair/simple-directory/site-patch",
  "x-exports": [
    "types",
    "validate",
    "stringify",
    "resolvedSchema"
  ],
  "title": "site-patch",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_id",
    "authMode"
  ],
  "properties": {
    "_id": {
      "readOnly": true,
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
