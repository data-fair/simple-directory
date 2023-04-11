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
                }
            ]
        }
    }
};
