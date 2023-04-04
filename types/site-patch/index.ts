export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 =
  | UniquementSurLeSiteLuiMeme
  | UniquementSurLeBackOffice
  | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;

export interface SitePatch {
  _id: string;
  authMode: ModeDAuthentification;
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
    }
  }
}
