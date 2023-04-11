"use strict";
module.exports = validate16;
module.exports.default = validate16;
const schema18 = {"$id":"https://github.com/data-fair/simple-directory/site-patch","x-exports":["types","validate","stringify","resolvedSchema"],"title":"site-patch","type":"object","additionalProperties":false,"required":["_id","authMode"],"properties":{"_id":{"readOnly":true,"type":"string"},"authMode":{"default":"onlyBackOffice","title":"Mode d'authentification","type":"string","oneOf":[{"const":"onlyLocal","title":"uniquement sur le site lui même"},{"const":"onlyBackOffice","title":"uniquement sur le back-office"},{"const":"ssoBackOffice","title":"sur le site et sur le back-office par SSO"}]},"authProviders":{"type":"array","title":"Fournisseurs d'identité (SSO)","items":{"type":"object","required":["title","type"],"properties":{"id":{"type":"string","title":"Identifiant","readOnly":true},"title":{"type":"string","title":"Nom"},"color":{"type":"string","title":"Couleur","x-display":"color-picker"},"img":{"type":"string","title":"URL du logo (petite taille)"}},"oneOf":[{"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"type":{"type":"string","title":"Type de founisseur","const":"oidc"},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client"},"secret":{"type":"string","title":"Secret","writeOnly":true}}}}}]}}}};

