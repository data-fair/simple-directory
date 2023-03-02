"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = void 0;
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
