export interface SitesQuery {
  showAll?: boolean;
}

// validate function compiled using ajv
// @ts-ignore
import validateUnsafe from './validate.js'
import { validateThrow } from '@data-fair/lib/types/validation'
import { type ValidateFunction } from 'ajv'
export const validate = (data: any, lang: string = 'fr', name: string = 'data', internal?: boolean): SitesQuery => {
  return validateThrow<SitesQuery>(validateUnsafe as unknown as ValidateFunction, data, lang, name, internal)
}
        