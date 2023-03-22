"use strict";
module.exports = validate19;
module.exports.default = validate19;
const schema27 = {"$id":"https://github.com/data-fair/simple-directory/site-post","x-exports":["types","validate","stringify"],"title":"site-post","type":"object","additionalProperties":false,"required":["_id","owner","host","theme"],"properties":{"_id":{"$ref":"https://github.com/data-fair/simple-directory/site#/properties/_id"},"owner":{"$ref":"https://github.com/data-fair/simple-directory/site#/properties/owner"},"host":{"$ref":"https://github.com/data-fair/simple-directory/site#/properties/host"},"theme":{"$ref":"https://github.com/data-fair/simple-directory/site#/properties/theme"},"logo":{"$ref":"https://github.com/data-fair/simple-directory/site#/properties/logo"}}};
const schema25 = {"type":"string"};
const schema23 = {"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"},"departmentName":{"type":"string"}},"$id":"Account"};
const schema30 = {"type":"string"};
const schema31 = {"type":"object","additionalProperties":false,"required":["primaryColor"],"properties":{"primaryColor":{"type":"string"}},"$id":"Theme"};
const schema32 = {"type":"string"};

function validate19(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/simple-directory/site-post" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data._id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "_id"},message:"must have required property '"+"_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.owner === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "owner"},message:"must have required property '"+"owner"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.host === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.theme === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "theme"},message:"must have required property '"+"theme"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "_id") || (key0 === "owner")) || (key0 === "host")) || (key0 === "theme")) || (key0 === "logo"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data._id !== undefined){
let data0 = data._id;
if(typeof data0 !== "string"){
let dataType0 = typeof data0;
let coerced0 = undefined;
if(dataType0 == 'object' && Array.isArray(data0) && data0.length == 1){
data0 = data0[0];
dataType0 = typeof data0;
if(typeof data0 === "string"){
coerced0 = data0;
}
}
if(!(coerced0 !== undefined)){
if(dataType0 == "number" || dataType0 == "boolean"){
coerced0 = "" + data0;
}
else if(data0 === null){
coerced0 = "";
}
else {
const err5 = {instancePath:instancePath+"/_id",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(coerced0 !== undefined){
data0 = coerced0;
if(data !== undefined){
data["_id"] = coerced0;
}
}
}
}
if(data.owner !== undefined){
let data1 = data.owner;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err6 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.id === undefined){
const err7 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data1.name === undefined){
const err8 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data1){
if(!(((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department")) || (key1 === "departmentName"))){
const err9 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data1.type !== undefined){
let data2 = data1.type;
if(typeof data2 !== "string"){
let dataType1 = typeof data2;
let coerced1 = undefined;
if(dataType1 == 'object' && Array.isArray(data2) && data2.length == 1){
data2 = data2[0];
dataType1 = typeof data2;
if(typeof data2 === "string"){
coerced1 = data2;
}
}
if(!(coerced1 !== undefined)){
if(dataType1 == "number" || dataType1 == "boolean"){
coerced1 = "" + data2;
}
else if(data2 === null){
coerced1 = "";
}
else {
const err10 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(coerced1 !== undefined){
data2 = coerced1;
if(data1 !== undefined){
data1["type"] = coerced1;
}
}
}
if(!((data2 === "user") || (data2 === "organization"))){
const err11 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema23.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data1.id !== undefined){
let data3 = data1.id;
if(typeof data3 !== "string"){
let dataType2 = typeof data3;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data3) && data3.length == 1){
data3 = data3[0];
dataType2 = typeof data3;
if(typeof data3 === "string"){
coerced2 = data3;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 == "number" || dataType2 == "boolean"){
coerced2 = "" + data3;
}
else if(data3 === null){
coerced2 = "";
}
else {
const err12 = {instancePath:instancePath+"/owner/id",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(coerced2 !== undefined){
data3 = coerced2;
if(data1 !== undefined){
data1["id"] = coerced2;
}
}
}
}
if(data1.name !== undefined){
let data4 = data1.name;
if(typeof data4 !== "string"){
let dataType3 = typeof data4;
let coerced3 = undefined;
if(dataType3 == 'object' && Array.isArray(data4) && data4.length == 1){
data4 = data4[0];
dataType3 = typeof data4;
if(typeof data4 === "string"){
coerced3 = data4;
}
}
if(!(coerced3 !== undefined)){
if(dataType3 == "number" || dataType3 == "boolean"){
coerced3 = "" + data4;
}
else if(data4 === null){
coerced3 = "";
}
else {
const err13 = {instancePath:instancePath+"/owner/name",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(coerced3 !== undefined){
data4 = coerced3;
if(data1 !== undefined){
data1["name"] = coerced3;
}
}
}
}
if(data1.department !== undefined){
let data5 = data1.department;
if(typeof data5 !== "string"){
let dataType4 = typeof data5;
let coerced4 = undefined;
if(dataType4 == 'object' && Array.isArray(data5) && data5.length == 1){
data5 = data5[0];
dataType4 = typeof data5;
if(typeof data5 === "string"){
coerced4 = data5;
}
}
if(!(coerced4 !== undefined)){
if(dataType4 == "number" || dataType4 == "boolean"){
coerced4 = "" + data5;
}
else if(data5 === null){
coerced4 = "";
}
else {
const err14 = {instancePath:instancePath+"/owner/department",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(coerced4 !== undefined){
data5 = coerced4;
if(data1 !== undefined){
data1["department"] = coerced4;
}
}
}
}
if(data1.departmentName !== undefined){
let data6 = data1.departmentName;
if(typeof data6 !== "string"){
let dataType5 = typeof data6;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data6) && data6.length == 1){
data6 = data6[0];
dataType5 = typeof data6;
if(typeof data6 === "string"){
coerced5 = data6;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 == "number" || dataType5 == "boolean"){
coerced5 = "" + data6;
}
else if(data6 === null){
coerced5 = "";
}
else {
const err15 = {instancePath:instancePath+"/owner/departmentName",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/properties/departmentName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(coerced5 !== undefined){
data6 = coerced5;
if(data1 !== undefined){
data1["departmentName"] = coerced5;
}
}
}
}
}
else {
const err16 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.host !== undefined){
let data7 = data.host;
if(typeof data7 !== "string"){
let dataType6 = typeof data7;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data7) && data7.length == 1){
data7 = data7[0];
dataType6 = typeof data7;
if(typeof data7 === "string"){
coerced6 = data7;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "number" || dataType6 == "boolean"){
coerced6 = "" + data7;
}
else if(data7 === null){
coerced6 = "";
}
else {
const err17 = {instancePath:instancePath+"/host",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(coerced6 !== undefined){
data7 = coerced6;
if(data !== undefined){
data["host"] = coerced6;
}
}
}
}
if(data.theme !== undefined){
let data8 = data.theme;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.primaryColor === undefined){
const err18 = {instancePath:instancePath+"/theme",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/theme/required",keyword:"required",params:{missingProperty: "primaryColor"},message:"must have required property '"+"primaryColor"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key2 in data8){
if(!(key2 === "primaryColor")){
const err19 = {instancePath:instancePath+"/theme",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/theme/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data8.primaryColor !== undefined){
let data9 = data8.primaryColor;
if(typeof data9 !== "string"){
let dataType7 = typeof data9;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType7 = typeof data9;
if(typeof data9 === "string"){
coerced7 = data9;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 == "number" || dataType7 == "boolean"){
coerced7 = "" + data9;
}
else if(data9 === null){
coerced7 = "";
}
else {
const err20 = {instancePath:instancePath+"/theme/primaryColor",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/theme/properties/primaryColor/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(coerced7 !== undefined){
data9 = coerced7;
if(data8 !== undefined){
data8["primaryColor"] = coerced7;
}
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/theme",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/theme/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.logo !== undefined){
let data10 = data.logo;
if(typeof data10 !== "string"){
let dataType8 = typeof data10;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType8 = typeof data10;
if(typeof data10 === "string"){
coerced8 = data10;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 == "number" || dataType8 == "boolean"){
coerced8 = "" + data10;
}
else if(data10 === null){
coerced8 = "";
}
else {
const err22 = {instancePath:instancePath+"/logo",schemaPath:"https://github.com/data-fair/simple-directory/site#/properties/logo/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data !== undefined){
data["logo"] = coerced8;
}
}
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
validate19.errors = vErrors;
return errors === 0;
}