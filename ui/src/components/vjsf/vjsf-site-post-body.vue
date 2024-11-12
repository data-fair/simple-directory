<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
const schema35 = {"$id":"export0","$ref":"https://github.com/data-fair/simple-directory/sites/post-req-body#"};
const schema33 = {"type":"object","title":"Site post","x-exports":["validate","types","vjsf"],"required":["_id","owner","host","theme"],"additionalProperties":false,"properties":{"_id":{"type":"string","__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id","errorMessage":{}},"owner":{"$ref":"https://github.com/data-fair/lib/session-state#/$defs/account","__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/owner","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information"}}},"host":{"type":"string","title":"Nom de domaine","__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host","errorMessage":{}},"theme":{"type":"object","additionalProperties":false,"required":["primaryColor"],"properties":{"primaryColor":{"type":"string","x-display":"color-picker","__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme","errorMessage":{"required":{"primaryColor":"required information"}}},"logo":{"type":"string","title":"URL d'un logo","__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo","errorMessage":{}}},"$defs":{"oidcProvider":{"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"color":{"type":"string","title":"Couleur","x-display":"color-picker"},"img":{"type":"string","title":"URL du logo (petite taille)"},"type":{"type":"string","title":"Type de fournisseur","const":"oidc"},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration"},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client"},"secret":{"type":"string","title":"Secret","writeOnly":true}}},"createMember":{"type":"object","description":"si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.","default":{"type":"never"},"oneOf":[{"title":"jamais","properties":{"type":{"const":"never","title":"Créer les utilisateurs en tant que membres"}}},{"title":"toujours","properties":{"type":{"const":"always"}}},{"title":"quand l'email appartient à un nom de domaine","properties":{"type":{"const":"emailDomain"},"emailDomain":{"type":"string","title":"nom de domaine de l'email"}}}]},"memberRole":{"type":"object","description":"Le rôle des membres créés automatiquement par ce fournisseur d'identité.","default":{"type":"none"},"oneOf":[{"title":"Aucun rôle par défaut (simple utilisateur)","properties":{"type":{"const":"none","title":"Attribution du rôle des membres"}}},{"title":"Tout le temps ce rôle : ","required":["role"],"properties":{"type":{"const":"static"},"role":{"type":"string","title":"Rôle des membres"}}},{"title":"Rôle lu dans un attribut de l'identité","required":["attribute"],"properties":{"type":{"const":"attribute"},"attribute":{"type":"string","title":"Nom de l'attribut"}}}]},"ignoreEmailVerified":{"type":"boolean","title":"Accepter les utilisateurs aux emails non vérifiés","description":"Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement."},"coreIdProvider":{"type":"boolean","title":"Traiter ce fournisseur comme une source principale d'identité","description":"Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office"},"redirectMode":{"type":"object","description":"Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.","default":{"type":"button"},"oneOf":[{"title":"bouton","properties":{"type":{"const":"button","title":"Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur"}}},{"title":"redirection auto quand l'email appartient à un nom de domaine","properties":{"type":{"const":"emailDomain"},"emailDomain":{"type":"string","title":"nom de domaine de l'email"}}},{"title":"toujours rediriger implicitement","properties":{"type":{"const":"always"}}}]}}}},"$id":"https://github.com/data-fair/simple-directory/sites/post-req-body","x-vjsf":{},"__pointer":"https://github.com/data-fair/simple-directory/sites/post-req-body#","errorMessage":{"required":{"_id":"required information","owner":"required information","host":"required information","theme":"required information"}}};
const schema31 = {"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"},"departmentName":{"type":"string"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/simple-directory/sites/post-req-body" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data._id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "_id"},message:"must have required property '"+"_id"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.owner === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "owner"},message:"must have required property '"+"owner"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.host === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "host"},message:"must have required property '"+"host"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.theme === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "theme"},message:"must have required property '"+"theme"+"'",schema:schema33.required,parentSchema:schema33,data};
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
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema33,data};
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
const err5 = {instancePath:instancePath+"/_id",schemaPath:"#/properties/_id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties._id.type,parentSchema:schema33.properties._id,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs0.push(err6);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.owner !== undefined){
let data1 = data.owner;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err7 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema31.required,parentSchema:schema31,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data1.id === undefined){
const err8 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema31.required,parentSchema:schema31,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1.name === undefined){
const err9 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema31.required,parentSchema:schema31,data:data1};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data1){
if(!(((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department")) || (key1 === "departmentName"))){
const err10 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema31,data:data1};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.type !== undefined){
let data2 = data1.type;
if(typeof data2 !== "string"){
const err11 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.type.type,parentSchema:schema31.properties.type,data:data2};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!((data2 === "user") || (data2 === "organization"))){
const err12 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/type/enum",keyword:"enum",params:{allowedValues: schema31.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema31.properties.type.enum,parentSchema:schema31.properties.type,data:data2};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err13 of vErrors){
if(!err13.emUsed){
emErrs1.push(err13);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data1.id !== undefined){
let data3 = data1.id;
if(typeof data3 !== "string"){
const err14 = {instancePath:instancePath+"/owner/id",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.id.type,parentSchema:schema31.properties.id,data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs2.push(err15);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data1.name !== undefined){
let data4 = data1.name;
if(typeof data4 !== "string"){
const err16 = {instancePath:instancePath+"/owner/name",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.name.type,parentSchema:schema31.properties.name,data:data4};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs3.push(err17);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data1.department !== undefined){
let data5 = data1.department;
if(typeof data5 !== "string"){
const err18 = {instancePath:instancePath+"/owner/department",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.department.type,parentSchema:schema31.properties.department,data:data5};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs4.push(err19);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data1.departmentName !== undefined){
let data6 = data1.departmentName;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/owner/departmentName",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.departmentName.type,parentSchema:schema31.properties.departmentName,data:data6};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs5.push(err21);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err22 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/lib/session-state#/$defs/account/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema31.type,parentSchema:schema31,data:data1};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err23 of vErrors){
if((((((err23.keyword !== "errorMessage") && (!err23.emUsed)) && (err23.instancePath === instancePath+"/owner")) && (err23.keyword in emErrors0)) && (err23.schemaPath.indexOf("#/properties/owner") === 0)) && (/^\/[^\/]*$/.test(err23.schemaPath.slice(18)))){
emPropParams0 = obj0[err23.keyword];
emParamsErrors0 = emErrors0[err23.keyword][err23.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err23);
err23.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err24 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema33.properties.owner.errorMessage[key2][keyProp0],schema:schema33.properties.owner.errorMessage,parentSchema:schema33.properties.owner,data:data1};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs6.push(err25);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.host !== undefined){
let data7 = data.host;
if(typeof data7 !== "string"){
const err26 = {instancePath:instancePath+"/host",schemaPath:"#/properties/host/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.host.type,parentSchema:schema33.properties.host,data:data7};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs7.push(err27);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.theme !== undefined){
let data8 = data.theme;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.primaryColor === undefined){
const err28 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/required",keyword:"required",params:{missingProperty: "primaryColor"},message:"must have required property '"+"primaryColor"+"'",schema:schema33.properties.theme.required,parentSchema:schema33.properties.theme,data:data8};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key3 in data8){
if(!(key3 === "primaryColor")){
const err29 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema33.properties.theme,data:data8};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data8.primaryColor !== undefined){
let data9 = data8.primaryColor;
if(typeof data9 !== "string"){
const err30 = {instancePath:instancePath+"/theme/primaryColor",schemaPath:"#/properties/theme/properties/primaryColor/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.theme.properties.primaryColor.type,parentSchema:schema33.properties.theme.properties.primaryColor,data:data9};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err31 of vErrors){
if(!err31.emUsed){
emErrs8.push(err31);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
}
else {
const err32 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.properties.theme.type,parentSchema:schema33.properties.theme,data:data8};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"primaryColor":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err33 of vErrors){
if((((((err33.keyword !== "errorMessage") && (!err33.emUsed)) && (err33.instancePath === instancePath+"/theme")) && (err33.keyword in emErrors1)) && (err33.schemaPath.indexOf("#/properties/theme") === 0)) && (/^\/[^\/]*$/.test(err33.schemaPath.slice(18)))){
emPropParams1 = obj0[err33.keyword];
emParamsErrors1 = emErrors1[err33.keyword][err33.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err33);
err33.emUsed = true;
}
}
}
for(const key4 in emErrors1){
for(const keyProp1 in emErrors1[key4]){
emParamsErrors1 = emErrors1[key4][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key4] && templates1[key4][keyProp1];
const err34 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema33.properties.theme.errorMessage[key4][keyProp1],schema:schema33.properties.theme.errorMessage,parentSchema:schema33.properties.theme,data:data8};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
const emErrs9 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs9.push(err35);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data.logo !== undefined){
let data10 = data.logo;
if(typeof data10 !== "string"){
const err36 = {instancePath:instancePath+"/logo",schemaPath:"#/properties/logo/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.logo.type,parentSchema:schema33.properties.logo,data:data10};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs10.push(err37);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err38 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"_id":[],"owner":[],"host":[],"theme":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err39 of vErrors){
if((((((err39.keyword !== "errorMessage") && (!err39.emUsed)) && (err39.instancePath === instancePath)) && (err39.keyword in emErrors2)) && (err39.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err39.schemaPath.slice(1)))){
emPropParams2 = obj0[err39.keyword];
emParamsErrors2 = emErrors2[err39.keyword][err39.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err39);
err39.emUsed = true;
}
}
}
for(const key5 in emErrors2){
for(const keyProp2 in emErrors2[key5]){
emParamsErrors2 = emErrors2[key5][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key5] && templates2[key5][keyProp2];
const err40 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema33.errorMessage[key5][keyProp2],schema:schema33.errorMessage,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
const emErrs11 = [];
for(const err41 of vErrors){
if(!err41.emUsed){
emErrs11.push(err41);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export0" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate26(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,validates
) {
return ([{"key":"user","title":"user","value":"user"},{"key":"organization","title":"organization","value":"organization"}])
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/simple-directory/sites/post-req-body#",

  skeletonTrees: {
    "https://github.com/data-fair/simple-directory/sites/post-req-body#": {
      title: "main",
      root: "https://github.com/data-fair/simple-directory/sites/post-req-body#",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#"
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/simple-directory/sites/post-req-body#": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#",
      pure: true,
      propertyKeys: ["_id", "owner", "host", "theme", "logo"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id", "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/owner", "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host", "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme", "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo"]
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id": {
      key: "_id",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/owner": {
      key: "owner",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/owner",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account",
      pure: true,
      propertyKeys: ["type", "id", "name", "department", "departmentName"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/lib/session-state#/$defs/account/properties/type", "https://github.com/data-fair/lib/session-state#/$defs/account/properties/id", "https://github.com/data-fair/lib/session-state#/$defs/account/properties/name", "https://github.com/data-fair/lib/session-state#/$defs/account/properties/department", "https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName"]
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/type",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/id": {
      key: "id",
      pointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/id",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/name": {
      key: "name",
      pointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/name",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/department": {
      key: "department",
      pointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/department",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/department",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName": {
      key: "departmentName",
      pointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName",
      refPointer: "https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host": {
      key: "host",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme": {
      key: "theme",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme",
      pure: true,
      propertyKeys: ["primaryColor"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor"]
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor": {
      key: "primaryColor",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo": {
      key: "logo",
      pointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo",
      refPointer: "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/simple-directory/sites/post-req-body#": {
      comp: "section",

      children: [{
        key: "_id"
      }, {
        key: "owner"
      }, {
        key: "host"
      }, {
        key: "theme"
      }, {
        key: "logo"
      }],

      title: "Site post",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/_id": {
      comp: "text-field",
      label: "_id"
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/owner": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "id"
      }, {
        key: "name"
      }, {
        key: "department"
      }, {
        key: "departmentName"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/type": {
      comp: "select",
      label: "type",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"key\":\"user\",\"title\":\"user\",\"value\":\"user\"},{\"key\":\"organization\",\"title\":\"organization\",\"value\":\"organization\"}]",
        immutable: true,
        ref: 1
      }
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/department": {
      comp: "text-field",
      label: "department"
    },

    "https://github.com/data-fair/lib/session-state#/$defs/account/properties/departmentName": {
      comp: "text-field",
      label: "departmentName"
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/host": {
      comp: "text-field",
      label: "Nom de domaine"
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme": {
      comp: "section",

      children: [{
        key: "primaryColor"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/theme/properties/primaryColor": {
      comp: "text-field",
      label: "primaryColor"
    },

    "https://github.com/data-fair/simple-directory/sites/post-req-body#/properties/logo": {
      comp: "text-field",
      label: "URL d'un logo"
    }
  },

  validates: {
    "https://github.com/data-fair/simple-directory/sites/post-req-body#": validate28
  },

  validationErrors: {},
  expressions: [expression0, expression1],
  locale: "en",

  messages: {
    errorOneOf: "chose one",
    errorRequired: "required information",
    addItem: "Add item",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    duplicate: "Duplicate",
    sort: "Sort",
    up: "Move up",
    down: "Move down",
    showHelp: "Show a help message",
    mdeLink1: "[Link title",
    mdeLink2: "](link url)",
    mdeImg1: "![](",
    mdeImg2: "image url)",
    mdeTable1: "",
    mdeTable2: "\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n",
    bold: "Bold",
    italic: "Italic",
    heading: "Title",
    quote: "Quote",
    unorderedList: "Unordered list",
    orderedList: "Ordered list",
    createLink: "Create a link",
    insertImage: "Insert an image",
    createTable: "Create a table",
    preview: "Aperçu du rendu",
    mdeGuide: "Documentation de la syntaxe",
    undo: "Undo",
    redo: "Redo"
  },

  components: {
    section: {
      name: "section",
      composite: true
    },

    "text-field": {
      name: "text-field",
      shouldDebounce: true,
      focusable: true,
      emitsBlur: true
    },

    select: {
      name: "select",
      focusable: true,
      itemsBased: true,
      multipleCompat: true
    }
  },

  localizeErrors: localizeErrors
};

const nodeComponents = {
  
  "section": sectionNode,
  
  "text-field": textfieldNode,
  
  "select": selectNode,
    
}

const props = defineProps({
  modelValue: {
    type: null,
    default: null
  },
  options: {
    /** @type import('vue').PropType<import('@koumoul/vjsf/types.js').PartialVjsfOptions | null> */
    type: Object,
    default: null
  }
})

const emit = defineEmits(emits)

const { el, statefulLayout, stateTree } = useVjsf(
  null,
  computed(() => props.modelValue),
  computed(() => ({...props.options, components: {}})),
  nodeComponents,
  emit,
  null,
  computed(() => compiledLayout)
)
</script>

<template>
  <div
    ref="el"
    class="vjsf"
  >
    <tree
      v-if="statefulLayout && stateTree"
      :model-value="stateTree"
      :stateful-layout="statefulLayout"
    />
  </div>
</template>