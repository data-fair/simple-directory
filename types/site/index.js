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
                },
                {
                    "const": "onlyOtherSite",
                    "title": "uniquement sur un autre de vos sites"
                }
            ]
        },
        "authOnlyOtherSite": {
            "x-if": "parent.value.authMode === 'onlyOtherSite'",
            "type": "string",
            "title": "Autre site pour l'authentification",
            "x-fromData": "context.otherSites"
        },
        "authProviders": {
            "x-if": "parent.value.authMode !== 'onlyOtherSite' && parent.value.authMode !== 'onlyBackOffice'",
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
                                "type": "object",
                                "description": "si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.",
                                "oneOf": [
                                    {
                                        "title": "jamais",
                                        "properties": {
                                            "type": {
                                                "const": "never",
                                                "title": "Créer les utilisateurs en tant que membres"
                                            }
                                        }
                                    },
                                    {
                                        "title": "toujours",
                                        "properties": {
                                            "type": {
                                                "const": "always"
                                            }
                                        }
                                    },
                                    {
                                        "title": "quand l'email appartient à un nom de domaine",
                                        "properties": {
                                            "type": {
                                                "const": "emailDomain"
                                            },
                                            "emailDomain": {
                                                "type": "string",
                                                "title": "nom de domaine de l'email"
                                            }
                                        }
                                    }
                                ]
                            },
                            "ignoreEmailVerified": {
                                "type": "boolean",
                                "title": "Accepter les utilisateurs aux emails non vérifiés",
                                "description": "Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."
                            },
                            "redirectMode": {
                                "type": "object",
                                "description": "Si vous utilisez un autre mode que 'bouton' alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.",
                                "oneOf": [
                                    {
                                        "title": "bouton",
                                        "properties": {
                                            "type": {
                                                "const": "button",
                                                "title": "Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur"
                                            }
                                        }
                                    },
                                    {
                                        "title": "redirection auto quand l'email appartient à un nom de domaine",
                                        "properties": {
                                            "type": {
                                                "const": "emailDomain"
                                            },
                                            "emailDomain": {
                                                "type": "string",
                                                "title": "nom de domaine de l'email"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "type": "object",
                        "title": "Un autre de vos sites",
                        "required": [
                            "site"
                        ],
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
                    },
                    {
                        "type": "object",
                        "title": "Un fournisseur d'identité configuré sur autre de vos sites",
                        "required": [
                            "provider"
                        ],
                        "properties": {
                            "type": {
                                "type": "string",
                                "title": "Type de fournisseur",
                                "const": "otherSiteProvider"
                            },
                            "site": {
                                "type": "string",
                                "title": "Site",
                                "x-fromData": "context.otherSites"
                            },
                            "provider": {
                                "type": "string",
                                "title": "Fournisseur",
                                "x-if": "parent.value.site",
                                "x-fromData": "context.otherSitesProviders[parent.value.site]"
                            }
                        }
                    }
                ]
            }
        }
    }
};
