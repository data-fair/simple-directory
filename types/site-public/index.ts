/**
 * Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.
 */
export type ReduireLesInformationsPersonnellesALaCreationDeCompte = boolean;
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

export interface SitePublic {
  host?: string;
  theme: Theme;
  logo: string;
  reducedPersonalInfoAtCreation?: ReduireLesInformationsPersonnellesALaCreationDeCompte;
  authMode: ModeDAuthentification;
  authOnlyOtherSite?: AutreSitePourLAuthentification;
}
export interface Theme {
  primaryColor: string;
}

// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: SitePublic): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        