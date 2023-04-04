export interface PartnerPost {
    name: string;
    contactEmail: string;
}
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => PartnerPost;
