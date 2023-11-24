/**
 * Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.
 */
export type ReduireLesInformationsPersonnellesALaCreationDeCompte = boolean;
/**
 * Vous pouvez remplacer le message des conditions d'utilisation par défaut.
 */
export type MessageDesConditionsDUtilisation = string;
export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 = UniquementSurLeSiteLuiMeme | UniquementSurLeBackOffice | SurLeSiteEtSurLeBackOfficeParSSO | UniquementSurUnAutreDeVosSites;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type UniquementSurUnAutreDeVosSites = "onlyOtherSite";
export type ModeDAuthentification2 = string;
export type AutreSitePourLAuthentification = string;
export interface SitesResponse {
    count: number;
    results: SitePublic[];
}
export interface SitePublic {
    host?: string;
    theme: Theme;
    logo: string;
    reducedPersonalInfoAtCreation?: ReduireLesInformationsPersonnellesALaCreationDeCompte;
    tosMessage?: MessageDesConditionsDUtilisation;
    authMode: ModeDAuthentification;
    authOnlyOtherSite?: AutreSitePourLAuthentification;
}
export interface Theme {
    primaryColor: string;
}
export declare const stringify: (data: SitesResponse) => string;
