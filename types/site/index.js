"use strict";
exports.__esModule = true;
exports.validate = exports.stringify = void 0;
// stringify function compiled using fast-json-stringify
// @ts-ignore
var stringify_js_1 = require("./stringify.js");
// @ts-ignore
var flatstr_1 = require("flatstr");
var stringify = function (data) {
    var str = (0, stringify_js_1["default"])(data);
    (0, flatstr_1["default"])(str);
    return str;
};
exports.stringify = stringify;
// validate function compiled using ajv
// @ts-ignore
var validate_js_1 = require("./validate.js");
var validation_1 = require("@data-fair/lib/types/validation");
var validate = function (data, lang, name, internal) {
    if (lang === void 0) { lang = 'fr'; }
    if (name === void 0) { name = 'data'; }
    return (0, validation_1.validateThrow)(validate_js_1["default"], data, lang, name, internal);
};
exports.validate = validate;
