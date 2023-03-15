export type AuthMode =
  | OnlyUsersCreatedOnThisSiteCanLogIn
  | OnlyUsersCreatedInTheBackOfficeCanLogIn
  | UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink;
export type OnlyUsersCreatedOnThisSiteCanLogIn = "onlyLocal";
export type OnlyUsersCreatedInTheBackOfficeCanLogIn = "onlyBackOffice";
export type UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink = "ssoBackOffice";
export type AuthMode1 = string;

export interface Site {
  _id: string;
  owner: Account;
  host: string;
  theme: Theme;
  authMode: AuthMode & AuthMode1;
  [k: string]: unknown;
}
export interface Account {
  type: "user" | "organization";
  id: string;
  name: string;
  department?: string;
  departmentName?: string;
}
/**
 * This interface was referenced by `Site`'s JSON-Schema
 * via the `definition` "theme".
 */
export interface Theme {
  primaryColor: string;
}

// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: Site): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        
// validate function compiled using ajv
// @ts-ignore
import validateUnsafe from './validate.js'
import { validateThrow } from '@data-fair/lib/cjs/types/validation'
import { type ValidateFunction } from 'ajv'
export const validate = (data: any, lang: string = 'fr', name: string = 'data', internal?: boolean): Site => {
  return validateThrow<Site>(validateUnsafe as unknown as ValidateFunction, data, lang, name, internal)
}
        