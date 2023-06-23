"use strict";
module.exports = validate16;
module.exports.default = validate16;
const schema18 = {"$id":"https://github.com/data-fair/simple-directory/site-patch","x-exports":["types","validate","stringify","resolvedSchema"],"title":"site-patch","type":"object","additionalProperties":false,"required":["_id","authMode"],"properties":{"_id":{"readOnly":true,"type":"string"},"authMode":{"default":"onlyBackOffice","title":"Mode d'authentification","type":"string","oneOf":[{"const":"onlyLocal","title":"uniquement sur le site lui même"},{"const":"onlyBackOffice","title":"uniquement sur le back-office"},{"const":"ssoBackOffice","title":"sur le site et sur le back-office par SSO"}]},"authProviders":{"type":"array","title":"Fournisseurs d'identité (SSO)","items":{"type":"object","required":["title","type"],"properties":{"id":{"type":"string","title":"Identifiant","readOnly":true},"title":{"type":"string","title":"Nom"}},"oneOf":[{"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"color":{"type":"string","title":"Couleur","x-display":"color-picker"},"img":{"type":"string","title":"URL du logo (petite taille)"},"type":{"type":"string","title":"Type de fournisseur","const":"oidc"},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client"},"secret":{"type":"string","title":"Secret","writeOnly":true}}},"createMember":{"type":"boolean","title":"Créer les utilisateurs en tant que membres","description":"si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site."},"ignoreEmailVerified":{"type":"boolean","title":"Accepter les utilisateurs aux emails non vérifiés","description":"Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."}}},{"type":"object","title":"Un autre de vos sites","required":["site"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSite"},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites"}}},{"type":"object","title":"Un fournisseur d'identité configuré sur autre de vos sites","required":["provider"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSiteProvider"},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites"},"provider":{"type":"string","title":"Fournisseur","x-if":"parent.value.site","x-fromData":"context.otherSitesProviders[parent.value.site]"}}}]}}}};

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
if(data3.color !== undefined){
let data4 = data3.color;
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
const err12 = {instancePath:instancePath+"/authProviders/" + i0+"/color",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data3["color"] = coerced3;
}
}
}
}
if(data3.img !== undefined){
let data5 = data3.img;
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
const err13 = {instancePath:instancePath+"/authProviders/" + i0+"/img",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(coerced4 !== undefined){
data5 = coerced4;
if(data3 !== undefined){
data3["img"] = coerced4;
}
}
}
}
if(data3.type !== undefined){
let data6 = data3.type;
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
const err14 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(coerced5 !== undefined){
data6 = coerced5;
if(data3 !== undefined){
data3["type"] = coerced5;
}
}
}
if("oidc" !== data6){
const err15 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.discovery !== undefined){
let data7 = data3.discovery;
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
const err16 = {instancePath:instancePath+"/authProviders/" + i0+"/discovery",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(coerced6 !== undefined){
data7 = coerced6;
if(data3 !== undefined){
data3["discovery"] = coerced6;
}
}
}
}
if(data3.client !== undefined){
let data8 = data3.client;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.id === undefined){
const err17 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data8.secret === undefined){
const err18 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data8.id !== undefined){
let data9 = data8.id;
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
const err19 = {instancePath:instancePath+"/authProviders/" + i0+"/client/id",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(coerced7 !== undefined){
data9 = coerced7;
if(data8 !== undefined){
data8["id"] = coerced7;
}
}
}
}
if(data8.secret !== undefined){
let data10 = data8.secret;
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
const err20 = {instancePath:instancePath+"/authProviders/" + i0+"/client/secret",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data8 !== undefined){
data8["secret"] = coerced8;
}
}
}
}
}
else {
const err21 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data3.createMember !== undefined){
let data11 = data3.createMember;
if(typeof data11 !== "boolean"){
let dataType9 = typeof data11;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data11) && data11.length == 1){
data11 = data11[0];
dataType9 = typeof data11;
if(typeof data11 === "boolean"){
coerced9 = data11;
}
}
if(!(coerced9 !== undefined)){
if(data11 === "false" || data11 === 0 || data11 === null){
coerced9 = false;
}
else if(data11 === "true" || data11 === 1){
coerced9 = true;
}
else {
const err22 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(coerced9 !== undefined){
data11 = coerced9;
if(data3 !== undefined){
data3["createMember"] = coerced9;
}
}
}
}
if(data3.ignoreEmailVerified !== undefined){
let data12 = data3.ignoreEmailVerified;
if(typeof data12 !== "boolean"){
let dataType10 = typeof data12;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType10 = typeof data12;
if(typeof data12 === "boolean"){
coerced10 = data12;
}
}
if(!(coerced10 !== undefined)){
if(data12 === "false" || data12 === 0 || data12 === null){
coerced10 = false;
}
else if(data12 === "true" || data12 === 1){
coerced10 = true;
}
else {
const err23 = {instancePath:instancePath+"/authProviders/" + i0+"/ignoreEmailVerified",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/ignoreEmailVerified/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(coerced10 !== undefined){
data12 = coerced10;
if(data3 !== undefined){
data3["ignoreEmailVerified"] = coerced10;
}
}
}
}
}
else {
const err24 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid1 = _errs15 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs35 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.site === undefined){
const err25 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/required",keyword:"required",params:{missingProperty: "site"},message:"must have required property '"+"site"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data3.type !== undefined){
let data13 = data3.type;
if(typeof data13 !== "string"){
let dataType11 = typeof data13;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType11 = typeof data13;
if(typeof data13 === "string"){
coerced11 = data13;
}
}
if(!(coerced11 !== undefined)){
if(dataType11 == "number" || dataType11 == "boolean"){
coerced11 = "" + data13;
}
else if(data13 === null){
coerced11 = "";
}
else {
const err26 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced11 !== undefined){
data13 = coerced11;
if(data3 !== undefined){
data3["type"] = coerced11;
}
}
}
if("otherSite" !== data13){
const err27 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "otherSite"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data3.site !== undefined){
let data14 = data3.site;
if(typeof data14 !== "string"){
let dataType12 = typeof data14;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data14) && data14.length == 1){
data14 = data14[0];
dataType12 = typeof data14;
if(typeof data14 === "string"){
coerced12 = data14;
}
}
if(!(coerced12 !== undefined)){
if(dataType12 == "number" || dataType12 == "boolean"){
coerced12 = "" + data14;
}
else if(data14 === null){
coerced12 = "";
}
else {
const err28 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(coerced12 !== undefined){
data14 = coerced12;
if(data3 !== undefined){
data3["site"] = coerced12;
}
}
}
}
}
else {
const err29 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
var _valid1 = _errs35 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid4 = true;
passing1 = 1;
}
const _errs41 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.provider === undefined){
const err30 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data3.type !== undefined){
let data15 = data3.type;
if(typeof data15 !== "string"){
let dataType13 = typeof data15;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType13 = typeof data15;
if(typeof data15 === "string"){
coerced13 = data15;
}
}
if(!(coerced13 !== undefined)){
if(dataType13 == "number" || dataType13 == "boolean"){
coerced13 = "" + data15;
}
else if(data15 === null){
coerced13 = "";
}
else {
const err31 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(coerced13 !== undefined){
data15 = coerced13;
if(data3 !== undefined){
data3["type"] = coerced13;
}
}
}
if("otherSiteProvider" !== data15){
const err32 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "otherSiteProvider"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data3.site !== undefined){
let data16 = data3.site;
if(typeof data16 !== "string"){
let dataType14 = typeof data16;
let coerced14 = undefined;
if(dataType14 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType14 = typeof data16;
if(typeof data16 === "string"){
coerced14 = data16;
}
}
if(!(coerced14 !== undefined)){
if(dataType14 == "number" || dataType14 == "boolean"){
coerced14 = "" + data16;
}
else if(data16 === null){
coerced14 = "";
}
else {
const err33 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(coerced14 !== undefined){
data16 = coerced14;
if(data3 !== undefined){
data3["site"] = coerced14;
}
}
}
}
if(data3.provider !== undefined){
let data17 = data3.provider;
if(typeof data17 !== "string"){
let dataType15 = typeof data17;
let coerced15 = undefined;
if(dataType15 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType15 = typeof data17;
if(typeof data17 === "string"){
coerced15 = data17;
}
}
if(!(coerced15 !== undefined)){
if(dataType15 == "number" || dataType15 == "boolean"){
coerced15 = "" + data17;
}
else if(data17 === null){
coerced15 = "";
}
else {
const err34 = {instancePath:instancePath+"/authProviders/" + i0+"/provider",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(coerced15 !== undefined){
data17 = coerced15;
if(data3 !== undefined){
data3["provider"] = coerced15;
}
}
}
}
}
else {
const err35 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
var _valid1 = _errs41 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid4 = true;
passing1 = 2;
}
}
}
if(!valid4){
const err36 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
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
const err37 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data3.type === undefined){
const err38 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data3.id !== undefined){
let data18 = data3.id;
if(typeof data18 !== "string"){
let dataType16 = typeof data18;
let coerced16 = undefined;
if(dataType16 == 'object' && Array.isArray(data18) && data18.length == 1){
data18 = data18[0];
dataType16 = typeof data18;
if(typeof data18 === "string"){
coerced16 = data18;
}
}
if(!(coerced16 !== undefined)){
if(dataType16 == "number" || dataType16 == "boolean"){
coerced16 = "" + data18;
}
else if(data18 === null){
coerced16 = "";
}
else {
const err39 = {instancePath:instancePath+"/authProviders/" + i0+"/id",schemaPath:"#/properties/authProviders/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(coerced16 !== undefined){
data18 = coerced16;
if(data3 !== undefined){
data3["id"] = coerced16;
}
}
}
}
if(data3.title !== undefined){
let data19 = data3.title;
if(typeof data19 !== "string"){
let dataType17 = typeof data19;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data19) && data19.length == 1){
data19 = data19[0];
dataType17 = typeof data19;
if(typeof data19 === "string"){
coerced17 = data19;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "number" || dataType17 == "boolean"){
coerced17 = "" + data19;
}
else if(data19 === null){
coerced17 = "";
}
else {
const err40 = {instancePath:instancePath+"/authProviders/" + i0+"/title",schemaPath:"#/properties/authProviders/items/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(coerced17 !== undefined){
data19 = coerced17;
if(data3 !== undefined){
data3["title"] = coerced17;
}
}
}
}
}
else {
const err41 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
}
}
else {
const err42 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
validate16.errors = vErrors;
return errors === 0;
}
