export interface SitePost {
  _id: string;
  owner: Account;
  host: string;
  theme: Theme;
  logo?: string;
}
export interface Account {
  type: "user" | "organization";
  id: string;
  name: string;
  department?: string;
  departmentName?: string;
}
export interface Theme {
  primaryColor: string;
}

// validate function compiled using ajv
// @ts-ignore
import validateUnsafe from './validate.js'
import { validateThrow } from '@data-fair/lib/cjs/types/validation'
import { type ValidateFunction } from 'ajv'
export const validate = (data: any, lang: string = 'fr', name: string = 'data', internal?: boolean): SitePost => {
  return validateThrow<SitePost>(validateUnsafe as unknown as ValidateFunction, data, lang, name, internal)
}
        
// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: SitePost): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        