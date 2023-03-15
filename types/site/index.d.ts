/**
 * This interface was referenced by `Site`'s JSON-Schema
 * via the `definition` "logo".
 */
export type Logo = string;
export type OnlyUsersCreatedOnThisSiteCanLogIn = "onlyLocal";
export type OnlyUsersCreatedInTheBackOfficeCanLogIn = "onlyBackOffice";
export type UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink = "ssoBackOffice";
export type AuthMode = OnlyUsersCreatedOnThisSiteCanLogIn | OnlyUsersCreatedInTheBackOfficeCanLogIn | UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink;
export type AuthMode1 = string;
export interface Site {
    _id: string;
    owner: Account;
    host: string;
    theme: Theme;
    logo?: Logo;
    authMode: (OnlyUsersCreatedOnThisSiteCanLogIn | OnlyUsersCreatedInTheBackOfficeCanLogIn | UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink) & string;
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
export declare const stringify: (data: Site) => string;
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => Site;
