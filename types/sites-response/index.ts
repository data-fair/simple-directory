export type ModeDAuthentification = ModeDAuthentification1 & ModeDAuthentification2;
export type ModeDAuthentification1 =
  | UniquementSurLeSiteLuiMeme
  | UniquementSurLeBackOffice
  | SurLeSiteEtSurLeBackOfficeParSSO;
export type UniquementSurLeSiteLuiMeme = "onlyLocal";
export type UniquementSurLeBackOffice = "onlyBackOffice";
export type SurLeSiteEtSurLeBackOfficeParSSO = "ssoBackOffice";
export type ModeDAuthentification2 = string;
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
export type Site1 = string;
export type TypeDeFournisseur2 = "otherSiteProvider";
export type Site2 = string;
export type Fournisseur = string;
export type FournisseursDIdentiteSSO = (
  | OpenIDConnect
  | UnAutreDeVosSites
  | UnFournisseurDIdentiteConfigureSurAutreDeVosSites
)[];

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
  site: Site1;
  [k: string]: unknown;
}
export interface UnFournisseurDIdentiteConfigureSurAutreDeVosSites {
  type?: TypeDeFournisseur2;
  site?: Site2;
  provider: Fournisseur;
  [k: string]: unknown;
}

// stringify function compiled using fast-json-stringify
// @ts-ignore
import stringifyUnsafe from './stringify.js'
// @ts-ignore
import flatstr from 'flatstr'
export const  stringify = (data: SitesResponse): string => {
  const str = stringifyUnsafe(data)
  flatstr(str)
  return str
}
        