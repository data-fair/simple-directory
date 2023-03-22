export interface SitePost {
    _id: string;
    owner: Account;
    host: string;
    theme: Theme;
    logo?: string;
}
export interface Account {
    type: "user" | "organization";
    id: string;
    name: string;
    department?: string;
    departmentName?: string;
}
export interface Theme {
    primaryColor: string;
}
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => SitePost;
export declare const stringify: (data: SitePost) => string;