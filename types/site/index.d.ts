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
export interface Site {
    _id: string;
    owner: {
        type: "user" | "organization";
        id: string;
        name: string;
        department?: string;
        departmentName?: string;
    };
    host: string;
    theme: {
        primaryColor: string;
    };
    logo?: string;
    authMode: ModeDAuthentification;
    authProviders?: FournisseursDIdentiteSSO;
    [k: string]: unknown;
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
export declare const resolvedSchema: {
    type: string;
    $id: string;
    title: string;
    "x-exports": string[];
    required: string[];
    properties: {
        _id: {
            type: string;
        };
        owner: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    type: string;
                    enum: string[];
                };
                id: {
                    type: string;
                };
                name: {
                    type: string;
                };
                department: {
                    type: string;
                };
                departmentName: {
                    type: string;
                };
            };
        };
        host: {
            type: string;
        };
        theme: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                primaryColor: {
                    type: string;
                };
            };
        };
        logo: {
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
