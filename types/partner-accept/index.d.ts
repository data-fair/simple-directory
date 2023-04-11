export interface PartnerAccept {
    id: string;
    contactEmail: string;
    token: string;
}
export declare const validate: (data: any, lang?: string, name?: string, internal?: boolean) => PartnerAccept;
