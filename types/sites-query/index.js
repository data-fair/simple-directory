"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
// validate function compiled using ajv
// @ts-ignore
const validate_js_1 = __importDefault(require("./validate.js"));
const validation_1 = require("@data-fair/lib/types/validation");
const validate = (data, lang = 'fr', name = 'data', internal) => {
    return (0, validation_1.validateThrow)(validate_js_1.default, data, lang, name, internal);
};
exports.validate = validate;
