import type { UiConfig } from '@sd/api/src/ui-config.ts'

// cf https://www.cnil.fr/fr/questions-reponses-sur-la-nouvelle-recommandation-relative-aux-mots-de-passe-et-autres-secrets
// question "Est-il possible de remplacer les contraintes par un calcul dynamique de l’entropie d’un mot de passe ?"
export const passwordEntropy = (password: string) => {
  let alphabetLen = 0
  if (/[a-z]/.test(password)) alphabetLen += 26
  if (/[A-Z]/.test(password)) alphabetLen += 26
  if (/\d/.test(password)) alphabetLen += 10
  if (/[^A-Za-z0-9]/.test(password)) alphabetLen += 40
  return Math.floor(Math.log2(Math.pow(alphabetLen, password.length)))
}

export const validatePassword = (password: string, validation: UiConfig['passwordValidation'], messages: UiConfig['publicMessages']) => {
  if (validation.minLength && password.length < validation.minLength) {
    return (messages.errors.passwordMinLength as string).replace('{minLength}', validation.minLength.toString())
  }
  if (validation.minCharClasses) {
    let nbCharClasses = 0
    if (/[a-z]/.test(password)) nbCharClasses++
    if (/[A-Z]/.test(password)) nbCharClasses++
    if (/\d/.test(password)) nbCharClasses++
    if (/[^A-Za-z0-9]/.test(password)) nbCharClasses++
    if (nbCharClasses < validation.minCharClasses) {
      return (messages.errors.passwordMinCharClasses as string).replace('{minCharClasses}', validation.minCharClasses.toString())
    }
  }
  if (validation.entropy && passwordEntropy(password) < validation.entropy) {
    return messages.errors.passwordEntropy as string
  }
  return true
}
