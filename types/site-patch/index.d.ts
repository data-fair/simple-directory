export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 = UniquementSurLeSiteLuiMeme | UniquementSurLeBackOffice | SurLeSiteEtSurLeBackOfficeParSSO | UniquementSurUnAutreDeVosSites;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type UniquementSurUnAutreDeVosSites = "onlyOtherSite";
export type ModeDAuthentification2 = string;
export type AutreSitePourLAuthentification = string;
export type Couleur = string;
export type URLDuLogoPetiteTaille = string;
export type TypeDeFournisseur = "oidc";
/**
 * probablement de la forme http://mon-fournisseur/.well-known/openid-configuration
 */
export type URLDeDecouverte = string;
export type IdentifiantDuClient = string;
export type Secret = string;
/**
 * si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.
 */
export type CreerLesUtilisateursEnTantQueMembres = boolean;
/**
 * Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.
 */
export type AccepterLesUtilisateursAuxEmailsNonVerifies = boolean;
export type TypeDeFournisseur1 = "otherSite";
export type Site = string;
export type TypeDeFournisseur2 = "otherSiteProvider";
export type Site1 = string;
export type Fournisseur = string;
export type FournisseursDIdentiteSSO = (OpenIDConnect | UnAutreDeVosSites | UnFournisseurDIdentiteConfigureSurAutreDeVosSites)[];
export interface SitePatch {
    _id: string;
    authMode: ModeDAuthentification;
    authOnlyOtherSite?: AutreSitePourLAuthentification;
    authProviders?: FournisseursDIdentiteSSO;
}
export interface OpenIDConnect {
    color?: Couleur;
    img?: URLDuLogoPetiteTaille;
    type?: TypeDeFournisseur;
    discovery: URLDeDecouverte;
    client: {
        id: IdentifiantDuClient;
        secret: Secret;
        [k: string]: unknown;
    };
    createMember?: CreerLesUtilisateursEnTantQueMembres;
    ignoreEmailVerified?: AccepterLesUtilisateursAuxEmailsNonVerifies;
    [k: string]: unknown;
}
export interface UnAutreDeVosSites {
    type?: TypeDeFournisseur1;
    site: Site;
    [k: string]: unknown;
}
export interface UnFournisseurDIdentiteConfigureSurAutreDeVosSites {
    type?: TypeDeFournisseur2;
    site?: Site1;
    provider: Fournisseur;
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
        authOnlyOtherSite: {
            "x-if": string;
            type: string;
            title: string;
            "x-fromData": string;
        };
        authProviders: {
            "x-if": string;
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
                };
                oneOf: ({
                    type: string;
                    title: string;
                    required: string[];
                    properties: {
                        color: {
                            type: string;
                            title: string;
                            "x-display": string;
                        };
                        img: {
                            type: string;
                            title: string;
                        };
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
                        site?: undefined;
                        provider?: undefined;
                    };
                } | {
                    type: string;
                    title: string;
                    required: string[];
                    properties: {
                        type: {
                            type: string;
                            title: string;
                            const: string;
                        };
                        site: {
                            type: string;
                            title: string;
                            "x-fromData": string;
                        };
                        color?: undefined;
                        img?: undefined;
                        discovery?: undefined;
                        client?: undefined;
                        createMember?: undefined;
                        ignoreEmailVerified?: undefined;
                        provider?: undefined;
                    };
                } | {
                    type: string;
                    title: string;
                    required: string[];
                    properties: {
                        type: {
                            type: string;
                            title: string;
                            const: string;
                        };
                        site: {
                            type: string;
                            title: string;
                            "x-fromData": string;
                        };
                        provider: {
                            type: string;
                            title: string;
                            "x-if": string;
                            "x-fromData": string;
                        };
                        color?: undefined;
                        img?: undefined;
                        discovery?: undefined;
                        client?: undefined;
                        createMember?: undefined;
                        ignoreEmailVerified?: undefined;
                    };
                })[];
            };
        };
    };
};
