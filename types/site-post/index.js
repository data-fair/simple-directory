"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = exports.validate = void 0;
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
