export type OnlyUsersCreatedOnThisSiteCanLogIn = "onlyLocal";
export type OnlyUsersCreatedInTheBackOfficeCanLogIn = "onlyBackOffice";
export type UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink = "ssoBackOffice";

export interface SitePublic {
  host: string;
  theme: Theme;
  authMode?: (
    | OnlyUsersCreatedOnThisSiteCanLogIn
    | OnlyUsersCreatedInTheBackOfficeCanLogIn
    | UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink
  ) &
    string;
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
        