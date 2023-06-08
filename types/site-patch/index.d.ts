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
export type FournisseursDIdentiteSSO = OpenIDConnect[];
export interface SitePatch {
    _id: string;
    authMode: ModeDAuthentification;
    authProviders?: FournisseursDIdentiteSSO;
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
                const: string;
                title: string;
            }[];
        };
        authProviders: {
            type: string;
            title: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        title: string;
                        readOnly: boolean;
                    };
                    title: {
                        type: string;
                        title: string;
                    };
                    color: {
                        type: string;
                        title: string;
                        "x-display": string;
                    };
                    img: {
                        type: string;
                        title: string;
                    };
                    createMember: {
                        type: string;
                        title: string;
                        description: string;
                    };
                    ignoreEmailVerified: {
                        type: string;
                        title: string;
                        description: string;
                    };
                };
                oneOf: {
                    type: string;
                    title: string;
                    required: string[];
                    properties: {
                        type: {
                            type: string;
                            title: string;
                            const: string;
                        };
                        discovery: {
                            type: string;
                            title: string;
                            description: string;
                        };
                        client: {
                            type: string;
                            required: string[];
                            properties: {
                                id: {
                                    type: string;
                                    title: string;
                                };
                                secret: {
                                    type: string;
                                    title: string;
                                    writeOnly: boolean;
                                };
                            };
                        };
                    };
                }[];
            };
        };
    };
};
