export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 = UniquementSurLeSiteLuiMeme | UniquementSurLeBackOffice | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;
export type TypeDeFounisseur = "oidc";
/**
 * probablement de la forme http://mon-fournisseur/.well-known/openid-configuration
 */
export type URLDeDecouverte = string;
export type IdentifiantDuClient = string;
export type Secret = string;
export type MetadataXML = string;
export type FournisseursDIdentiteSSO = (OpenIDConnect | SAMLV2)[];
export interface SitesResponse {
    count: number;
    results: Site[];
}
export interface Site {
    _id: string;
    owner: Owner;
    host: string;
    theme: Theme;
    logo?: string;
    authMode: ModeDAuthentification;
    authProviders?: FournisseursDIdentiteSSO;
    [k: string]: unknown;
}
export interface Owner {
    type: "user" | "organization";
    id: string;
    name: string;
    department?: string;
    departmentName?: string;
}
export interface Theme {
    primaryColor: string;
}
export interface OpenIDConnect {
    type?: TypeDeFounisseur;
    discovery: URLDeDecouverte;
    client: {
        id: IdentifiantDuClient;
        secret: Secret;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
export interface SAMLV2 {
    type?: "saml2";
    metadata?: MetadataXML;
    [k: string]: unknown;
}
export declare const stringify: (data: SitesResponse) => string;
