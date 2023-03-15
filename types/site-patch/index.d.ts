export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 = UniquementSurLeSiteLuiMeme | UniquementSurLeBackOffice | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;
export interface SitePatch {
    _id: string;
    authMode: ModeDAuthentification;
}
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => SitePatch;
export declare const stringify: (data: SitePatch) => string;
export declare const resolvedSchema: {
    $id: string;
    "x-exports": string[];
    title: string;
    type: string;
    additionalProperties: boolean;
    required: string[];
    properties: {
        _id: {
            readOnly: boolean;
            type: string;
        };
        authMode: {
            default: string;
            title: string;
            type: string;
            oneOf: {
                title: string;
                enum: string[];
            }[];
        };
    };
};
