"use strict";
module.exports = validate16;
module.exports.default = validate16;
const schema18 = {"$id":"https://github.com/data-fair/simple-directory/site-patch","x-exports":["types","validate","stringify","resolvedSchema"],"title":"site-patch","type":"object","additionalProperties":false,"required":["_id","authMode"],"properties":{"_id":{"readOnly":true,"type":"string"},"authMode":{"default":"onlyBackOffice","title":"Mode d'authentification","type":"string","oneOf":[{"const":"onlyLocal","title":"uniquement sur le site lui même"},{"const":"onlyBackOffice","title":"uniquement sur le back-office"},{"const":"ssoBackOffice","title":"sur le site et sur le back-office par SSO"},{"const":"onlyOtherSite","title":"uniquement sur un autre de vos sites"}]},"authOnlyOtherSite":{"x-if":"parent.value.authMode === 'onlyOtherSite'","type":"string","title":"Autre site pour l'authentification","x-fromData":"context.otherSites"},"authProviders":{"x-if":"parent.value.authMode !== 'onlyOtherSite' && parent.value.authMode !== 'onlyBackOffice'","type":"array","title":"Fournisseurs d'identité (SSO)","items":{"type":"object","required":["title","type"],"properties":{"id":{"type":"string","title":"Identifiant","readOnly":true},"title":{"type":"string","title":"Nom"}},"oneOf":[{"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"color":{"type":"string","title":"Couleur","x-display":"color-picker"},"img":{"type":"string","title":"URL du logo (petite taille)"},"type":{"type":"string","title":"Type de fournisseur","const":"oidc"},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client"},"secret":{"type":"string","title":"Secret","writeOnly":true}}},"createMember":{"type":"object","description":"si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.","oneOf":[{"title":"jamais","properties":{"type":{"const":"never","title":"Créer les utilisateurs en tant que membres"}}},{"title":"toujours","properties":{"type":{"const":"always"}}},{"title":"quand l'email appartient à un nom de domaine","properties":{"type":{"const":"emailDomain"},"emailDomain":{"type":"string","title":"nom de domaine de l'email"}}}]},"ignoreEmailVerified":{"type":"boolean","title":"Accepter les utilisateurs aux emails non vérifiés","description":"Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."},"redirectMode":{"type":"object","description":"Si vous utilisez un autre mode que 'bouton' alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.","oneOf":[{"title":"bouton","properties":{"type":{"const":"button","title":"Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur"}}},{"title":"redirection auto quand l'email appartient à un nom de domaine","properties":{"type":{"const":"emailDomain"},"emailDomain":{"type":"string","title":"nom de domaine de l'email"}}}]}}},{"type":"object","title":"Un autre de vos sites","required":["site"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSite"},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites"}}},{"type":"object","title":"Un fournisseur d'identité configuré sur autre de vos sites","required":["provider"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSiteProvider"},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites"},"provider":{"type":"string","title":"Fournisseur","x-if":"parent.value.site","x-fromData":"context.otherSitesProviders[parent.value.site]"}}}]}}}};

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
if(!((((key0 === "_id") || (key0 === "authMode")) || (key0 === "authOnlyOtherSite")) || (key0 === "authProviders"))){
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
const _errs10 = errors;
if("onlyOtherSite" !== data1){
const err8 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/3/const",keyword:"const",params:{allowedValue: "onlyOtherSite"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
}
}
}
}
if(!valid1){
const err9 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
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
if(data.authOnlyOtherSite !== undefined){
let data2 = data.authOnlyOtherSite;
if(typeof data2 !== "string"){
let dataType2 = typeof data2;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data2) && data2.length == 1){
data2 = data2[0];
dataType2 = typeof data2;
if(typeof data2 === "string"){
coerced2 = data2;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 == "number" || dataType2 == "boolean"){
coerced2 = "" + data2;
}
else if(data2 === null){
coerced2 = "";
}
else {
const err10 = {instancePath:instancePath+"/authOnlyOtherSite",schemaPath:"#/properties/authOnlyOtherSite/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(coerced2 !== undefined){
data2 = coerced2;
if(data !== undefined){
data["authOnlyOtherSite"] = coerced2;
}
}
}
}
if(data.authProviders !== undefined){
let data3 = data.authProviders;
if(!(Array.isArray(data3))){
let dataType3 = typeof data3;
let coerced3 = undefined;
if(dataType3 == 'object' && Array.isArray(data3) && data3.length == 1){
data3 = data3[0];
dataType3 = typeof data3;
if(Array.isArray(data3)){
coerced3 = data3;
}
}
if(!(coerced3 !== undefined)){
if(dataType3 === "string" || dataType3 === "number"
              || dataType3 === "boolean" || data3 === null){
coerced3 = [data3];
}
else {
const err11 = {instancePath:instancePath+"/authProviders",schemaPath:"#/properties/authProviders/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(coerced3 !== undefined){
data3 = coerced3;
if(data !== undefined){
data["authProviders"] = coerced3;
}
}
}
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
const _errs17 = errors;
let valid4 = false;
let passing1 = null;
const _errs18 = errors;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.discovery === undefined){
const err12 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/required",keyword:"required",params:{missingProperty: "discovery"},message:"must have required property '"+"discovery"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data4.client === undefined){
const err13 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/required",keyword:"required",params:{missingProperty: "client"},message:"must have required property '"+"client"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4.color !== undefined){
let data5 = data4.color;
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
const err14 = {instancePath:instancePath+"/authProviders/" + i0+"/color",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(data4 !== undefined){
data4["color"] = coerced4;
}
}
}
}
if(data4.img !== undefined){
let data6 = data4.img;
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
const err15 = {instancePath:instancePath+"/authProviders/" + i0+"/img",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(data4 !== undefined){
data4["img"] = coerced5;
}
}
}
}
if(data4.type !== undefined){
let data7 = data4.type;
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
const err16 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(data4 !== undefined){
data4["type"] = coerced6;
}
}
}
if("oidc" !== data7){
const err17 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data4.discovery !== undefined){
let data8 = data4.discovery;
if(typeof data8 !== "string"){
let dataType7 = typeof data8;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType7 = typeof data8;
if(typeof data8 === "string"){
coerced7 = data8;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 == "number" || dataType7 == "boolean"){
coerced7 = "" + data8;
}
else if(data8 === null){
coerced7 = "";
}
else {
const err18 = {instancePath:instancePath+"/authProviders/" + i0+"/discovery",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced7 !== undefined){
data8 = coerced7;
if(data4 !== undefined){
data4["discovery"] = coerced7;
}
}
}
}
if(data4.client !== undefined){
let data9 = data4.client;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.id === undefined){
const err19 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data9.secret === undefined){
const err20 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data9.id !== undefined){
let data10 = data9.id;
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
const err21 = {instancePath:instancePath+"/authProviders/" + i0+"/client/id",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data9 !== undefined){
data9["id"] = coerced8;
}
}
}
}
if(data9.secret !== undefined){
let data11 = data9.secret;
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
const err22 = {instancePath:instancePath+"/authProviders/" + i0+"/client/secret",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(data9 !== undefined){
data9["secret"] = coerced9;
}
}
}
}
}
else {
const err23 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data4.createMember !== undefined){
let data12 = data4.createMember;
if(!(data12 && typeof data12 == "object" && !Array.isArray(data12))){
const err24 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
const _errs36 = errors;
let valid7 = false;
let passing2 = null;
const _errs37 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.type !== undefined){
if("never" !== data12.type){
const err25 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "never"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
var _valid2 = _errs37 === errors;
if(_valid2){
valid7 = true;
passing2 = 0;
}
const _errs39 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.type !== undefined){
if("always" !== data12.type){
const err26 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
var _valid2 = _errs39 === errors;
if(_valid2 && valid7){
valid7 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid7 = true;
passing2 = 1;
}
const _errs41 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.type !== undefined){
if("emailDomain" !== data12.type){
const err27 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data12.emailDomain !== undefined){
let data16 = data12.emailDomain;
if(typeof data16 !== "string"){
let dataType10 = typeof data16;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType10 = typeof data16;
if(typeof data16 === "string"){
coerced10 = data16;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "number" || dataType10 == "boolean"){
coerced10 = "" + data16;
}
else if(data16 === null){
coerced10 = "";
}
else {
const err28 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/emailDomain",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/oneOf/2/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(coerced10 !== undefined){
data16 = coerced10;
if(data12 !== undefined){
data12["emailDomain"] = coerced10;
}
}
}
}
}
var _valid2 = _errs41 === errors;
if(_valid2 && valid7){
valid7 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid7 = true;
passing2 = 2;
}
}
}
if(!valid7){
const err29 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/createMember/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
else {
errors = _errs36;
if(vErrors !== null){
if(_errs36){
vErrors.length = _errs36;
}
else {
vErrors = null;
}
}
}
}
if(data4.ignoreEmailVerified !== undefined){
let data17 = data4.ignoreEmailVerified;
if(typeof data17 !== "boolean"){
let dataType11 = typeof data17;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType11 = typeof data17;
if(typeof data17 === "boolean"){
coerced11 = data17;
}
}
if(!(coerced11 !== undefined)){
if(data17 === "false" || data17 === 0 || data17 === null){
coerced11 = false;
}
else if(data17 === "true" || data17 === 1){
coerced11 = true;
}
else {
const err30 = {instancePath:instancePath+"/authProviders/" + i0+"/ignoreEmailVerified",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/ignoreEmailVerified/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(coerced11 !== undefined){
data17 = coerced11;
if(data4 !== undefined){
data4["ignoreEmailVerified"] = coerced11;
}
}
}
}
if(data4.redirectMode !== undefined){
let data18 = data4.redirectMode;
if(!(data18 && typeof data18 == "object" && !Array.isArray(data18))){
const err31 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/redirectMode/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
const _errs49 = errors;
let valid11 = false;
let passing3 = null;
const _errs50 = errors;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.type !== undefined){
if("button" !== data18.type){
const err32 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/redirectMode/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "button"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
var _valid3 = _errs50 === errors;
if(_valid3){
valid11 = true;
passing3 = 0;
}
const _errs52 = errors;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.type !== undefined){
if("emailDomain" !== data18.type){
const err33 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/type",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/redirectMode/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data18.emailDomain !== undefined){
let data21 = data18.emailDomain;
if(typeof data21 !== "string"){
let dataType12 = typeof data21;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data21) && data21.length == 1){
data21 = data21[0];
dataType12 = typeof data21;
if(typeof data21 === "string"){
coerced12 = data21;
}
}
if(!(coerced12 !== undefined)){
if(dataType12 == "number" || dataType12 == "boolean"){
coerced12 = "" + data21;
}
else if(data21 === null){
coerced12 = "";
}
else {
const err34 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/emailDomain",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/redirectMode/oneOf/1/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(coerced12 !== undefined){
data21 = coerced12;
if(data18 !== undefined){
data18["emailDomain"] = coerced12;
}
}
}
}
}
var _valid3 = _errs52 === errors;
if(_valid3 && valid11){
valid11 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid11 = true;
passing3 = 1;
}
}
if(!valid11){
const err35 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/properties/authProviders/items/oneOf/0/properties/redirectMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
else {
errors = _errs49;
if(vErrors !== null){
if(_errs49){
vErrors.length = _errs49;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err36 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
var _valid1 = _errs18 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs56 = errors;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.site === undefined){
const err37 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/required",keyword:"required",params:{missingProperty: "site"},message:"must have required property '"+"site"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data4.type !== undefined){
let data22 = data4.type;
if(typeof data22 !== "string"){
let dataType13 = typeof data22;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data22) && data22.length == 1){
data22 = data22[0];
dataType13 = typeof data22;
if(typeof data22 === "string"){
coerced13 = data22;
}
}
if(!(coerced13 !== undefined)){
if(dataType13 == "number" || dataType13 == "boolean"){
coerced13 = "" + data22;
}
else if(data22 === null){
coerced13 = "";
}
else {
const err38 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(coerced13 !== undefined){
data22 = coerced13;
if(data4 !== undefined){
data4["type"] = coerced13;
}
}
}
if("otherSite" !== data22){
const err39 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "otherSite"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data4.site !== undefined){
let data23 = data4.site;
if(typeof data23 !== "string"){
let dataType14 = typeof data23;
let coerced14 = undefined;
if(dataType14 == 'object' && Array.isArray(data23) && data23.length == 1){
data23 = data23[0];
dataType14 = typeof data23;
if(typeof data23 === "string"){
coerced14 = data23;
}
}
if(!(coerced14 !== undefined)){
if(dataType14 == "number" || dataType14 == "boolean"){
coerced14 = "" + data23;
}
else if(data23 === null){
coerced14 = "";
}
else {
const err40 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(coerced14 !== undefined){
data23 = coerced14;
if(data4 !== undefined){
data4["site"] = coerced14;
}
}
}
}
}
else {
const err41 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
var _valid1 = _errs56 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid4 = true;
passing1 = 1;
}
const _errs62 = errors;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.provider === undefined){
const err42 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data4.type !== undefined){
let data24 = data4.type;
if(typeof data24 !== "string"){
let dataType15 = typeof data24;
let coerced15 = undefined;
if(dataType15 == 'object' && Array.isArray(data24) && data24.length == 1){
data24 = data24[0];
dataType15 = typeof data24;
if(typeof data24 === "string"){
coerced15 = data24;
}
}
if(!(coerced15 !== undefined)){
if(dataType15 == "number" || dataType15 == "boolean"){
coerced15 = "" + data24;
}
else if(data24 === null){
coerced15 = "";
}
else {
const err43 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(coerced15 !== undefined){
data24 = coerced15;
if(data4 !== undefined){
data4["type"] = coerced15;
}
}
}
if("otherSiteProvider" !== data24){
const err44 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "otherSiteProvider"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data4.site !== undefined){
let data25 = data4.site;
if(typeof data25 !== "string"){
let dataType16 = typeof data25;
let coerced16 = undefined;
if(dataType16 == 'object' && Array.isArray(data25) && data25.length == 1){
data25 = data25[0];
dataType16 = typeof data25;
if(typeof data25 === "string"){
coerced16 = data25;
}
}
if(!(coerced16 !== undefined)){
if(dataType16 == "number" || dataType16 == "boolean"){
coerced16 = "" + data25;
}
else if(data25 === null){
coerced16 = "";
}
else {
const err45 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(coerced16 !== undefined){
data25 = coerced16;
if(data4 !== undefined){
data4["site"] = coerced16;
}
}
}
}
if(data4.provider !== undefined){
let data26 = data4.provider;
if(typeof data26 !== "string"){
let dataType17 = typeof data26;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data26) && data26.length == 1){
data26 = data26[0];
dataType17 = typeof data26;
if(typeof data26 === "string"){
coerced17 = data26;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "number" || dataType17 == "boolean"){
coerced17 = "" + data26;
}
else if(data26 === null){
coerced17 = "";
}
else {
const err46 = {instancePath:instancePath+"/authProviders/" + i0+"/provider",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(coerced17 !== undefined){
data26 = coerced17;
if(data4 !== undefined){
data4["provider"] = coerced17;
}
}
}
}
}
else {
const err47 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
var _valid1 = _errs62 === errors;
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
const err48 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.title === undefined){
const err49 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data4.type === undefined){
const err50 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data4.id !== undefined){
let data27 = data4.id;
if(typeof data27 !== "string"){
let dataType18 = typeof data27;
let coerced18 = undefined;
if(dataType18 == 'object' && Array.isArray(data27) && data27.length == 1){
data27 = data27[0];
dataType18 = typeof data27;
if(typeof data27 === "string"){
coerced18 = data27;
}
}
if(!(coerced18 !== undefined)){
if(dataType18 == "number" || dataType18 == "boolean"){
coerced18 = "" + data27;
}
else if(data27 === null){
coerced18 = "";
}
else {
const err51 = {instancePath:instancePath+"/authProviders/" + i0+"/id",schemaPath:"#/properties/authProviders/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(coerced18 !== undefined){
data27 = coerced18;
if(data4 !== undefined){
data4["id"] = coerced18;
}
}
}
}
if(data4.title !== undefined){
let data28 = data4.title;
if(typeof data28 !== "string"){
let dataType19 = typeof data28;
let coerced19 = undefined;
if(dataType19 == 'object' && Array.isArray(data28) && data28.length == 1){
data28 = data28[0];
dataType19 = typeof data28;
if(typeof data28 === "string"){
coerced19 = data28;
}
}
if(!(coerced19 !== undefined)){
if(dataType19 == "number" || dataType19 == "boolean"){
coerced19 = "" + data28;
}
else if(data28 === null){
coerced19 = "";
}
else {
const err52 = {instancePath:instancePath+"/authProviders/" + i0+"/title",schemaPath:"#/properties/authProviders/items/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(coerced19 !== undefined){
data28 = coerced19;
if(data4 !== undefined){
data4["title"] = coerced19;
}
}
}
}
}
else {
const err53 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
}
}
else {
const err54 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
validate16.errors = vErrors;
return errors === 0;
}
