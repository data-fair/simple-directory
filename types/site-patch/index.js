"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedSchema = exports.stringify = exports.validate = void 0;
// validate function compiled using ajv
// @ts-ignore
const validate_js_1 = __importDefault(require("./validate.js"));
const validation_1 = require("@data-fair/lib/cjs/types/validation");
const validate = (data, lang = 'fr', name = 'data', internal) => {
    return (0, validation_1.validateThrow)(validate_js_1.default, data, lang, name, internal);
};
exports.validate = validate;
// stringify function compiled using fast-json-stringify
// @ts-ignore
const stringify_js_1 = __importDefault(require("./stringify.js"));
// @ts-ignore
const flatstr_1 = __importDefault(require("flatstr"));
const stringify = (data) => {
    const str = (0, stringify_js_1.default)(data);
    (0, flatstr_1.default)(str);
    return str;
};
exports.stringify = stringify;
exports.resolvedSchema = {
    "$id": "https://github.com/data-fair/simple-directory/site-patch",
    "x-exports": [
        "types",
        "validate",
        "stringify",
        "resolvedSchema"
    ],
    "title": "site-patch",
    "type": "object",
    "additionalProperties": false,
    "required": [
        "_id",
        "authMode"
    ],
    "properties": {
        "_id": {
            "readOnly": true,
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
