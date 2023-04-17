export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 =
  | UniquementSurLeSiteLuiMeme
  | UniquementSurLeBackOffice
  | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;

export interface SitesResponse {
  count: number;
  results: SitePublic[];
}
export interface SitePublic {
  host?: string;
  theme: Theme;
  logo: string;
  authMode: ModeDAuthentification;
}
export interface Theme {
  primaryColor: string;
}

// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: SitesResponse): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        