export interface SitePublic {
    host: string;
    theme: Theme;
}
export interface Theme {
    primaryColor: string;
}
export declare const stringify: (data: SitePublic) => string;
