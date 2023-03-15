export type OnlyUsersCreatedOnThisSiteCanLogIn = "onlyLocal";
export type OnlyUsersCreatedInTheBackOfficeCanLogIn = "onlyBackOffice";
export type UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink = "ssoBackOffice";
export interface SitePublic {
    theme: Theme;
    logo: string;
    authMode: (OnlyUsersCreatedOnThisSiteCanLogIn | OnlyUsersCreatedInTheBackOfficeCanLogIn | UsersCanBeCreatedOnThisSiteButBackOfficeUsersCanAlsoLoginThroughASSOLink) & string;
}
export interface Theme {
    primaryColor: string;
}
export declare const stringify: (data: SitePublic) => string;
