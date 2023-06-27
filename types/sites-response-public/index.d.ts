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
    authMode: ModeDAuthentification;
    authOnlyOtherSite?: AutreSitePourLAuthentification;
}
export interface Theme {
    primaryColor: string;
}
export declare const stringify: (data: SitesResponse) => string;