function validate16(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/simple-directory/site-patch" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.authMode === undefined){
data.authMode = "onlyBackOffice";
}
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
if(data.authMode === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authMode"},message:"must have required property '"+"authMode"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "_id") || (key0 === "authMode")) || (key0 === "authProviders"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
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
const err3 = {instancePath:instancePath+"/_id",schemaPath:"#/properties/_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
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
let data1 = data.authMode;
if(typeof data1 !== "string"){
let dataType1 = typeof data1;
let coerced1 = undefined;
if(dataType1 == 'object' && Array.isArray(data1) && data1.length == 1){
data1 = data1[0];
dataType1 = typeof data1;
if(typeof data1 === "string"){
coerced1 = data1;
}
}
if(!(coerced1 !== undefined)){
if(dataType1 == "number" || dataType1 == "boolean"){
coerced1 = "" + data1;
}
else if(data1 === null){
coerced1 = "";
}
else {
const err4 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(coerced1 !== undefined){
data1 = coerced1;
if(data !== undefined){
data["authMode"] = coerced1;
}
}
}
const _errs6 = errors;
let valid1 = false;
let passing0 = null;
const _errs7 = errors;
if("onlyLocal" !== data1){
const err5 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/0/const",keyword:"const",params:{allowedValue: "onlyLocal"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs8 = errors;
if("onlyBackOffice" !== data1){
const err6 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/1/const",keyword:"const",params:{allowedValue: "onlyBackOffice"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs9 = errors;
if("ssoBackOffice" !== data1){
const err7 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/2/const",keyword:"const",params:{allowedValue: "ssoBackOffice"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
}
}
if(!valid1){
const err8 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
if(data.authProviders !== undefined){
let data2 = data.authProviders;
if(!(Array.isArray(data2))){
let dataType2 = typeof data2;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data2) && data2.length == 1){
data2 = data2[0];
dataType2 = typeof data2;
if(Array.isArray(data2)){
coerced2 = data2;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 === "string" || dataType2 === "number"
              || dataType2 === "boolean" || data2 === null){
coerced2 = [data2];
}
else {
const err9 = {instancePath:instancePath+"/authProviders",schemaPath:"#/properties/authProviders/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(coerced2 !== undefined){
data2 = coerced2;
if(data !== undefined){
data["authProviders"] = coerced2;
}
}
}
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
const _errs14 = errors;
let valid4 = false;
let passing1 = null;
const _errs15 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.discovery === undefined){
const err10 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/required",keyword:"required",params:{missingProperty: "discovery"},message:"must have required property '"+"discovery"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data3.client === undefined){
const err11 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/required",keyword:"required",params:{missingProperty: "client"},message:"must have required property '"+"client"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3.type !== undefined){
let data4 = data3.type;
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
const err12 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(coerced3 !== undefined){
data4 = coerced3;
if(data3 !== undefined){
data3["type"] = coerced3;
}
}
}
if("oidc" !== data4){
const err13 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data3.discovery !== undefined){
let data5 = data3.discovery;
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
const err14 = {instancePath:instancePath+"/authProviders/" + i0+"/discovery",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(data3 !== undefined){
data3["discovery"] = coerced4;
}
}
}
}
if(data3.client !== undefined){
let data6 = data3.client;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.id === undefined){
const err15 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data6.secret === undefined){
const err16 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data6.id !== undefined){
let data7 = data6.id;
if(typeof data7 !== "string"){
let dataType5 = typeof data7;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data7) && data7.length == 1){
data7 = data7[0];
dataType5 = typeof data7;
if(typeof data7 === "string"){
coerced5 = data7;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 == "number" || dataType5 == "boolean"){
coerced5 = "" + data7;
}
else if(data7 === null){
coerced5 = "";
}
else {
const err17 = {instancePath:instancePath+"/authProviders/" + i0+"/client/id",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(coerced5 !== undefined){
data7 = coerced5;
if(data6 !== undefined){
data6["id"] = coerced5;
}
}
}
}
if(data6.secret !== undefined){
let data8 = data6.secret;
if(typeof data8 !== "string"){
let dataType6 = typeof data8;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType6 = typeof data8;
if(typeof data8 === "string"){
coerced6 = data8;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "number" || dataType6 == "boolean"){
coerced6 = "" + data8;
}
else if(data8 === null){
coerced6 = "";
}
else {
const err18 = {instancePath:instancePath+"/authProviders/" + i0+"/client/secret",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced6 !== undefined){
data8 = coerced6;
if(data6 !== undefined){
data6["secret"] = coerced6;
}
}
}
}
}
else {
const err19 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid1 = _errs15 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
if(!valid4){
const err21 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.title === undefined){
const err22 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data3.type === undefined){
const err23 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data3.id !== undefined){
let data9 = data3.id;
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
const err24 = {instancePath:instancePath+"/authProviders/" + i0+"/id",schemaPath:"#/properties/authProviders/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(coerced7 !== undefined){
data9 = coerced7;
if(data3 !== undefined){
data3["id"] = coerced7;
}
}
}
}
if(data3.title !== undefined){
let data10 = data3.title;
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
const err25 = {instancePath:instancePath+"/authProviders/" + i0+"/title",schemaPath:"#/properties/authProviders/items/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data3 !== undefined){
data3["title"] = coerced8;
}
}
}
}
if(data3.color !== undefined){
let data11 = data3.color;
if(typeof data11 !== "string"){
let dataType9 = typeof data11;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data11) && data11.length == 1){
data11 = data11[0];
dataType9 = typeof data11;
if(typeof data11 === "string"){
coerced9 = data11;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 == "number" || dataType9 == "boolean"){
coerced9 = "" + data11;
}
else if(data11 === null){
coerced9 = "";
}
else {
const err26 = {instancePath:instancePath+"/authProviders/" + i0+"/color",schemaPath:"#/properties/authProviders/items/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced9 !== undefined){
data11 = coerced9;
if(data3 !== undefined){
data3["color"] = coerced9;
}
}
}
}
if(data3.img !== undefined){
let data12 = data3.img;
if(typeof data12 !== "string"){
let dataType10 = typeof data12;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType10 = typeof data12;
if(typeof data12 === "string"){
coerced10 = data12;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "number" || dataType10 == "boolean"){
coerced10 = "" + data12;
}
else if(data12 === null){
coerced10 = "";
}
else {
const err27 = {instancePath:instancePath+"/authProviders/" + i0+"/img",schemaPath:"#/properties/authProviders/items/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(coerced10 !== undefined){
data12 = coerced10;
if(data3 !== undefined){
data3["img"] = coerced10;
}
}
}
}
}
else {
const err28 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
}
}
else {
const err29 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
validate16.errors = vErrors;
return errors === 0;
}
