export interface SitesResponse {
    count: number;
    results: Site[];
}
export interface Site {
    _id: string;
    owner: Account;
    host: string;
    theme: Theme;
    [k: string]: unknown;
}
export interface Account {
    type: "user" | "organization";
    id: string;
    name: string;
    department?: string;
    departmentName?: string;
}
/**
 * This interface was referenced by `Site`'s JSON-Schema
 * via the `definition` "theme".
 */
export interface Theme {
    primaryColor: string;
}
export declare const stringify: (data: SitesResponse) => string;
