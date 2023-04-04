export interface PartnerPost {
  name: string;
  contactEmail: string;
}

// validate function compiled using ajv
// @ts-ignore
import validateUnsafe from './validate.js'
import { validateThrow } from '@data-fair/lib/cjs/types/validation'
import { type ValidateFunction } from 'ajv'
export const validate = (data: any, lang: string = 'fr', name: string = 'data', internal?: boolean): PartnerPost => {
  return validateThrow<PartnerPost>(validateUnsafe as unknown as ValidateFunction, data, lang, name, internal)
}
        