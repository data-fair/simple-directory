"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedSchema = void 0;
exports.resolvedSchema = {
    "type": "object",
    "$id": "https://github.com/data-fair/simple-directory/site",
    "title": "Site",
    "x-exports": [
        "types",
        "resolvedSchema"
    ],
    "required": [
        "_id",
        "owner",
        "host",
        "theme",
        "authMode"
    ],
    "properties": {
        "_id": {
            "type": "string"
        },
        "owner": {
            "type": "object",
            "additionalProperties": false,
            "required": [
                "type",
                "id",
                "name"
            ],
            "properties": {
                "type": {
                    "type": "string",
                    "enum": [
                        "user",
                        "organization"
                    ]
                },
                "id": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "department": {
                    "type": "string"
                },
                "departmentName": {
                    "type": "string"
                }
            }
        },
        "host": {
            "type": "string"
        },
        "theme": {
            "type": "object",
            "additionalProperties": false,
            "required": [
                "primaryColor"
            ],
            "properties": {
                "primaryColor": {
                    "type": "string"
                }
            }
        },
        "logo": {
            "type": "string"
        },
        "authMode": {
            "default": "onlyBackOffice",
            "title": "Mode d'authentification",
            "type": "string",
            "oneOf": [
                {
                    "const": "onlyLocal",
                    "title": "uniquement sur le site lui même"
                },
                {
                    "const": "onlyBackOffice",
                    "title": "uniquement sur le back-office"
                },
                {
                    "const": "ssoBackOffice",
                    "title": "sur le site et sur le back-office par SSO"
                }
            ]
        },
        "authProviders": {
            "type": "array",
            "title": "Fournisseurs d'identité (SSO)",
            "items": {
                "type": "object",
                "required": [
                    "title",
                    "type"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "title": "Identifiant",
                        "readOnly": true
                    },
                    "title": {
                        "type": "string",
                        "title": "Nom"
                    }
                },
                "oneOf": [
                    {
                        "type": "object",
                        "title": "OpenID Connect",
                        "required": [
                            "discovery",
                            "client"
                        ],
                        "properties": {
                            "color": {
                                "type": "string",
                                "title": "Couleur",
                                "x-display": "color-picker"
                            },
                            "img": {
                                "type": "string",
                                "title": "URL du logo (petite taille)"
                            },
                            "type": {
                                "type": "string",
                                "title": "Type de fournisseur",
                                "const": "oidc"
                            },
                            "discovery": {
                                "type": "string",
                                "title": "URL de découverte",
                                "description": "probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"
                            },
                            "client": {
                                "type": "object",
                                "required": [
                                    "id",
                                    "secret"
                                ],
                                "properties": {
                                    "id": {
                                        "type": "string",
                                        "title": "Identifiant du client"
                                    },
                                    "secret": {
                                        "type": "string",
                                        "title": "Secret",
                                        "writeOnly": true
                                    }
                                }
                            },
                            "createMember": {
                                "type": "boolean",
                                "title": "Créer les utilisateurs en tant que membres",
                                "description": "si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site."
                            },
                            "ignoreEmailVerified": {
                                "type": "boolean",
                                "title": "Accepter les utilisateurs aux emails non vérifiés",
                                "description": "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
                            }
                        }
                    },
                    {
                        "type": "object",
                        "title": "Un autre de vos sites",
                        "properties": {
                            "type": {
                                "type": "string",
                                "title": "Type de fournisseur",
                                "const": "otherSite"
                            },
                            "site": {
                                "type": "string",
                                "title": "Site",
                                "x-fromData": "context.otherSites"
                            }
                        }
                    }
                ]
            }
        }
    }
};
