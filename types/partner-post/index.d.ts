export interface PartnerPost {
    name: string;
    redirect?: string;
    contactEmail: string;
}
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => PartnerPost;
