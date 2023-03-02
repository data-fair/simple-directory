"use strict";
exports.__esModule = true;
exports.stringify = void 0;
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
