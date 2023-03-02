"use strict";module.exports = validate18;module.exports.default = validate18;const schema25 = {"$id":"https://github.com/data-fair/simple-directory/sites-query","x-exports":["types","validate"],"title":"sites-query","type":"object","additionalProperties":false,"required":[],"properties":{"showAll":{"type":"boolean"}}};function validate18(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){/*# sourceURL="https://github.com/data-fair/simple-directory/sites-query" */;let vErrors = null;let errors = 0;if(data && typeof data == "object" && !Array.isArray(data)){for(const key0 in data){if(!(key0 === "showAll")){const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};if(vErrors === null){vErrors = [err0];}else {vErrors.push(err0);}errors++;}}if(data.showAll !== undefined){let data0 = data.showAll;if(typeof data0 !== "boolean"){let dataType0 = typeof data0;let coerced0 = undefined;if(dataType0 == 'object' && Array.isArray(data0) && data0.length == 1){data0 = data0[0];dataType0 = typeof data0;if(typeof data0 === "boolean"){coerced0 = data0;}}if(!(coerced0 !== undefined)){if(data0 === "false" || data0 === 0 || data0 === null){coerced0 = false;}else if(data0 === "true" || data0 === 1){coerced0 = true;}else {const err1 = {instancePath:instancePath+"/showAll",schemaPath:"#/properties/showAll/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};if(vErrors === null){vErrors = [err1];}else {vErrors.push(err1);}errors++;}}if(coerced0 !== undefined){data0 = coerced0;if(data !== undefined){data["showAll"] = coerced0;}}}}}else {const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};if(vErrors === null){vErrors = [err2];}else {vErrors.push(err2);}errors++;}validate18.errors = vErrors;return errors === 0;}