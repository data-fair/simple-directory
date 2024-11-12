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

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
const schema56 = {"$id":"export0","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0"};
const schema29 = {"properties":{"type":{"const":"never","title":"Créer les utilisateurs en tant que membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0","errorMessage":{}};

function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export0" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("never" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "never"},message:"must be equal to constant",schema:"never",parentSchema:schema29.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema29.type,parentSchema:schema29,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":{"type":true},"dynamicProps":false,"dynamicItems":false};

const schema58 = {"$id":"export1","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1"};
const schema31 = {"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1","errorMessage":{}};

function validate41(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate41.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("always" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema31.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema31.type,parentSchema:schema31,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate41.errors = vErrors;
return errors === 0;
}
validate41.evaluated = {"props":{"type":true},"dynamicProps":false,"dynamicItems":false};

const schema60 = {"$id":"export2","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2"};
const schema33 = {"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2","errorMessage":{}};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export2" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("emailDomain" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema33.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.emailDomain !== undefined){
let data1 = data.emailDomain;
if(typeof data1 !== "string"){
const err2 = {instancePath:instancePath+"/emailDomain",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.emailDomain.type,parentSchema:schema33.properties.emailDomain,data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs2.push(err5);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":{"type":true,"emailDomain":true},"dynamicProps":false,"dynamicItems":false};

const schema62 = {"$id":"export3","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0"};
const schema35 = {"properties":{"type":{"const":"none","title":"Attribution du rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0","errorMessage":{}};

function validate43(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export3" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate43.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("none" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant",schema:"none",parentSchema:schema35.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema35.type,parentSchema:schema35,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate43.errors = vErrors;
return errors === 0;
}
validate43.evaluated = {"props":{"type":true},"dynamicProps":false,"dynamicItems":false};

const schema64 = {"$id":"export4","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1"};
const schema37 = {"required":["role"],"properties":{"type":{"const":"static","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type","errorMessage":{}},"role":{"type":"string","title":"Rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1","errorMessage":{"required":{"role":"required information"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate44(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export4" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate44.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.role === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'",schema:schema37.required,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if("static" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "static"},message:"must be equal to constant",schema:"static",parentSchema:schema37.properties.type,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err2 of vErrors){
if(!err2.emUsed){
emErrs0.push(err2);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.role !== undefined){
let data1 = data.role;
if(typeof data1 !== "string"){
const err3 = {instancePath:instancePath+"/role",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema37.properties.role.type,parentSchema:schema37.properties.role,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema37.type,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"role":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath)) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(116)))){
emPropParams0 = obj0[err6.keyword];
emParamsErrors0 = emErrors0[err6.keyword][err6.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err6);
err6.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err7 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema37.errorMessage[key0][keyProp0],schema:schema37.errorMessage,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
const emErrs2 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs2.push(err8);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":{"type":true,"role":true},"dynamicProps":false,"dynamicItems":false};

const schema66 = {"$id":"export5","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2"};
const schema39 = {"required":["attribute"],"properties":{"type":{"const":"attribute","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type","errorMessage":{}},"attribute":{"type":"string","title":"Nom de l'attribut","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2","errorMessage":{"required":{"attribute":"required information"}}};

function validate45(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export5" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate45.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.attribute === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/required",keyword:"required",params:{missingProperty: "attribute"},message:"must have required property '"+"attribute"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if("attribute" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "attribute"},message:"must be equal to constant",schema:"attribute",parentSchema:schema39.properties.type,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err2 of vErrors){
if(!err2.emUsed){
emErrs0.push(err2);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.attribute !== undefined){
let data1 = data.attribute;
if(typeof data1 !== "string"){
const err3 = {instancePath:instancePath+"/attribute",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.attribute.type,parentSchema:schema39.properties.attribute,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema39.type,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"attribute":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath)) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(116)))){
emPropParams0 = obj0[err6.keyword];
emParamsErrors0 = emErrors0[err6.keyword][err6.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err6);
err6.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err7 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema39.errorMessage[key0][keyProp0],schema:schema39.errorMessage,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
const emErrs2 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs2.push(err8);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate45.errors = vErrors;
return errors === 0;
}
validate45.evaluated = {"props":{"type":true,"attribute":true},"dynamicProps":false,"dynamicItems":false};

const schema68 = {"$id":"export6","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0"};
const schema41 = {"properties":{"type":{"const":"button","title":"Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0","errorMessage":{}};

function validate46(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export6" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate46.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("button" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "button"},message:"must be equal to constant",schema:"button",parentSchema:schema41.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema41.type,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"props":{"type":true},"dynamicProps":false,"dynamicItems":false};

const schema70 = {"$id":"export7","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1"};
const schema43 = {"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1","errorMessage":{}};

function validate47(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export7" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate47.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("emailDomain" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema43.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.emailDomain !== undefined){
let data1 = data.emailDomain;
if(typeof data1 !== "string"){
const err2 = {instancePath:instancePath+"/emailDomain",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.emailDomain.type,parentSchema:schema43.properties.emailDomain,data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema43.type,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs2.push(err5);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate47.errors = vErrors;
return errors === 0;
}
validate47.evaluated = {"props":{"type":true,"emailDomain":true},"dynamicProps":false,"dynamicItems":false};

const schema72 = {"$id":"export8","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2"};
const schema45 = {"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2","errorMessage":{}};

function validate48(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export8" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate48.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type !== undefined){
let data0 = data.type;
if("always" !== data0){
const err0 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema45.properties.type,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema45.type,parentSchema:schema45,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs1.push(err3);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate48.errors = vErrors;
return errors === 0;
}
validate48.evaluated = {"props":{"type":true},"dynamicProps":false,"dynamicItems":false};

const schema74 = {"$id":"export9","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider"};
const schema28 = {"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"color":{"type":"string","title":"Couleur","x-display":"color-picker","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color","errorMessage":{}},"img":{"type":"string","title":"URL du logo (petite taille)","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img","errorMessage":{}},"type":{"type":"string","title":"Type de fournisseur","const":"oidc","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type","errorMessage":{}},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery","errorMessage":{}},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id","errorMessage":{}},"secret":{"type":"string","title":"Secret","writeOnly":true,"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client","errorMessage":{"required":{"id":"required information","secret":"required information"}}},"createMember":{"type":"object","description":"si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.","default":{"type":"never"},"oneOf":[{"properties":{"type":{"const":"never","title":"Créer les utilisateurs en tant que membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0","errorMessage":{}},{"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1","errorMessage":{}},{"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2","errorMessage":{}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember","errorMessage":{"oneOf":"chose one"}},"memberRole":{"type":"object","description":"Le rôle des membres créés automatiquement par ce fournisseur d'identité.","default":{"type":"none"},"oneOf":[{"properties":{"type":{"const":"none","title":"Attribution du rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0","errorMessage":{}},{"required":["role"],"properties":{"type":{"const":"static","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type","errorMessage":{}},"role":{"type":"string","title":"Rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1","errorMessage":{"required":{"role":"required information"}}},{"required":["attribute"],"properties":{"type":{"const":"attribute","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type","errorMessage":{}},"attribute":{"type":"string","title":"Nom de l'attribut","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2","errorMessage":{"required":{"attribute":"required information"}}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole","errorMessage":{"oneOf":"chose one"}},"ignoreEmailVerified":{"type":"boolean","title":"Accepter les utilisateurs aux emails non vérifiés","description":"Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified","errorMessage":{}},"coreIdProvider":{"type":"boolean","title":"Traiter ce fournisseur comme une source principale d'identité","description":"Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider","errorMessage":{}},"redirectMode":{"type":"object","description":"Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.","default":{"type":"button"},"oneOf":[{"properties":{"type":{"const":"button","title":"Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0","errorMessage":{}},{"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1","errorMessage":{}},{"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2","errorMessage":{}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode","errorMessage":{"oneOf":"chose one"}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider"};

function validate49(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export9" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate49.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.discovery === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "discovery"},message:"must have required property '"+"discovery"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.client === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "client"},message:"must have required property '"+"client"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.color !== undefined){
let data0 = data.color;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/color",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.color.type,parentSchema:schema28.properties.color,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs0.push(err3);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.img !== undefined){
let data1 = data.img;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/img",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.img.type,parentSchema:schema28.properties.img,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs1.push(err5);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.type !== undefined){
let data2 = data.type;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data2};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("oidc" !== data2){
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant",schema:"oidc",parentSchema:schema28.properties.type,data:data2};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs2.push(err8);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.discovery !== undefined){
let data3 = data.discovery;
if(typeof data3 !== "string"){
const err9 = {instancePath:instancePath+"/discovery",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.discovery.type,parentSchema:schema28.properties.discovery,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs3.push(err10);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.client !== undefined){
let data4 = data.client;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.id === undefined){
const err11 = {instancePath:instancePath+"/client",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data4.secret === undefined){
const err12 = {instancePath:instancePath+"/client",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data4.id !== undefined){
let data5 = data4.id;
if(typeof data5 !== "string"){
const err13 = {instancePath:instancePath+"/client/id",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.id.type,parentSchema:schema28.properties.client.properties.id,data:data5};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs4.push(err14);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data4.secret !== undefined){
let data6 = data4.secret;
if(typeof data6 !== "string"){
const err15 = {instancePath:instancePath+"/client/secret",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.secret.type,parentSchema:schema28.properties.client.properties.secret,data:data6};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs5.push(err16);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err17 = {instancePath:instancePath+"/client",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.client.type,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"id":[],"secret":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err18 of vErrors){
if((((((err18.keyword !== "errorMessage") && (!err18.emUsed)) && (err18.instancePath === instancePath+"/client")) && (err18.keyword in emErrors0)) && (err18.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client") === 0)) && (/^\/[^\/]*$/.test(err18.schemaPath.slice(104)))){
emPropParams0 = obj0[err18.keyword];
emParamsErrors0 = emErrors0[err18.keyword][err18.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err18);
err18.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err19 = {instancePath:instancePath+"/client",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.properties.client.errorMessage[key0][keyProp0],schema:schema28.properties.client.errorMessage,parentSchema:schema28.properties.client,data:data4};
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
const emErrs6 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs6.push(err20);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.createMember !== undefined){
let data7 = data.createMember;
if(!(data7 && typeof data7 == "object" && !Array.isArray(data7))){
const err21 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.type,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
const _errs18 = errors;
let valid3 = false;
let passing0 = null;
const _errs19 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data8 = data7.type;
if("never" !== data8){
const err22 = {instancePath:instancePath+"/createMember/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "never"},message:"must be equal to constant",schema:"never",parentSchema:schema28.properties.createMember.oneOf[0].properties.type,data:data8};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs7.push(err23);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[0].type,parentSchema:schema28.properties.createMember.oneOf[0],data:data7};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs8.push(err25);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
var _valid0 = _errs19 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = {};
props0.type = true;
}
const _errs22 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data9 = data7.type;
if("always" !== data9){
const err26 = {instancePath:instancePath+"/createMember/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.createMember.oneOf[1].properties.type,data:data9};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs9.push(err27);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err28 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[1].type,parentSchema:schema28.properties.createMember.oneOf[1],data:data7};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err29 of vErrors){
if(!err29.emUsed){
emErrs10.push(err29);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
var _valid0 = _errs22 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
}
}
const _errs25 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data10 = data7.type;
if("emailDomain" !== data10){
const err30 = {instancePath:instancePath+"/createMember/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.createMember.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err31 of vErrors){
if(!err31.emUsed){
emErrs11.push(err31);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data7.emailDomain !== undefined){
let data11 = data7.emailDomain;
if(typeof data11 !== "string"){
const err32 = {instancePath:instancePath+"/createMember/emailDomain",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.createMember.oneOf[2].properties.emailDomain.type,parentSchema:schema28.properties.createMember.oneOf[2].properties.emailDomain,data:data11};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err33 of vErrors){
if(!err33.emUsed){
emErrs12.push(err33);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err34 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[2].type,parentSchema:schema28.properties.createMember.oneOf[2],data:data7};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs13.push(err35);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
var _valid0 = _errs25 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid3 = true;
passing0 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.emailDomain = true;
}
}
}
}
if(!valid3){
const err36 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema28.properties.createMember.oneOf,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
else {
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err37 of vErrors){
if((((((err37.keyword !== "errorMessage") && (!err37.emUsed)) && (err37.instancePath === instancePath+"/createMember")) && (err37.keyword in emErrors1)) && (err37.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember") === 0)) && (/^\/[^\/]*$/.test(err37.schemaPath.slice(110)))){
emErrors1[err37.keyword].push(err37);
err37.emUsed = true;
}
}
for(const key1 in emErrors1){
if(emErrors1[key1].length){
const err38 = {instancePath:instancePath+"/createMember",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key1]},message:key1 in templates1 ? templates1[key1]() : schema28.properties.createMember.errorMessage[key1],schema:schema28.properties.createMember.errorMessage,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
const emErrs14 = [];
for(const err39 of vErrors){
if(!err39.emUsed){
emErrs14.push(err39);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data.memberRole !== undefined){
let data12 = data.memberRole;
if(!(data12 && typeof data12 == "object" && !Array.isArray(data12))){
const err40 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.type,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
const _errs32 = errors;
let valid7 = false;
let passing1 = null;
const _errs33 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.type !== undefined){
let data13 = data12.type;
if("none" !== data13){
const err41 = {instancePath:instancePath+"/memberRole/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant",schema:"none",parentSchema:schema28.properties.memberRole.oneOf[0].properties.type,data:data13};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs15.push(err42);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
}
else {
const err43 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[0].type,parentSchema:schema28.properties.memberRole.oneOf[0],data:data12};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs16.push(err44);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
var _valid1 = _errs33 === errors;
if(_valid1){
valid7 = true;
passing1 = 0;
var props1 = {};
props1.type = true;
}
const _errs36 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.role === undefined){
const err45 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'",schema:schema28.properties.memberRole.oneOf[1].required,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data12.type !== undefined){
let data14 = data12.type;
if("static" !== data14){
const err46 = {instancePath:instancePath+"/memberRole/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "static"},message:"must be equal to constant",schema:"static",parentSchema:schema28.properties.memberRole.oneOf[1].properties.type,data:data14};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err47 of vErrors){
if(!err47.emUsed){
emErrs17.push(err47);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data12.role !== undefined){
let data15 = data12.role;
if(typeof data15 !== "string"){
const err48 = {instancePath:instancePath+"/memberRole/role",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[1].properties.role.type,parentSchema:schema28.properties.memberRole.oneOf[1].properties.role,data:data15};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs18.push(err49);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
}
else {
const err50 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[1].type,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"role":[]}};
const templates2 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err51 of vErrors){
if((((((err51.keyword !== "errorMessage") && (!err51.emUsed)) && (err51.instancePath === instancePath+"/memberRole")) && (err51.keyword in emErrors2)) && (err51.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err51.schemaPath.slice(116)))){
emPropParams1 = obj0[err51.keyword];
emParamsErrors1 = emErrors2[err51.keyword][err51.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err51);
err51.emUsed = true;
}
}
}
for(const key2 in emErrors2){
for(const keyProp1 in emErrors2[key2]){
emParamsErrors1 = emErrors2[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates2[key2] && templates2[key2][keyProp1];
const err52 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.properties.memberRole.oneOf[1].errorMessage[key2][keyProp1],schema:schema28.properties.memberRole.oneOf[1].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
const emErrs19 = [];
for(const err53 of vErrors){
if(!err53.emUsed){
emErrs19.push(err53);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
var _valid1 = _errs36 === errors;
if(_valid1 && valid7){
valid7 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid7 = true;
passing1 = 1;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.role = true;
}
}
const _errs41 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.attribute === undefined){
const err54 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/required",keyword:"required",params:{missingProperty: "attribute"},message:"must have required property '"+"attribute"+"'",schema:schema28.properties.memberRole.oneOf[2].required,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data12.type !== undefined){
let data16 = data12.type;
if("attribute" !== data16){
const err55 = {instancePath:instancePath+"/memberRole/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "attribute"},message:"must be equal to constant",schema:"attribute",parentSchema:schema28.properties.memberRole.oneOf[2].properties.type,data:data16};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs20.push(err56);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data12.attribute !== undefined){
let data17 = data12.attribute;
if(typeof data17 !== "string"){
const err57 = {instancePath:instancePath+"/memberRole/attribute",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[2].properties.attribute.type,parentSchema:schema28.properties.memberRole.oneOf[2].properties.attribute,data:data17};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs21.push(err58);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err59 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[2].type,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"attribute":[]}};
const templates3 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err60 of vErrors){
if((((((err60.keyword !== "errorMessage") && (!err60.emUsed)) && (err60.instancePath === instancePath+"/memberRole")) && (err60.keyword in emErrors3)) && (err60.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err60.schemaPath.slice(116)))){
emPropParams2 = obj0[err60.keyword];
emParamsErrors2 = emErrors3[err60.keyword][err60.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err60);
err60.emUsed = true;
}
}
}
for(const key3 in emErrors3){
for(const keyProp2 in emErrors3[key3]){
emParamsErrors2 = emErrors3[key3][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates3[key3] && templates3[key3][keyProp2];
const err61 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.properties.memberRole.oneOf[2].errorMessage[key3][keyProp2],schema:schema28.properties.memberRole.oneOf[2].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
const emErrs22 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs22.push(err62);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
var _valid1 = _errs41 === errors;
if(_valid1 && valid7){
valid7 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid7 = true;
passing1 = 2;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.attribute = true;
}
}
}
}
if(!valid7){
const err63 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema28.properties.memberRole.oneOf,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
else {
errors = _errs32;
if(vErrors !== null){
if(_errs32){
vErrors.length = _errs32;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors4 = {"oneOf":[]};
const templates4 = {};
for(const err64 of vErrors){
if((((((err64.keyword !== "errorMessage") && (!err64.emUsed)) && (err64.instancePath === instancePath+"/memberRole")) && (err64.keyword in emErrors4)) && (err64.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole") === 0)) && (/^\/[^\/]*$/.test(err64.schemaPath.slice(108)))){
emErrors4[err64.keyword].push(err64);
err64.emUsed = true;
}
}
for(const key4 in emErrors4){
if(emErrors4[key4].length){
const err65 = {instancePath:instancePath+"/memberRole",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/errorMessage",keyword:"errorMessage",params:{errors: emErrors4[key4]},message:key4 in templates4 ? templates4[key4]() : schema28.properties.memberRole.errorMessage[key4],schema:schema28.properties.memberRole.errorMessage,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
const emErrs23 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs23.push(err66);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data.ignoreEmailVerified !== undefined){
let data18 = data.ignoreEmailVerified;
if(typeof data18 !== "boolean"){
const err67 = {instancePath:instancePath+"/ignoreEmailVerified",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.ignoreEmailVerified.type,parentSchema:schema28.properties.ignoreEmailVerified,data:data18};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs24.push(err68);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data.coreIdProvider !== undefined){
let data19 = data.coreIdProvider;
if(typeof data19 !== "boolean"){
const err69 = {instancePath:instancePath+"/coreIdProvider",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.coreIdProvider.type,parentSchema:schema28.properties.coreIdProvider,data:data19};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs25.push(err70);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.redirectMode !== undefined){
let data20 = data.redirectMode;
if(!(data20 && typeof data20 == "object" && !Array.isArray(data20))){
const err71 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.type,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
const _errs52 = errors;
let valid11 = false;
let passing2 = null;
const _errs53 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data21 = data20.type;
if("button" !== data21){
const err72 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "button"},message:"must be equal to constant",schema:"button",parentSchema:schema28.properties.redirectMode.oneOf[0].properties.type,data:data21};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs26.push(err73);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
}
else {
const err74 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[0].type,parentSchema:schema28.properties.redirectMode.oneOf[0],data:data20};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs27.push(err75);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
var _valid2 = _errs53 === errors;
if(_valid2){
valid11 = true;
passing2 = 0;
var props2 = {};
props2.type = true;
}
const _errs56 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data22 = data20.type;
if("emailDomain" !== data22){
const err76 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.redirectMode.oneOf[1].properties.type,data:data22};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err77 of vErrors){
if(!err77.emUsed){
emErrs28.push(err77);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data20.emailDomain !== undefined){
let data23 = data20.emailDomain;
if(typeof data23 !== "string"){
const err78 = {instancePath:instancePath+"/redirectMode/emailDomain",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain.type,parentSchema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain,data:data23};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err79 of vErrors){
if(!err79.emUsed){
emErrs29.push(err79);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
}
else {
const err80 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[1].type,parentSchema:schema28.properties.redirectMode.oneOf[1],data:data20};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err81 of vErrors){
if(!err81.emUsed){
emErrs30.push(err81);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
var _valid2 = _errs56 === errors;
if(_valid2 && valid11){
valid11 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid11 = true;
passing2 = 1;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
props2.emailDomain = true;
}
}
const _errs61 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data24 = data20.type;
if("always" !== data24){
const err82 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.redirectMode.oneOf[2].properties.type,data:data24};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err83 of vErrors){
if(!err83.emUsed){
emErrs31.push(err83);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
}
else {
const err84 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[2].type,parentSchema:schema28.properties.redirectMode.oneOf[2],data:data20};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err85 of vErrors){
if(!err85.emUsed){
emErrs32.push(err85);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
var _valid2 = _errs61 === errors;
if(_valid2 && valid11){
valid11 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid11 = true;
passing2 = 2;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
}
}
}
}
if(!valid11){
const err86 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf",schema:schema28.properties.redirectMode.oneOf,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
else {
errors = _errs52;
if(vErrors !== null){
if(_errs52){
vErrors.length = _errs52;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors5 = {"oneOf":[]};
const templates5 = {};
for(const err87 of vErrors){
if((((((err87.keyword !== "errorMessage") && (!err87.emUsed)) && (err87.instancePath === instancePath+"/redirectMode")) && (err87.keyword in emErrors5)) && (err87.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode") === 0)) && (/^\/[^\/]*$/.test(err87.schemaPath.slice(110)))){
emErrors5[err87.keyword].push(err87);
err87.emUsed = true;
}
}
for(const key5 in emErrors5){
if(emErrors5[key5].length){
const err88 = {instancePath:instancePath+"/redirectMode",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/errorMessage",keyword:"errorMessage",params:{errors: emErrors5[key5]},message:key5 in templates5 ? templates5[key5]() : schema28.properties.redirectMode.errorMessage[key5],schema:schema28.properties.redirectMode.errorMessage,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
const emErrs33 = [];
for(const err89 of vErrors){
if(!err89.emUsed){
emErrs33.push(err89);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
}
else {
const err90 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
validate49.errors = vErrors;
return errors === 0;
}
validate49.evaluated = {"props":{"color":true,"img":true,"type":true,"discovery":true,"client":true,"createMember":true,"memberRole":true,"ignoreEmailVerified":true,"coreIdProvider":true,"redirectMode":true},"dynamicProps":false,"dynamicItems":false};

const schema76 = {"$id":"export10","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1"};
const schema49 = {"type":"object","required":["site"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSite","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1","errorMessage":{"required":{"site":"required information"}}};

function validate50(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export10" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate50.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.site === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/required",keyword:"required",params:{missingProperty: "site"},message:"must have required property '"+"site"+"'",schema:schema49.required,parentSchema:schema49,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err1 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema49.properties.type.type,parentSchema:schema49.properties.type,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if("otherSite" !== data0){
const err2 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "otherSite"},message:"must be equal to constant",schema:"otherSite",parentSchema:schema49.properties.type,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs0.push(err3);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.site !== undefined){
let data1 = data.site;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/site",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema49.properties.site.type,parentSchema:schema49.properties.site,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs1.push(err5);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema49.type,parentSchema:schema49,data};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"site":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err7 of vErrors){
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(106)))){
emPropParams0 = obj0[err7.keyword];
emParamsErrors0 = emErrors0[err7.keyword][err7.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err7);
err7.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema49.errorMessage[key0][keyProp0],schema:schema49.errorMessage,parentSchema:schema49,data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
const emErrs2 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs2.push(err9);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate50.errors = vErrors;
return errors === 0;
}
validate50.evaluated = {"props":{"type":true,"site":true},"dynamicProps":false,"dynamicItems":false};

const schema78 = {"$id":"export11","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2"};
const schema51 = {"type":"object","required":["provider"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSiteProvider","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site","errorMessage":{}},"provider":{"type":"string","title":"Fournisseur","x-if":"parent.value.site","x-fromData":"context.otherSitesProviders[parent.value.site]","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2","errorMessage":{"required":{"provider":"required information"}}};

function validate51(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export11" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate51.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.provider === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema51.required,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err1 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema51.properties.type.type,parentSchema:schema51.properties.type,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if("otherSiteProvider" !== data0){
const err2 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "otherSiteProvider"},message:"must be equal to constant",schema:"otherSiteProvider",parentSchema:schema51.properties.type,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs0.push(err3);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.site !== undefined){
let data1 = data.site;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/site",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema51.properties.site.type,parentSchema:schema51.properties.site,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs1.push(err5);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.provider !== undefined){
let data2 = data.provider;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/provider",schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema51.properties.provider.type,parentSchema:schema51.properties.provider,data:data2};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs2.push(err7);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
}
else {
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema51.type,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"provider":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err9 of vErrors){
if((((((err9.keyword !== "errorMessage") && (!err9.emUsed)) && (err9.instancePath === instancePath)) && (err9.keyword in emErrors0)) && (err9.schemaPath.indexOf("https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err9.schemaPath.slice(106)))){
emPropParams0 = obj0[err9.keyword];
emParamsErrors0 = emErrors0[err9.keyword][err9.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err9);
err9.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err10 = {instancePath,schemaPath:"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema51.errorMessage[key0][keyProp0],schema:schema51.errorMessage,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
const emErrs3 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs3.push(err11);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
validate51.errors = vErrors;
return errors === 0;
}
validate51.evaluated = {"props":{"type":true,"site":true,"provider":true},"dynamicProps":false,"dynamicItems":false};

const schema80 = {"$id":"export12","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items"};
const schema53 = {"type":"object","required":["title","type"],"properties":{"id":{"type":"string","title":"Identifiant","readOnly":true,"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id","errorMessage":{}},"title":{"type":"string","title":"Nom","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title","errorMessage":{}}},"oneOf":[{"$ref":"#/$defs/oidcProvider","type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0","errorMessage":{"required":{"discovery":"required information","client":"required information"}}},{"type":"object","required":["site"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSite","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1","errorMessage":{"required":{"site":"required information"}}},{"type":"object","required":["provider"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSiteProvider","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site","errorMessage":{}},"provider":{"type":"string","title":"Fournisseur","x-if":"parent.value.site","x-fromData":"context.otherSitesProviders[parent.value.site]","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2","errorMessage":{"required":{"provider":"required information"}}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items","errorMessage":{"oneOf":"chose one","required":{"title":"required information"}}};

function validate53(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate53.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs1 = errors;
let valid0 = false;
let passing0 = null;
const _errs2 = errors;
if(!(data && typeof data == "object" && !Array.isArray(data))){
const err0 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema53.oneOf[0].type,parentSchema:schema53.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.discovery === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "discovery"},message:"must have required property '"+"discovery"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.client === undefined){
const err2 = {instancePath,schemaPath:"#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "client"},message:"must have required property '"+"client"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.color !== undefined){
let data0 = data.color;
if(typeof data0 !== "string"){
const err3 = {instancePath:instancePath+"/color",schemaPath:"#/$defs/oidcProvider/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.color.type,parentSchema:schema28.properties.color,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs0.push(err4);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.img !== undefined){
let data1 = data.img;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/img",schemaPath:"#/$defs/oidcProvider/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.img.type,parentSchema:schema28.properties.img,data:data1};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs1.push(err6);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.type !== undefined){
let data2 = data.type;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/type",schemaPath:"#/$defs/oidcProvider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data2};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("oidc" !== data2){
const err8 = {instancePath:instancePath+"/type",schemaPath:"#/$defs/oidcProvider/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant",schema:"oidc",parentSchema:schema28.properties.type,data:data2};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs2.push(err9);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.discovery !== undefined){
let data3 = data.discovery;
if(typeof data3 !== "string"){
const err10 = {instancePath:instancePath+"/discovery",schemaPath:"#/$defs/oidcProvider/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.discovery.type,parentSchema:schema28.properties.discovery,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs3.push(err11);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.client !== undefined){
let data4 = data.client;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.id === undefined){
const err12 = {instancePath:instancePath+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data4.secret === undefined){
const err13 = {instancePath:instancePath+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4.id !== undefined){
let data5 = data4.id;
if(typeof data5 !== "string"){
const err14 = {instancePath:instancePath+"/client/id",schemaPath:"#/$defs/oidcProvider/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.id.type,parentSchema:schema28.properties.client.properties.id,data:data5};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs4.push(err15);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data4.secret !== undefined){
let data6 = data4.secret;
if(typeof data6 !== "string"){
const err16 = {instancePath:instancePath+"/client/secret",schemaPath:"#/$defs/oidcProvider/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.secret.type,parentSchema:schema28.properties.client.properties.secret,data:data6};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs5.push(err17);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err18 = {instancePath:instancePath+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.client.type,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"id":[],"secret":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err19 of vErrors){
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath+"/client")) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("#/$defs/oidcProvider/properties/client") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(38)))){
emPropParams0 = obj0[err19.keyword];
emParamsErrors0 = emErrors0[err19.keyword][err19.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err19);
err19.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err20 = {instancePath:instancePath+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.properties.client.errorMessage[key0][keyProp0],schema:schema28.properties.client.errorMessage,parentSchema:schema28.properties.client,data:data4};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs6.push(err21);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.createMember !== undefined){
let data7 = data.createMember;
if(!(data7 && typeof data7 == "object" && !Array.isArray(data7))){
const err22 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.type,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
const _errs21 = errors;
let valid4 = false;
let passing1 = null;
const _errs22 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data8 = data7.type;
if("never" !== data8){
const err23 = {instancePath:instancePath+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "never"},message:"must be equal to constant",schema:"never",parentSchema:schema28.properties.createMember.oneOf[0].properties.type,data:data8};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs7.push(err24);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
}
else {
const err25 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[0].type,parentSchema:schema28.properties.createMember.oneOf[0],data:data7};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs8.push(err26);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
var _valid1 = _errs22 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
var props0 = {};
props0.type = true;
}
const _errs25 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data9 = data7.type;
if("always" !== data9){
const err27 = {instancePath:instancePath+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.createMember.oneOf[1].properties.type,data:data9};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs9.push(err28);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err29 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[1].type,parentSchema:schema28.properties.createMember.oneOf[1],data:data7};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs10.push(err30);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
var _valid1 = _errs25 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid4 = true;
passing1 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
}
}
const _errs28 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type !== undefined){
let data10 = data7.type;
if("emailDomain" !== data10){
const err31 = {instancePath:instancePath+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.createMember.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs11.push(err32);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data7.emailDomain !== undefined){
let data11 = data7.emailDomain;
if(typeof data11 !== "string"){
const err33 = {instancePath:instancePath+"/createMember/emailDomain",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.createMember.oneOf[2].properties.emailDomain.type,parentSchema:schema28.properties.createMember.oneOf[2].properties.emailDomain,data:data11};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs12.push(err34);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err35 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[2].type,parentSchema:schema28.properties.createMember.oneOf[2],data:data7};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs13.push(err36);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
var _valid1 = _errs28 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid4 = true;
passing1 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.emailDomain = true;
}
}
}
}
if(!valid4){
const err37 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema28.properties.createMember.oneOf,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err38 of vErrors){
if((((((err38.keyword !== "errorMessage") && (!err38.emUsed)) && (err38.instancePath === instancePath+"/createMember")) && (err38.keyword in emErrors1)) && (err38.schemaPath.indexOf("#/$defs/oidcProvider/properties/createMember") === 0)) && (/^\/[^\/]*$/.test(err38.schemaPath.slice(44)))){
emErrors1[err38.keyword].push(err38);
err38.emUsed = true;
}
}
for(const key1 in emErrors1){
if(emErrors1[key1].length){
const err39 = {instancePath:instancePath+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key1]},message:key1 in templates1 ? templates1[key1]() : schema28.properties.createMember.errorMessage[key1],schema:schema28.properties.createMember.errorMessage,parentSchema:schema28.properties.createMember,data:data7};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
const emErrs14 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs14.push(err40);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data.memberRole !== undefined){
let data12 = data.memberRole;
if(!(data12 && typeof data12 == "object" && !Array.isArray(data12))){
const err41 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.type,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
const _errs35 = errors;
let valid8 = false;
let passing2 = null;
const _errs36 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.type !== undefined){
let data13 = data12.type;
if("none" !== data13){
const err42 = {instancePath:instancePath+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant",schema:"none",parentSchema:schema28.properties.memberRole.oneOf[0].properties.type,data:data13};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err43 of vErrors){
if(!err43.emUsed){
emErrs15.push(err43);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
}
else {
const err44 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[0].type,parentSchema:schema28.properties.memberRole.oneOf[0],data:data12};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err45 of vErrors){
if(!err45.emUsed){
emErrs16.push(err45);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
var _valid2 = _errs36 === errors;
if(_valid2){
valid8 = true;
passing2 = 0;
var props1 = {};
props1.type = true;
}
const _errs39 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.role === undefined){
const err46 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'",schema:schema28.properties.memberRole.oneOf[1].required,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data12.type !== undefined){
let data14 = data12.type;
if("static" !== data14){
const err47 = {instancePath:instancePath+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "static"},message:"must be equal to constant",schema:"static",parentSchema:schema28.properties.memberRole.oneOf[1].properties.type,data:data14};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err48 of vErrors){
if(!err48.emUsed){
emErrs17.push(err48);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data12.role !== undefined){
let data15 = data12.role;
if(typeof data15 !== "string"){
const err49 = {instancePath:instancePath+"/memberRole/role",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[1].properties.role.type,parentSchema:schema28.properties.memberRole.oneOf[1].properties.role,data:data15};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs18.push(err50);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
}
else {
const err51 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[1].type,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"role":[]}};
const templates2 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err52 of vErrors){
if((((((err52.keyword !== "errorMessage") && (!err52.emUsed)) && (err52.instancePath === instancePath+"/memberRole")) && (err52.keyword in emErrors2)) && (err52.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err52.schemaPath.slice(50)))){
emPropParams1 = obj0[err52.keyword];
emParamsErrors1 = emErrors2[err52.keyword][err52.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err52);
err52.emUsed = true;
}
}
}
for(const key2 in emErrors2){
for(const keyProp1 in emErrors2[key2]){
emParamsErrors1 = emErrors2[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates2[key2] && templates2[key2][keyProp1];
const err53 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.properties.memberRole.oneOf[1].errorMessage[key2][keyProp1],schema:schema28.properties.memberRole.oneOf[1].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[1],data:data12};
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
const emErrs19 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs19.push(err54);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
var _valid2 = _errs39 === errors;
if(_valid2 && valid8){
valid8 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid8 = true;
passing2 = 1;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.role = true;
}
}
const _errs44 = errors;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.attribute === undefined){
const err55 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/required",keyword:"required",params:{missingProperty: "attribute"},message:"must have required property '"+"attribute"+"'",schema:schema28.properties.memberRole.oneOf[2].required,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data12.type !== undefined){
let data16 = data12.type;
if("attribute" !== data16){
const err56 = {instancePath:instancePath+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "attribute"},message:"must be equal to constant",schema:"attribute",parentSchema:schema28.properties.memberRole.oneOf[2].properties.type,data:data16};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err57 of vErrors){
if(!err57.emUsed){
emErrs20.push(err57);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data12.attribute !== undefined){
let data17 = data12.attribute;
if(typeof data17 !== "string"){
const err58 = {instancePath:instancePath+"/memberRole/attribute",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[2].properties.attribute.type,parentSchema:schema28.properties.memberRole.oneOf[2].properties.attribute,data:data17};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err59 of vErrors){
if(!err59.emUsed){
emErrs21.push(err59);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err60 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[2].type,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"attribute":[]}};
const templates3 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err61 of vErrors){
if((((((err61.keyword !== "errorMessage") && (!err61.emUsed)) && (err61.instancePath === instancePath+"/memberRole")) && (err61.keyword in emErrors3)) && (err61.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err61.schemaPath.slice(50)))){
emPropParams2 = obj0[err61.keyword];
emParamsErrors2 = emErrors3[err61.keyword][err61.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err61);
err61.emUsed = true;
}
}
}
for(const key3 in emErrors3){
for(const keyProp2 in emErrors3[key3]){
emParamsErrors2 = emErrors3[key3][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates3[key3] && templates3[key3][keyProp2];
const err62 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.properties.memberRole.oneOf[2].errorMessage[key3][keyProp2],schema:schema28.properties.memberRole.oneOf[2].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[2],data:data12};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
const emErrs22 = [];
for(const err63 of vErrors){
if(!err63.emUsed){
emErrs22.push(err63);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
var _valid2 = _errs44 === errors;
if(_valid2 && valid8){
valid8 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid8 = true;
passing2 = 2;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.attribute = true;
}
}
}
}
if(!valid8){
const err64 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf",schema:schema28.properties.memberRole.oneOf,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
else {
errors = _errs35;
if(vErrors !== null){
if(_errs35){
vErrors.length = _errs35;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors4 = {"oneOf":[]};
const templates4 = {};
for(const err65 of vErrors){
if((((((err65.keyword !== "errorMessage") && (!err65.emUsed)) && (err65.instancePath === instancePath+"/memberRole")) && (err65.keyword in emErrors4)) && (err65.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole") === 0)) && (/^\/[^\/]*$/.test(err65.schemaPath.slice(42)))){
emErrors4[err65.keyword].push(err65);
err65.emUsed = true;
}
}
for(const key4 in emErrors4){
if(emErrors4[key4].length){
const err66 = {instancePath:instancePath+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/errorMessage",keyword:"errorMessage",params:{errors: emErrors4[key4]},message:key4 in templates4 ? templates4[key4]() : schema28.properties.memberRole.errorMessage[key4],schema:schema28.properties.memberRole.errorMessage,parentSchema:schema28.properties.memberRole,data:data12};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
const emErrs23 = [];
for(const err67 of vErrors){
if(!err67.emUsed){
emErrs23.push(err67);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data.ignoreEmailVerified !== undefined){
let data18 = data.ignoreEmailVerified;
if(typeof data18 !== "boolean"){
const err68 = {instancePath:instancePath+"/ignoreEmailVerified",schemaPath:"#/$defs/oidcProvider/properties/ignoreEmailVerified/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.ignoreEmailVerified.type,parentSchema:schema28.properties.ignoreEmailVerified,data:data18};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err69 of vErrors){
if(!err69.emUsed){
emErrs24.push(err69);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data.coreIdProvider !== undefined){
let data19 = data.coreIdProvider;
if(typeof data19 !== "boolean"){
const err70 = {instancePath:instancePath+"/coreIdProvider",schemaPath:"#/$defs/oidcProvider/properties/coreIdProvider/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.coreIdProvider.type,parentSchema:schema28.properties.coreIdProvider,data:data19};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs25.push(err71);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.redirectMode !== undefined){
let data20 = data.redirectMode;
if(!(data20 && typeof data20 == "object" && !Array.isArray(data20))){
const err72 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.type,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
const _errs55 = errors;
let valid12 = false;
let passing3 = null;
const _errs56 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data21 = data20.type;
if("button" !== data21){
const err73 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "button"},message:"must be equal to constant",schema:"button",parentSchema:schema28.properties.redirectMode.oneOf[0].properties.type,data:data21};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err74 of vErrors){
if(!err74.emUsed){
emErrs26.push(err74);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
}
else {
const err75 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[0].type,parentSchema:schema28.properties.redirectMode.oneOf[0],data:data20};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs27.push(err76);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
var _valid3 = _errs56 === errors;
if(_valid3){
valid12 = true;
passing3 = 0;
var props2 = {};
props2.type = true;
}
const _errs59 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data22 = data20.type;
if("emailDomain" !== data22){
const err77 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.redirectMode.oneOf[1].properties.type,data:data22};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs28.push(err78);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data20.emailDomain !== undefined){
let data23 = data20.emailDomain;
if(typeof data23 !== "string"){
const err79 = {instancePath:instancePath+"/redirectMode/emailDomain",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain.type,parentSchema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain,data:data23};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err80 of vErrors){
if(!err80.emUsed){
emErrs29.push(err80);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
}
else {
const err81 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[1].type,parentSchema:schema28.properties.redirectMode.oneOf[1],data:data20};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs30.push(err82);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
var _valid3 = _errs59 === errors;
if(_valid3 && valid12){
valid12 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid12 = true;
passing3 = 1;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
props2.emailDomain = true;
}
}
const _errs64 = errors;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.type !== undefined){
let data24 = data20.type;
if("always" !== data24){
const err83 = {instancePath:instancePath+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.redirectMode.oneOf[2].properties.type,data:data24};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err84 of vErrors){
if(!err84.emUsed){
emErrs31.push(err84);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
}
else {
const err85 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[2].type,parentSchema:schema28.properties.redirectMode.oneOf[2],data:data20};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err86 of vErrors){
if(!err86.emUsed){
emErrs32.push(err86);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
var _valid3 = _errs64 === errors;
if(_valid3 && valid12){
valid12 = false;
passing3 = [passing3, 2];
}
else {
if(_valid3){
valid12 = true;
passing3 = 2;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
}
}
}
}
if(!valid12){
const err87 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf",schema:schema28.properties.redirectMode.oneOf,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
else {
errors = _errs55;
if(vErrors !== null){
if(_errs55){
vErrors.length = _errs55;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors5 = {"oneOf":[]};
const templates5 = {};
for(const err88 of vErrors){
if((((((err88.keyword !== "errorMessage") && (!err88.emUsed)) && (err88.instancePath === instancePath+"/redirectMode")) && (err88.keyword in emErrors5)) && (err88.schemaPath.indexOf("#/$defs/oidcProvider/properties/redirectMode") === 0)) && (/^\/[^\/]*$/.test(err88.schemaPath.slice(44)))){
emErrors5[err88.keyword].push(err88);
err88.emUsed = true;
}
}
for(const key5 in emErrors5){
if(emErrors5[key5].length){
const err89 = {instancePath:instancePath+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/errorMessage",keyword:"errorMessage",params:{errors: emErrors5[key5]},message:key5 in templates5 ? templates5[key5]() : schema28.properties.redirectMode.errorMessage[key5],schema:schema28.properties.redirectMode.errorMessage,parentSchema:schema28.properties.redirectMode,data:data20};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
const emErrs33 = [];
for(const err90 of vErrors){
if(!err90.emUsed){
emErrs33.push(err90);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
}
else {
const err91 = {instancePath,schemaPath:"#/$defs/oidcProvider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"discovery":[],"client":[]}};
const templates6 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err92 of vErrors){
if((((((err92.keyword !== "errorMessage") && (!err92.emUsed)) && (err92.instancePath === instancePath)) && (err92.keyword in emErrors6)) && (err92.schemaPath.indexOf("#/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err92.schemaPath.slice(9)))){
emPropParams3 = obj0[err92.keyword];
emParamsErrors3 = emErrors6[err92.keyword][err92.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err92);
err92.emUsed = true;
}
}
}
for(const key6 in emErrors6){
for(const keyProp3 in emErrors6[key6]){
emParamsErrors3 = emErrors6[key6][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates6[key6] && templates6[key6][keyProp3];
const err93 = {instancePath,schemaPath:"#/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema53.oneOf[0].errorMessage[key6][keyProp3],schema:schema53.oneOf[0].errorMessage,parentSchema:schema53.oneOf[0],data};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
}
const emErrs34 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs34.push(err94);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
var _valid0 = _errs2 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props3 = {};
props3.color = true;
props3.img = true;
props3.type = true;
props3.discovery = true;
props3.client = true;
props3.createMember = true;
props3.memberRole = true;
props3.ignoreEmailVerified = true;
props3.coreIdProvider = true;
props3.redirectMode = true;
}
const _errs68 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.site === undefined){
const err95 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "site"},message:"must have required property '"+"site"+"'",schema:schema53.oneOf[1].required,parentSchema:schema53.oneOf[1],data};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data.type !== undefined){
let data25 = data.type;
if(typeof data25 !== "string"){
const err96 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.oneOf[1].properties.type.type,parentSchema:schema53.oneOf[1].properties.type,data:data25};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if("otherSite" !== data25){
const err97 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "otherSite"},message:"must be equal to constant",schema:"otherSite",parentSchema:schema53.oneOf[1].properties.type,data:data25};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err98 of vErrors){
if(!err98.emUsed){
emErrs35.push(err98);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
if(data.site !== undefined){
let data26 = data.site;
if(typeof data26 !== "string"){
const err99 = {instancePath:instancePath+"/site",schemaPath:"#/oneOf/1/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.oneOf[1].properties.site.type,parentSchema:schema53.oneOf[1].properties.site,data:data26};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err100 of vErrors){
if(!err100.emUsed){
emErrs36.push(err100);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
}
else {
const err101 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema53.oneOf[1].type,parentSchema:schema53.oneOf[1],data};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"site":[]}};
const templates7 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err102 of vErrors){
if((((((err102.keyword !== "errorMessage") && (!err102.emUsed)) && (err102.instancePath === instancePath)) && (err102.keyword in emErrors7)) && (err102.schemaPath.indexOf("#/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err102.schemaPath.slice(9)))){
emPropParams4 = obj0[err102.keyword];
emParamsErrors4 = emErrors7[err102.keyword][err102.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err102);
err102.emUsed = true;
}
}
}
for(const key7 in emErrors7){
for(const keyProp4 in emErrors7[key7]){
emParamsErrors4 = emErrors7[key7][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates7[key7] && templates7[key7][keyProp4];
const err103 = {instancePath,schemaPath:"#/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema53.oneOf[1].errorMessage[key7][keyProp4],schema:schema53.oneOf[1].errorMessage,parentSchema:schema53.oneOf[1],data};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
}
const emErrs37 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs37.push(err104);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
var _valid0 = _errs68 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props3 !== true){
props3 = props3 || {};
props3.type = true;
props3.site = true;
}
}
const _errs74 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.provider === undefined){
const err105 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema53.oneOf[2].required,parentSchema:schema53.oneOf[2],data};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data.type !== undefined){
let data27 = data.type;
if(typeof data27 !== "string"){
const err106 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.oneOf[2].properties.type.type,parentSchema:schema53.oneOf[2].properties.type,data:data27};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if("otherSiteProvider" !== data27){
const err107 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "otherSiteProvider"},message:"must be equal to constant",schema:"otherSiteProvider",parentSchema:schema53.oneOf[2].properties.type,data:data27};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs38.push(err108);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data.site !== undefined){
let data28 = data.site;
if(typeof data28 !== "string"){
const err109 = {instancePath:instancePath+"/site",schemaPath:"#/oneOf/2/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.oneOf[2].properties.site.type,parentSchema:schema53.oneOf[2].properties.site,data:data28};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs39.push(err110);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data.provider !== undefined){
let data29 = data.provider;
if(typeof data29 !== "string"){
const err111 = {instancePath:instancePath+"/provider",schemaPath:"#/oneOf/2/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.oneOf[2].properties.provider.type,parentSchema:schema53.oneOf[2].properties.provider,data:data29};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs40.push(err112);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
}
else {
const err113 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema53.oneOf[2].type,parentSchema:schema53.oneOf[2],data};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"provider":[]}};
const templates8 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err114 of vErrors){
if((((((err114.keyword !== "errorMessage") && (!err114.emUsed)) && (err114.instancePath === instancePath)) && (err114.keyword in emErrors8)) && (err114.schemaPath.indexOf("#/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err114.schemaPath.slice(9)))){
emPropParams5 = obj0[err114.keyword];
emParamsErrors5 = emErrors8[err114.keyword][err114.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err114);
err114.emUsed = true;
}
}
}
for(const key8 in emErrors8){
for(const keyProp5 in emErrors8[key8]){
emParamsErrors5 = emErrors8[key8][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates8[key8] && templates8[key8][keyProp5];
const err115 = {instancePath,schemaPath:"#/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema53.oneOf[2].errorMessage[key8][keyProp5],schema:schema53.oneOf[2].errorMessage,parentSchema:schema53.oneOf[2],data};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
}
const emErrs41 = [];
for(const err116 of vErrors){
if(!err116.emUsed){
emErrs41.push(err116);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
var _valid0 = _errs74 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props3 !== true){
props3 = props3 || {};
props3.type = true;
props3.site = true;
props3.provider = true;
}
}
}
}
if(!valid0){
const err117 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema53.oneOf,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
else {
errors = _errs1;
if(vErrors !== null){
if(_errs1){
vErrors.length = _errs1;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err118 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema53.required,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data.type === undefined){
const err119 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema53.required,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(props3 !== true){
props3 = props3 || {};
props3.id = true;
props3.title = true;
}
if(data.id !== undefined){
let data30 = data.id;
if(typeof data30 !== "string"){
const err120 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.properties.id.type,parentSchema:schema53.properties.id,data:data30};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err121 of vErrors){
if(!err121.emUsed){
emErrs42.push(err121);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
if(data.title !== undefined){
let data31 = data.title;
if(typeof data31 !== "string"){
const err122 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema53.properties.title.type,parentSchema:schema53.properties.title,data:data31};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err123 of vErrors){
if(!err123.emUsed){
emErrs43.push(err123);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
}
else {
const err124 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema53.type,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"oneOf":[]};
const templates9 = {};
for(const err125 of vErrors){
if((((((err125.keyword !== "errorMessage") && (!err125.emUsed)) && (err125.instancePath === instancePath)) && (err125.keyword in emErrors9)) && (err125.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err125.schemaPath.slice(1)))){
emErrors9[err125.keyword].push(err125);
err125.emUsed = true;
}
}
for(const key9 in emErrors9){
if(emErrors9[key9].length){
const err126 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key9]},message:key9 in templates9 ? templates9[key9]() : schema53.errorMessage[key9],schema:schema53.errorMessage,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
const emErrors10 = {"required":{"title":[]}};
const templates10 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err127 of vErrors){
if((((((err127.keyword !== "errorMessage") && (!err127.emUsed)) && (err127.instancePath === instancePath)) && (err127.keyword in emErrors10)) && (err127.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err127.schemaPath.slice(1)))){
emPropParams6 = obj0[err127.keyword];
emParamsErrors6 = emErrors10[err127.keyword][err127.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err127);
err127.emUsed = true;
}
}
}
for(const key10 in emErrors10){
for(const keyProp6 in emErrors10[key10]){
emParamsErrors6 = emErrors10[key10][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates10[key10] && templates10[key10][keyProp6];
const err128 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema53.errorMessage[key10][keyProp6],schema:schema53.errorMessage,parentSchema:schema53,data};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
}
const emErrs44 = [];
for(const err129 of vErrors){
if(!err129.emUsed){
emErrs44.push(err129);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
validate53.errors = vErrors;
evaluated0.props = props3;
return errors === 0;
}
validate53.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate52(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export12" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate52.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate53(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
errors = vErrors.length;
}
else {
var props0 = validate53.evaluated.props;
}
validate52.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate52.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema83 = {"$id":"export13","$ref":"https://github.com/data-fair/simple-directory/sites/patch-req-body#"};
const schema27 = {"type":"object","title":"Site patch","x-exports":["validate","types","vjsf"],"required":["theme","authMode"],"additionalProperties":false,"properties":{"theme":{"type":"object","additionalProperties":false,"required":["primaryColor"],"properties":{"primaryColor":{"type":"string","x-display":"color-picker","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme","errorMessage":{"required":{"primaryColor":"required information"}}},"logo":{"type":"string","title":"URL d'un logo","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo","errorMessage":{}},"authMode":{"default":"onlyBackOffice","title":"Mode d'authentification","type":"string","oneOf":[{"const":"onlyLocal","title":"uniquement sur le site lui même"},{"const":"onlyBackOffice","title":"uniquement sur le back-office"},{"const":"ssoBackOffice","title":"sur le site et sur le back-office par SSO"},{"const":"onlyOtherSite","title":"uniquement sur un autre de vos sites"}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode","errorMessage":{"oneOf":"chose one"}},"authOnlyOtherSite":{"x-if":"parent.value.authMode === 'onlyOtherSite'","type":"string","title":"Autre site pour l'authentification","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite","errorMessage":{}},"reducedPersonalInfoAtCreation":{"type":"boolean","title":"Réduire les informations personnelles à la création de compte","description":"Si cette option est activée, les informations personnelles demandées à la création d'un compte seront réduites à l'email.","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation","errorMessage":{}},"tosMessage":{"type":"string","x-display":"textarea","title":"Message des conditions d'utilisation","description":"Vous pouvez remplacer le message des conditions d'utilisation par défaut.","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage","errorMessage":{}},"authProviders":{"x-if":"parent.value.authMode !== 'onlyOtherSite' && parent.value.authMode !== 'onlyBackOffice'","type":"array","title":"Fournisseurs d'identité (SSO)","items":{"type":"object","required":["title","type"],"properties":{"id":{"type":"string","title":"Identifiant","readOnly":true,"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id","errorMessage":{}},"title":{"type":"string","title":"Nom","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title","errorMessage":{}}},"oneOf":[{"$ref":"#/$defs/oidcProvider","type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0","errorMessage":{"required":{"discovery":"required information","client":"required information"}}},{"type":"object","required":["site"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSite","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1","errorMessage":{"required":{"site":"required information"}}},{"type":"object","required":["provider"],"properties":{"type":{"type":"string","title":"Type de fournisseur","const":"otherSiteProvider","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type","errorMessage":{}},"site":{"type":"string","title":"Site","x-fromData":"context.otherSites","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site","errorMessage":{}},"provider":{"type":"string","title":"Fournisseur","x-if":"parent.value.site","x-fromData":"context.otherSitesProviders[parent.value.site]","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2","errorMessage":{"required":{"provider":"required information"}}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items","errorMessage":{"oneOf":"chose one","required":{"title":"required information"}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders","errorMessage":{}}},"$defs":{"oidcProvider":{"type":"object","title":"OpenID Connect","required":["discovery","client"],"properties":{"color":{"type":"string","title":"Couleur","x-display":"color-picker","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color","errorMessage":{}},"img":{"type":"string","title":"URL du logo (petite taille)","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img","errorMessage":{}},"type":{"type":"string","title":"Type de fournisseur","const":"oidc","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type","errorMessage":{}},"discovery":{"type":"string","title":"URL de découverte","description":"probablement de la forme http://mon-fournisseur/.well-known/openid-configuration","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery","errorMessage":{}},"client":{"type":"object","required":["id","secret"],"properties":{"id":{"type":"string","title":"Identifiant du client","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id","errorMessage":{}},"secret":{"type":"string","title":"Secret","writeOnly":true,"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret","errorMessage":{}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client","errorMessage":{"required":{"id":"required information","secret":"required information"}}},"createMember":{"type":"object","description":"si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d'identité seront automatiquement membres de l'organisation propriétaire du site.","default":{"type":"never"},"oneOf":[{"properties":{"type":{"const":"never","title":"Créer les utilisateurs en tant que membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0","errorMessage":{}},{"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1","errorMessage":{}},{"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2","errorMessage":{}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember","errorMessage":{"oneOf":"chose one"}},"memberRole":{"type":"object","description":"Le rôle des membres créés automatiquement par ce fournisseur d'identité.","default":{"type":"none"},"oneOf":[{"properties":{"type":{"const":"none","title":"Attribution du rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0","errorMessage":{}},{"required":["role"],"properties":{"type":{"const":"static","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type","errorMessage":{}},"role":{"type":"string","title":"Rôle des membres","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1","errorMessage":{"required":{"role":"required information"}}},{"required":["attribute"],"properties":{"type":{"const":"attribute","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type","errorMessage":{}},"attribute":{"type":"string","title":"Nom de l'attribut","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2","errorMessage":{"required":{"attribute":"required information"}}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole","errorMessage":{"oneOf":"chose one"}},"ignoreEmailVerified":{"type":"boolean","title":"Accepter les utilisateurs aux emails non vérifiés","description":"Par défaut si le fournisseur d'identité retourne email_verified=false l'authentification est refusée. Cochez cette option pour changer ce comportement.","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified","errorMessage":{}},"coreIdProvider":{"type":"boolean","title":"Traiter ce fournisseur comme une source principale d'identité","description":"Cette option a plusieurs effets :\n  - un compte associé à ce fournisseur ne peut pas avoir d'autre moyen d'authentification (mot de posse ou autre fournisseur rattaché au même compte)\n  - les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l'utilisateur a une session active\n  - cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n'existe plus dans le fournisseur d'identité\n - si l'option \"Rôle des membres\" est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider","errorMessage":{}},"redirectMode":{"type":"object","description":"Si vous utilisez un mode basé sur l'email alors la mire d'authentification demandera l'email de l'utilisateur en 1ère étape.","default":{"type":"button"},"oneOf":[{"properties":{"type":{"const":"button","title":"Controlez la manière dont les utilisateurs sont redirigés vers ce fournisseur","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0","errorMessage":{}},{"properties":{"type":{"const":"emailDomain","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type","errorMessage":{}},"emailDomain":{"type":"string","title":"nom de domaine de l'email","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1","errorMessage":{}},{"properties":{"type":{"const":"always","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2","errorMessage":{}}],"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode","errorMessage":{"oneOf":"chose one"}}},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider"}},"$id":"https://github.com/data-fair/simple-directory/sites/patch-req-body","x-vjsf":{},"__pointer":"https://github.com/data-fair/simple-directory/sites/patch-req-body#","errorMessage":{"required":{"theme":"required information","authMode":"required information"}}};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/simple-directory/sites/patch-req-body" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.theme === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "theme"},message:"must have required property '"+"theme"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.authMode === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authMode"},message:"must have required property '"+"authMode"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "theme") || (key0 === "logo")) || (key0 === "authMode")) || (key0 === "authOnlyOtherSite")) || (key0 === "reducedPersonalInfoAtCreation")) || (key0 === "tosMessage")) || (key0 === "authProviders"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.theme !== undefined){
let data0 = data.theme;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.primaryColor === undefined){
const err3 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/required",keyword:"required",params:{missingProperty: "primaryColor"},message:"must have required property '"+"primaryColor"+"'",schema:schema27.properties.theme.required,parentSchema:schema27.properties.theme,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key1 in data0){
if(!(key1 === "primaryColor")){
const err4 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.theme,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.primaryColor !== undefined){
let data1 = data0.primaryColor;
if(typeof data1 !== "string"){
const err5 = {instancePath:instancePath+"/theme/primaryColor",schemaPath:"#/properties/theme/properties/primaryColor/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.theme.properties.primaryColor.type,parentSchema:schema27.properties.theme.properties.primaryColor,data:data1};
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
}
else {
const err7 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.theme.type,parentSchema:schema27.properties.theme,data:data0};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"primaryColor":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err8 of vErrors){
if((((((err8.keyword !== "errorMessage") && (!err8.emUsed)) && (err8.instancePath === instancePath+"/theme")) && (err8.keyword in emErrors0)) && (err8.schemaPath.indexOf("#/properties/theme") === 0)) && (/^\/[^\/]*$/.test(err8.schemaPath.slice(18)))){
emPropParams0 = obj0[err8.keyword];
emParamsErrors0 = emErrors0[err8.keyword][err8.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err8);
err8.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err9 = {instancePath:instancePath+"/theme",schemaPath:"#/properties/theme/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.theme.errorMessage[key2][keyProp0],schema:schema27.properties.theme.errorMessage,parentSchema:schema27.properties.theme,data:data0};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
const emErrs1 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs1.push(err10);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.logo !== undefined){
let data2 = data.logo;
if(typeof data2 !== "string"){
const err11 = {instancePath:instancePath+"/logo",schemaPath:"#/properties/logo/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.logo.type,parentSchema:schema27.properties.logo,data:data2};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs2.push(err12);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.authMode !== undefined){
let data3 = data.authMode;
if(typeof data3 !== "string"){
const err13 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authMode.type,parentSchema:schema27.properties.authMode,data:data3};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const _errs11 = errors;
let valid2 = false;
let passing0 = null;
const _errs12 = errors;
if("onlyLocal" !== data3){
const err14 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/0/const",keyword:"const",params:{allowedValue: "onlyLocal"},message:"must be equal to constant",schema:"onlyLocal",parentSchema:schema27.properties.authMode.oneOf[0],data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs12 === errors;
if(_valid0){
valid2 = true;
passing0 = 0;
}
const _errs13 = errors;
if("onlyBackOffice" !== data3){
const err15 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/1/const",keyword:"const",params:{allowedValue: "onlyBackOffice"},message:"must be equal to constant",schema:"onlyBackOffice",parentSchema:schema27.properties.authMode.oneOf[1],data:data3};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid2 = true;
passing0 = 1;
}
const _errs14 = errors;
if("ssoBackOffice" !== data3){
const err16 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/2/const",keyword:"const",params:{allowedValue: "ssoBackOffice"},message:"must be equal to constant",schema:"ssoBackOffice",parentSchema:schema27.properties.authMode.oneOf[2],data:data3};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid2 = true;
passing0 = 2;
}
const _errs15 = errors;
if("onlyOtherSite" !== data3){
const err17 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf/3/const",keyword:"const",params:{allowedValue: "onlyOtherSite"},message:"must be equal to constant",schema:"onlyOtherSite",parentSchema:schema27.properties.authMode.oneOf[3],data:data3};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid2 = true;
passing0 = 3;
}
}
}
}
if(!valid2){
const err18 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.authMode.oneOf,parentSchema:schema27.properties.authMode,data:data3};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
else {
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err19 of vErrors){
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath+"/authMode")) && (err19.keyword in emErrors1)) && (err19.schemaPath.indexOf("#/properties/authMode") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(21)))){
emErrors1[err19.keyword].push(err19);
err19.emUsed = true;
}
}
for(const key3 in emErrors1){
if(emErrors1[key3].length){
const err20 = {instancePath:instancePath+"/authMode",schemaPath:"#/properties/authMode/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key3]},message:key3 in templates1 ? templates1[key3]() : schema27.properties.authMode.errorMessage[key3],schema:schema27.properties.authMode.errorMessage,parentSchema:schema27.properties.authMode,data:data3};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
const emErrs3 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs3.push(err21);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.authOnlyOtherSite !== undefined){
let data4 = data.authOnlyOtherSite;
if(typeof data4 !== "string"){
const err22 = {instancePath:instancePath+"/authOnlyOtherSite",schemaPath:"#/properties/authOnlyOtherSite/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authOnlyOtherSite.type,parentSchema:schema27.properties.authOnlyOtherSite,data:data4};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs4.push(err23);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data.reducedPersonalInfoAtCreation !== undefined){
let data5 = data.reducedPersonalInfoAtCreation;
if(typeof data5 !== "boolean"){
const err24 = {instancePath:instancePath+"/reducedPersonalInfoAtCreation",schemaPath:"#/properties/reducedPersonalInfoAtCreation/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.reducedPersonalInfoAtCreation.type,parentSchema:schema27.properties.reducedPersonalInfoAtCreation,data:data5};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs5.push(err25);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data.tosMessage !== undefined){
let data6 = data.tosMessage;
if(typeof data6 !== "string"){
const err26 = {instancePath:instancePath+"/tosMessage",schemaPath:"#/properties/tosMessage/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.tosMessage.type,parentSchema:schema27.properties.tosMessage,data:data6};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs6.push(err27);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.authProviders !== undefined){
let data7 = data.authProviders;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
const _errs26 = errors;
let valid5 = false;
let passing1 = null;
const _errs27 = errors;
if(!(data8 && typeof data8 == "object" && !Array.isArray(data8))){
const err28 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.authProviders.items.oneOf[0].type,parentSchema:schema27.properties.authProviders.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.discovery === undefined){
const err29 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "discovery"},message:"must have required property '"+"discovery"+"'",schema:schema28.required,parentSchema:schema28,data:data8};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data8.client === undefined){
const err30 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/$defs/oidcProvider/required",keyword:"required",params:{missingProperty: "client"},message:"must have required property '"+"client"+"'",schema:schema28.required,parentSchema:schema28,data:data8};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data8.color !== undefined){
let data9 = data8.color;
if(typeof data9 !== "string"){
const err31 = {instancePath:instancePath+"/authProviders/" + i0+"/color",schemaPath:"#/$defs/oidcProvider/properties/color/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.color.type,parentSchema:schema28.properties.color,data:data9};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs7.push(err32);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data8.img !== undefined){
let data10 = data8.img;
if(typeof data10 !== "string"){
const err33 = {instancePath:instancePath+"/authProviders/" + i0+"/img",schemaPath:"#/$defs/oidcProvider/properties/img/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.img.type,parentSchema:schema28.properties.img,data:data10};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs8.push(err34);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data8.type !== undefined){
let data11 = data8.type;
if(typeof data11 !== "string"){
const err35 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/$defs/oidcProvider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data11};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if("oidc" !== data11){
const err36 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/$defs/oidcProvider/properties/type/const",keyword:"const",params:{allowedValue: "oidc"},message:"must be equal to constant",schema:"oidc",parentSchema:schema28.properties.type,data:data11};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs9.push(err37);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data8.discovery !== undefined){
let data12 = data8.discovery;
if(typeof data12 !== "string"){
const err38 = {instancePath:instancePath+"/authProviders/" + i0+"/discovery",schemaPath:"#/$defs/oidcProvider/properties/discovery/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.discovery.type,parentSchema:schema28.properties.discovery,data:data12};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err39 of vErrors){
if(!err39.emUsed){
emErrs10.push(err39);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
if(data8.client !== undefined){
let data13 = data8.client;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.id === undefined){
const err40 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data13};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data13.secret === undefined){
const err41 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'",schema:schema28.properties.client.required,parentSchema:schema28.properties.client,data:data13};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data13.id !== undefined){
let data14 = data13.id;
if(typeof data14 !== "string"){
const err42 = {instancePath:instancePath+"/authProviders/" + i0+"/client/id",schemaPath:"#/$defs/oidcProvider/properties/client/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.id.type,parentSchema:schema28.properties.client.properties.id,data:data14};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err43 of vErrors){
if(!err43.emUsed){
emErrs11.push(err43);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data13.secret !== undefined){
let data15 = data13.secret;
if(typeof data15 !== "string"){
const err44 = {instancePath:instancePath+"/authProviders/" + i0+"/client/secret",schemaPath:"#/$defs/oidcProvider/properties/client/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.client.properties.secret.type,parentSchema:schema28.properties.client.properties.secret,data:data15};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err45 of vErrors){
if(!err45.emUsed){
emErrs12.push(err45);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err46 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.client.type,parentSchema:schema28.properties.client,data:data13};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"id":[],"secret":[]}};
const templates2 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err47 of vErrors){
if((((((err47.keyword !== "errorMessage") && (!err47.emUsed)) && (err47.instancePath === instancePath+"/authProviders/" + i0+"/client")) && (err47.keyword in emErrors2)) && (err47.schemaPath.indexOf("#/$defs/oidcProvider/properties/client") === 0)) && (/^\/[^\/]*$/.test(err47.schemaPath.slice(38)))){
emPropParams1 = obj0[err47.keyword];
emParamsErrors1 = emErrors2[err47.keyword][err47.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err47);
err47.emUsed = true;
}
}
}
for(const key4 in emErrors2){
for(const keyProp1 in emErrors2[key4]){
emParamsErrors1 = emErrors2[key4][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates2[key4] && templates2[key4][keyProp1];
const err48 = {instancePath:instancePath+"/authProviders/" + i0+"/client",schemaPath:"#/$defs/oidcProvider/properties/client/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.properties.client.errorMessage[key4][keyProp1],schema:schema28.properties.client.errorMessage,parentSchema:schema28.properties.client,data:data13};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
}
const emErrs13 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs13.push(err49);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data8.createMember !== undefined){
let data16 = data8.createMember;
if(!(data16 && typeof data16 == "object" && !Array.isArray(data16))){
const err50 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.type,parentSchema:schema28.properties.createMember,data:data16};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
const _errs46 = errors;
let valid9 = false;
let passing2 = null;
const _errs47 = errors;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.type !== undefined){
let data17 = data16.type;
if("never" !== data17){
const err51 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "never"},message:"must be equal to constant",schema:"never",parentSchema:schema28.properties.createMember.oneOf[0].properties.type,data:data17};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs14.push(err52);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
}
else {
const err53 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[0].type,parentSchema:schema28.properties.createMember.oneOf[0],data:data16};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs15.push(err54);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
var _valid2 = _errs47 === errors;
if(_valid2){
valid9 = true;
passing2 = 0;
var props0 = {};
props0.type = true;
}
const _errs50 = errors;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.type !== undefined){
let data18 = data16.type;
if("always" !== data18){
const err55 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.createMember.oneOf[1].properties.type,data:data18};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs16.push(err56);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err57 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[1].type,parentSchema:schema28.properties.createMember.oneOf[1],data:data16};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs17.push(err58);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
var _valid2 = _errs50 === errors;
if(_valid2 && valid9){
valid9 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid9 = true;
passing2 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
}
}
const _errs53 = errors;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.type !== undefined){
let data19 = data16.type;
if("emailDomain" !== data19){
const err59 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/type",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.createMember.oneOf[2].properties.type,data:data19};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err60 of vErrors){
if(!err60.emUsed){
emErrs18.push(err60);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data16.emailDomain !== undefined){
let data20 = data16.emailDomain;
if(typeof data20 !== "string"){
const err61 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember/emailDomain",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.createMember.oneOf[2].properties.emailDomain.type,parentSchema:schema28.properties.createMember.oneOf[2].properties.emailDomain,data:data20};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs19.push(err62);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
}
else {
const err63 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.createMember.oneOf[2].type,parentSchema:schema28.properties.createMember.oneOf[2],data:data16};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err64 of vErrors){
if(!err64.emUsed){
emErrs20.push(err64);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
var _valid2 = _errs53 === errors;
if(_valid2 && valid9){
valid9 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid9 = true;
passing2 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.emailDomain = true;
}
}
}
}
if(!valid9){
const err65 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf",schema:schema28.properties.createMember.oneOf,parentSchema:schema28.properties.createMember,data:data16};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
else {
errors = _errs46;
if(vErrors !== null){
if(_errs46){
vErrors.length = _errs46;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors3 = {"oneOf":[]};
const templates3 = {};
for(const err66 of vErrors){
if((((((err66.keyword !== "errorMessage") && (!err66.emUsed)) && (err66.instancePath === instancePath+"/authProviders/" + i0+"/createMember")) && (err66.keyword in emErrors3)) && (err66.schemaPath.indexOf("#/$defs/oidcProvider/properties/createMember") === 0)) && (/^\/[^\/]*$/.test(err66.schemaPath.slice(44)))){
emErrors3[err66.keyword].push(err66);
err66.emUsed = true;
}
}
for(const key5 in emErrors3){
if(emErrors3[key5].length){
const err67 = {instancePath:instancePath+"/authProviders/" + i0+"/createMember",schemaPath:"#/$defs/oidcProvider/properties/createMember/errorMessage",keyword:"errorMessage",params:{errors: emErrors3[key5]},message:key5 in templates3 ? templates3[key5]() : schema28.properties.createMember.errorMessage[key5],schema:schema28.properties.createMember.errorMessage,parentSchema:schema28.properties.createMember,data:data16};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
const emErrs21 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs21.push(err68);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data8.memberRole !== undefined){
let data21 = data8.memberRole;
if(!(data21 && typeof data21 == "object" && !Array.isArray(data21))){
const err69 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.type,parentSchema:schema28.properties.memberRole,data:data21};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
const _errs60 = errors;
let valid13 = false;
let passing3 = null;
const _errs61 = errors;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.type !== undefined){
let data22 = data21.type;
if("none" !== data22){
const err70 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant",schema:"none",parentSchema:schema28.properties.memberRole.oneOf[0].properties.type,data:data22};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs22.push(err71);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err72 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[0].type,parentSchema:schema28.properties.memberRole.oneOf[0],data:data21};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs23.push(err73);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
var _valid3 = _errs61 === errors;
if(_valid3){
valid13 = true;
passing3 = 0;
var props1 = {};
props1.type = true;
}
const _errs64 = errors;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.role === undefined){
const err74 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'",schema:schema28.properties.memberRole.oneOf[1].required,parentSchema:schema28.properties.memberRole.oneOf[1],data:data21};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data21.type !== undefined){
let data23 = data21.type;
if("static" !== data23){
const err75 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "static"},message:"must be equal to constant",schema:"static",parentSchema:schema28.properties.memberRole.oneOf[1].properties.type,data:data23};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs24.push(err76);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data21.role !== undefined){
let data24 = data21.role;
if(typeof data24 !== "string"){
const err77 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole/role",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[1].properties.role.type,parentSchema:schema28.properties.memberRole.oneOf[1].properties.role,data:data24};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs25.push(err78);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
}
else {
const err79 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[1].type,parentSchema:schema28.properties.memberRole.oneOf[1],data:data21};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"role":[]}};
const templates4 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err80 of vErrors){
if((((((err80.keyword !== "errorMessage") && (!err80.emUsed)) && (err80.instancePath === instancePath+"/authProviders/" + i0+"/memberRole")) && (err80.keyword in emErrors4)) && (err80.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err80.schemaPath.slice(50)))){
emPropParams2 = obj0[err80.keyword];
emParamsErrors2 = emErrors4[err80.keyword][err80.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err80);
err80.emUsed = true;
}
}
}
for(const key6 in emErrors4){
for(const keyProp2 in emErrors4[key6]){
emParamsErrors2 = emErrors4[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates4[key6] && templates4[key6][keyProp2];
const err81 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.properties.memberRole.oneOf[1].errorMessage[key6][keyProp2],schema:schema28.properties.memberRole.oneOf[1].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[1],data:data21};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
const emErrs26 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs26.push(err82);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
var _valid3 = _errs64 === errors;
if(_valid3 && valid13){
valid13 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid13 = true;
passing3 = 1;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.role = true;
}
}
const _errs69 = errors;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.attribute === undefined){
const err83 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/required",keyword:"required",params:{missingProperty: "attribute"},message:"must have required property '"+"attribute"+"'",schema:schema28.properties.memberRole.oneOf[2].required,parentSchema:schema28.properties.memberRole.oneOf[2],data:data21};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data21.type !== undefined){
let data25 = data21.type;
if("attribute" !== data25){
const err84 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole/type",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "attribute"},message:"must be equal to constant",schema:"attribute",parentSchema:schema28.properties.memberRole.oneOf[2].properties.type,data:data25};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err85 of vErrors){
if(!err85.emUsed){
emErrs27.push(err85);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data21.attribute !== undefined){
let data26 = data21.attribute;
if(typeof data26 !== "string"){
const err86 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole/attribute",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.memberRole.oneOf[2].properties.attribute.type,parentSchema:schema28.properties.memberRole.oneOf[2].properties.attribute,data:data26};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err87 of vErrors){
if(!err87.emUsed){
emErrs28.push(err87);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
}
else {
const err88 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.memberRole.oneOf[2].type,parentSchema:schema28.properties.memberRole.oneOf[2],data:data21};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"attribute":[]}};
const templates5 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err89 of vErrors){
if((((((err89.keyword !== "errorMessage") && (!err89.emUsed)) && (err89.instancePath === instancePath+"/authProviders/" + i0+"/memberRole")) && (err89.keyword in emErrors5)) && (err89.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err89.schemaPath.slice(50)))){
emPropParams3 = obj0[err89.keyword];
emParamsErrors3 = emErrors5[err89.keyword][err89.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err89);
err89.emUsed = true;
}
}
}
for(const key7 in emErrors5){
for(const keyProp3 in emErrors5[key7]){
emParamsErrors3 = emErrors5[key7][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates5[key7] && templates5[key7][keyProp3];
const err90 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema28.properties.memberRole.oneOf[2].errorMessage[key7][keyProp3],schema:schema28.properties.memberRole.oneOf[2].errorMessage,parentSchema:schema28.properties.memberRole.oneOf[2],data:data21};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
const emErrs29 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs29.push(err91);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
var _valid3 = _errs69 === errors;
if(_valid3 && valid13){
valid13 = false;
passing3 = [passing3, 2];
}
else {
if(_valid3){
valid13 = true;
passing3 = 2;
if(props1 !== true){
props1 = props1 || {};
props1.type = true;
props1.attribute = true;
}
}
}
}
if(!valid13){
const err92 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf",schema:schema28.properties.memberRole.oneOf,parentSchema:schema28.properties.memberRole,data:data21};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
else {
errors = _errs60;
if(vErrors !== null){
if(_errs60){
vErrors.length = _errs60;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors6 = {"oneOf":[]};
const templates6 = {};
for(const err93 of vErrors){
if((((((err93.keyword !== "errorMessage") && (!err93.emUsed)) && (err93.instancePath === instancePath+"/authProviders/" + i0+"/memberRole")) && (err93.keyword in emErrors6)) && (err93.schemaPath.indexOf("#/$defs/oidcProvider/properties/memberRole") === 0)) && (/^\/[^\/]*$/.test(err93.schemaPath.slice(42)))){
emErrors6[err93.keyword].push(err93);
err93.emUsed = true;
}
}
for(const key8 in emErrors6){
if(emErrors6[key8].length){
const err94 = {instancePath:instancePath+"/authProviders/" + i0+"/memberRole",schemaPath:"#/$defs/oidcProvider/properties/memberRole/errorMessage",keyword:"errorMessage",params:{errors: emErrors6[key8]},message:key8 in templates6 ? templates6[key8]() : schema28.properties.memberRole.errorMessage[key8],schema:schema28.properties.memberRole.errorMessage,parentSchema:schema28.properties.memberRole,data:data21};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
const emErrs30 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs30.push(err95);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data8.ignoreEmailVerified !== undefined){
let data27 = data8.ignoreEmailVerified;
if(typeof data27 !== "boolean"){
const err96 = {instancePath:instancePath+"/authProviders/" + i0+"/ignoreEmailVerified",schemaPath:"#/$defs/oidcProvider/properties/ignoreEmailVerified/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.ignoreEmailVerified.type,parentSchema:schema28.properties.ignoreEmailVerified,data:data27};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err97 of vErrors){
if(!err97.emUsed){
emErrs31.push(err97);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data8.coreIdProvider !== undefined){
let data28 = data8.coreIdProvider;
if(typeof data28 !== "boolean"){
const err98 = {instancePath:instancePath+"/authProviders/" + i0+"/coreIdProvider",schemaPath:"#/$defs/oidcProvider/properties/coreIdProvider/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.coreIdProvider.type,parentSchema:schema28.properties.coreIdProvider,data:data28};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err99 of vErrors){
if(!err99.emUsed){
emErrs32.push(err99);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data8.redirectMode !== undefined){
let data29 = data8.redirectMode;
if(!(data29 && typeof data29 == "object" && !Array.isArray(data29))){
const err100 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.type,parentSchema:schema28.properties.redirectMode,data:data29};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
const _errs80 = errors;
let valid17 = false;
let passing4 = null;
const _errs81 = errors;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.type !== undefined){
let data30 = data29.type;
if("button" !== data30){
const err101 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "button"},message:"must be equal to constant",schema:"button",parentSchema:schema28.properties.redirectMode.oneOf[0].properties.type,data:data30};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err102 of vErrors){
if(!err102.emUsed){
emErrs33.push(err102);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
}
else {
const err103 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[0].type,parentSchema:schema28.properties.redirectMode.oneOf[0],data:data29};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs34.push(err104);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
var _valid4 = _errs81 === errors;
if(_valid4){
valid17 = true;
passing4 = 0;
var props2 = {};
props2.type = true;
}
const _errs84 = errors;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.type !== undefined){
let data31 = data29.type;
if("emailDomain" !== data31){
const err105 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "emailDomain"},message:"must be equal to constant",schema:"emailDomain",parentSchema:schema28.properties.redirectMode.oneOf[1].properties.type,data:data31};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err106 of vErrors){
if(!err106.emUsed){
emErrs35.push(err106);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
if(data29.emailDomain !== undefined){
let data32 = data29.emailDomain;
if(typeof data32 !== "string"){
const err107 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/emailDomain",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain.type,parentSchema:schema28.properties.redirectMode.oneOf[1].properties.emailDomain,data:data32};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs36.push(err108);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
}
else {
const err109 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[1].type,parentSchema:schema28.properties.redirectMode.oneOf[1],data:data29};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs37.push(err110);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
var _valid4 = _errs84 === errors;
if(_valid4 && valid17){
valid17 = false;
passing4 = [passing4, 1];
}
else {
if(_valid4){
valid17 = true;
passing4 = 1;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
props2.emailDomain = true;
}
}
const _errs89 = errors;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.type !== undefined){
let data33 = data29.type;
if("always" !== data33){
const err111 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode/type",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "always"},message:"must be equal to constant",schema:"always",parentSchema:schema28.properties.redirectMode.oneOf[2].properties.type,data:data33};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs38.push(err112);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
}
else {
const err113 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.redirectMode.oneOf[2].type,parentSchema:schema28.properties.redirectMode.oneOf[2],data:data29};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err114 of vErrors){
if(!err114.emUsed){
emErrs39.push(err114);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
var _valid4 = _errs89 === errors;
if(_valid4 && valid17){
valid17 = false;
passing4 = [passing4, 2];
}
else {
if(_valid4){
valid17 = true;
passing4 = 2;
if(props2 !== true){
props2 = props2 || {};
props2.type = true;
}
}
}
}
if(!valid17){
const err115 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing4},message:"must match exactly one schema in oneOf",schema:schema28.properties.redirectMode.oneOf,parentSchema:schema28.properties.redirectMode,data:data29};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
else {
errors = _errs80;
if(vErrors !== null){
if(_errs80){
vErrors.length = _errs80;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors7 = {"oneOf":[]};
const templates7 = {};
for(const err116 of vErrors){
if((((((err116.keyword !== "errorMessage") && (!err116.emUsed)) && (err116.instancePath === instancePath+"/authProviders/" + i0+"/redirectMode")) && (err116.keyword in emErrors7)) && (err116.schemaPath.indexOf("#/$defs/oidcProvider/properties/redirectMode") === 0)) && (/^\/[^\/]*$/.test(err116.schemaPath.slice(44)))){
emErrors7[err116.keyword].push(err116);
err116.emUsed = true;
}
}
for(const key9 in emErrors7){
if(emErrors7[key9].length){
const err117 = {instancePath:instancePath+"/authProviders/" + i0+"/redirectMode",schemaPath:"#/$defs/oidcProvider/properties/redirectMode/errorMessage",keyword:"errorMessage",params:{errors: emErrors7[key9]},message:key9 in templates7 ? templates7[key9]() : schema28.properties.redirectMode.errorMessage[key9],schema:schema28.properties.redirectMode.errorMessage,parentSchema:schema28.properties.redirectMode,data:data29};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
const emErrs40 = [];
for(const err118 of vErrors){
if(!err118.emUsed){
emErrs40.push(err118);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
}
else {
const err119 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/$defs/oidcProvider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data8};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"discovery":[],"client":[]}};
const templates8 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err120 of vErrors){
if((((((err120.keyword !== "errorMessage") && (!err120.emUsed)) && (err120.instancePath === instancePath+"/authProviders/" + i0)) && (err120.keyword in emErrors8)) && (err120.schemaPath.indexOf("#/properties/authProviders/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err120.schemaPath.slice(40)))){
emPropParams4 = obj0[err120.keyword];
emParamsErrors4 = emErrors8[err120.keyword][err120.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err120);
err120.emUsed = true;
}
}
}
for(const key10 in emErrors8){
for(const keyProp4 in emErrors8[key10]){
emParamsErrors4 = emErrors8[key10][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates8[key10] && templates8[key10][keyProp4];
const err121 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.authProviders.items.oneOf[0].errorMessage[key10][keyProp4],schema:schema27.properties.authProviders.items.oneOf[0].errorMessage,parentSchema:schema27.properties.authProviders.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
}
const emErrs41 = [];
for(const err122 of vErrors){
if(!err122.emUsed){
emErrs41.push(err122);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
var _valid1 = _errs27 === errors;
if(_valid1){
valid5 = true;
passing1 = 0;
var props3 = {};
props3.color = true;
props3.img = true;
props3.type = true;
props3.discovery = true;
props3.client = true;
props3.createMember = true;
props3.memberRole = true;
props3.ignoreEmailVerified = true;
props3.coreIdProvider = true;
props3.redirectMode = true;
}
const _errs93 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.site === undefined){
const err123 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/required",keyword:"required",params:{missingProperty: "site"},message:"must have required property '"+"site"+"'",schema:schema27.properties.authProviders.items.oneOf[1].required,parentSchema:schema27.properties.authProviders.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data8.type !== undefined){
let data34 = data8.type;
if(typeof data34 !== "string"){
const err124 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.oneOf[1].properties.type.type,parentSchema:schema27.properties.authProviders.items.oneOf[1].properties.type,data:data34};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if("otherSite" !== data34){
const err125 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "otherSite"},message:"must be equal to constant",schema:"otherSite",parentSchema:schema27.properties.authProviders.items.oneOf[1].properties.type,data:data34};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err126 of vErrors){
if(!err126.emUsed){
emErrs42.push(err126);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
if(data8.site !== undefined){
let data35 = data8.site;
if(typeof data35 !== "string"){
const err127 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/1/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.oneOf[1].properties.site.type,parentSchema:schema27.properties.authProviders.items.oneOf[1].properties.site,data:data35};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err128 of vErrors){
if(!err128.emUsed){
emErrs43.push(err128);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
}
else {
const err129 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.authProviders.items.oneOf[1].type,parentSchema:schema27.properties.authProviders.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"site":[]}};
const templates9 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err130 of vErrors){
if((((((err130.keyword !== "errorMessage") && (!err130.emUsed)) && (err130.instancePath === instancePath+"/authProviders/" + i0)) && (err130.keyword in emErrors9)) && (err130.schemaPath.indexOf("#/properties/authProviders/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err130.schemaPath.slice(40)))){
emPropParams5 = obj0[err130.keyword];
emParamsErrors5 = emErrors9[err130.keyword][err130.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err130);
err130.emUsed = true;
}
}
}
for(const key11 in emErrors9){
for(const keyProp5 in emErrors9[key11]){
emParamsErrors5 = emErrors9[key11][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates9[key11] && templates9[key11][keyProp5];
const err131 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.authProviders.items.oneOf[1].errorMessage[key11][keyProp5],schema:schema27.properties.authProviders.items.oneOf[1].errorMessage,parentSchema:schema27.properties.authProviders.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
}
const emErrs44 = [];
for(const err132 of vErrors){
if(!err132.emUsed){
emErrs44.push(err132);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
var _valid1 = _errs93 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid5 = true;
passing1 = 1;
if(props3 !== true){
props3 = props3 || {};
props3.type = true;
props3.site = true;
}
}
const _errs99 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.provider === undefined){
const err133 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.authProviders.items.oneOf[2].required,parentSchema:schema27.properties.authProviders.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(data8.type !== undefined){
let data36 = data8.type;
if(typeof data36 !== "string"){
const err134 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.oneOf[2].properties.type.type,parentSchema:schema27.properties.authProviders.items.oneOf[2].properties.type,data:data36};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
if("otherSiteProvider" !== data36){
const err135 = {instancePath:instancePath+"/authProviders/" + i0+"/type",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "otherSiteProvider"},message:"must be equal to constant",schema:"otherSiteProvider",parentSchema:schema27.properties.authProviders.items.oneOf[2].properties.type,data:data36};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs45.push(err136);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data8.site !== undefined){
let data37 = data8.site;
if(typeof data37 !== "string"){
const err137 = {instancePath:instancePath+"/authProviders/" + i0+"/site",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/site/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.oneOf[2].properties.site.type,parentSchema:schema27.properties.authProviders.items.oneOf[2].properties.site,data:data37};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err138 of vErrors){
if(!err138.emUsed){
emErrs46.push(err138);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data8.provider !== undefined){
let data38 = data8.provider;
if(typeof data38 !== "string"){
const err139 = {instancePath:instancePath+"/authProviders/" + i0+"/provider",schemaPath:"#/properties/authProviders/items/oneOf/2/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.oneOf[2].properties.provider.type,parentSchema:schema27.properties.authProviders.items.oneOf[2].properties.provider,data:data38};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err140 of vErrors){
if(!err140.emUsed){
emErrs47.push(err140);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
}
else {
const err141 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.authProviders.items.oneOf[2].type,parentSchema:schema27.properties.authProviders.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"required":{"provider":[]}};
const templates10 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err142 of vErrors){
if((((((err142.keyword !== "errorMessage") && (!err142.emUsed)) && (err142.instancePath === instancePath+"/authProviders/" + i0)) && (err142.keyword in emErrors10)) && (err142.schemaPath.indexOf("#/properties/authProviders/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err142.schemaPath.slice(40)))){
emPropParams6 = obj0[err142.keyword];
emParamsErrors6 = emErrors10[err142.keyword][err142.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err142);
err142.emUsed = true;
}
}
}
for(const key12 in emErrors10){
for(const keyProp6 in emErrors10[key12]){
emParamsErrors6 = emErrors10[key12][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates10[key12] && templates10[key12][keyProp6];
const err143 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.authProviders.items.oneOf[2].errorMessage[key12][keyProp6],schema:schema27.properties.authProviders.items.oneOf[2].errorMessage,parentSchema:schema27.properties.authProviders.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
}
const emErrs48 = [];
for(const err144 of vErrors){
if(!err144.emUsed){
emErrs48.push(err144);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
var _valid1 = _errs99 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid5 = true;
passing1 = 2;
if(props3 !== true){
props3 = props3 || {};
props3.type = true;
props3.site = true;
props3.provider = true;
}
}
}
}
if(!valid5){
const err145 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.authProviders.items.oneOf,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
else {
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
}
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.title === undefined){
const err146 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema27.properties.authProviders.items.required,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data8.type === undefined){
const err147 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.authProviders.items.required,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(props3 !== true){
props3 = props3 || {};
props3.id = true;
props3.title = true;
}
if(data8.id !== undefined){
let data39 = data8.id;
if(typeof data39 !== "string"){
const err148 = {instancePath:instancePath+"/authProviders/" + i0+"/id",schemaPath:"#/properties/authProviders/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.properties.id.type,parentSchema:schema27.properties.authProviders.items.properties.id,data:data39};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err149 of vErrors){
if(!err149.emUsed){
emErrs49.push(err149);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
if(data8.title !== undefined){
let data40 = data8.title;
if(typeof data40 !== "string"){
const err150 = {instancePath:instancePath+"/authProviders/" + i0+"/title",schemaPath:"#/properties/authProviders/items/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.authProviders.items.properties.title.type,parentSchema:schema27.properties.authProviders.items.properties.title,data:data40};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err151 of vErrors){
if(!err151.emUsed){
emErrs50.push(err151);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err152 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.authProviders.items.type,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"oneOf":[]};
const templates11 = {};
for(const err153 of vErrors){
if((((((err153.keyword !== "errorMessage") && (!err153.emUsed)) && (err153.instancePath === instancePath+"/authProviders/" + i0)) && (err153.keyword in emErrors11)) && (err153.schemaPath.indexOf("#/properties/authProviders/items") === 0)) && (/^\/[^\/]*$/.test(err153.schemaPath.slice(32)))){
emErrors11[err153.keyword].push(err153);
err153.emUsed = true;
}
}
for(const key13 in emErrors11){
if(emErrors11[key13].length){
const err154 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors11[key13]},message:key13 in templates11 ? templates11[key13]() : schema27.properties.authProviders.items.errorMessage[key13],schema:schema27.properties.authProviders.items.errorMessage,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
const emErrors12 = {"required":{"title":[]}};
const templates12 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err155 of vErrors){
if((((((err155.keyword !== "errorMessage") && (!err155.emUsed)) && (err155.instancePath === instancePath+"/authProviders/" + i0)) && (err155.keyword in emErrors12)) && (err155.schemaPath.indexOf("#/properties/authProviders/items") === 0)) && (/^\/[^\/]*$/.test(err155.schemaPath.slice(32)))){
emPropParams7 = obj0[err155.keyword];
emParamsErrors7 = emErrors12[err155.keyword][err155.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err155);
err155.emUsed = true;
}
}
}
for(const key14 in emErrors12){
for(const keyProp7 in emErrors12[key14]){
emParamsErrors7 = emErrors12[key14][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates12[key14] && templates12[key14][keyProp7];
const err156 = {instancePath:instancePath+"/authProviders/" + i0,schemaPath:"#/properties/authProviders/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.authProviders.items.errorMessage[key14][keyProp7],schema:schema27.properties.authProviders.items.errorMessage,parentSchema:schema27.properties.authProviders.items,data:data8};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
}
const emErrs51 = [];
for(const err157 of vErrors){
if(!err157.emUsed){
emErrs51.push(err157);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
}
else {
const err158 = {instancePath:instancePath+"/authProviders",schemaPath:"#/properties/authProviders/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.authProviders.type,parentSchema:schema27.properties.authProviders,data:data7};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err159 of vErrors){
if(!err159.emUsed){
emErrs52.push(err159);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
}
else {
const err160 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(errors > 0){
const emErrors13 = {"required":{"theme":[],"authMode":[]}};
const templates13 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err161 of vErrors){
if((((((err161.keyword !== "errorMessage") && (!err161.emUsed)) && (err161.instancePath === instancePath)) && (err161.keyword in emErrors13)) && (err161.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err161.schemaPath.slice(1)))){
emPropParams8 = obj0[err161.keyword];
emParamsErrors8 = emErrors13[err161.keyword][err161.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err161);
err161.emUsed = true;
}
}
}
for(const key15 in emErrors13){
for(const keyProp8 in emErrors13[key15]){
emParamsErrors8 = emErrors13[key15][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates13[key15] && templates13[key15][keyProp8];
const err162 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.errorMessage[key15][keyProp8],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
}
const emErrs53 = [];
for(const err163 of vErrors){
if(!err163.emUsed){
emErrs53.push(err163);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate55(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export13" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate55.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,validates
) {
return ([{"const":"onlyLocal","title":"uniquement sur le site lui même","key":"onlyLocal","value":"onlyLocal"},{"const":"onlyBackOffice","title":"uniquement sur le back-office","key":"onlyBackOffice","value":"onlyBackOffice"},{"const":"ssoBackOffice","title":"sur le site et sur le back-office par SSO","key":"ssoBackOffice","value":"ssoBackOffice"},{"const":"onlyOtherSite","title":"uniquement sur un autre de vos sites","key":"onlyOtherSite","value":"onlyOtherSite"}])
}function expression2(data,value,options,context,display,layout,validates
) {
return (layout.options)
}function expression3(data,value,options,context,display,layout,validates
) {
return (layout.constData)
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/simple-directory/sites/patch-req-body#",

  skeletonTrees: {
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#": {
      title: "main",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items": {
      title: undefined,
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0": {
      title: "option 0",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0": {
      title: "jamais",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1": {
      title: "toujours",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2": {
      title: "quand l'email appartient à un nom de domaine",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0": {
      title: "Aucun rôle par défaut (simple utilisateur)",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1": {
      title: "Tout le temps ce rôle : ",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2": {
      title: "Rôle lu dans un attribut de l'identité",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0": {
      title: "bouton",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1": {
      title: "redirection auto quand l'email appartient à un nom de domaine",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2": {
      title: "toujours rediriger implicitement",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1": {
      title: "Un autre de vos sites",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2": {
      title: "Un fournisseur d'identité configuré sur autre de vos sites",
      root: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2"
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#",
      pure: true,
      propertyKeys: ["theme", "logo", "authMode", "authOnlyOtherSite", "reducedPersonalInfoAtCreation", "tosMessage", "authProviders"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme": {
      key: "theme",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme",
      pure: true,
      propertyKeys: ["primaryColor"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor": {
      key: "primaryColor",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo": {
      key: "logo",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode": {
      key: "authMode",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite": {
      key: "authOnlyOtherSite",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation": {
      key: "reducedPersonalInfoAtCreation",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage": {
      key: "tosMessage",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders": {
      key: "authProviders",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      childrenTrees: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items",
      pure: true,
      propertyKeys: ["id", "title"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id": {
      key: "id",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title": {
      key: "title",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider",
      pure: true,
      propertyKeys: ["color", "img", "type", "discovery", "client", "createMember", "memberRole", "ignoreEmailVerified", "coreIdProvider", "redirectMode"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color": {
      key: "color",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img": {
      key: "img",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery": {
      key: "discovery",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client": {
      key: "client",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client",
      pure: true,
      propertyKeys: ["id", "secret"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id": {
      key: "id",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret": {
      key: "secret",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember": {
      key: "createMember",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0",
      pure: true,
      propertyKeys: ["type"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1",
      pure: true,
      propertyKeys: ["type"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2",
      pure: true,
      propertyKeys: ["type", "emailDomain"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain": {
      key: "emailDomain",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf",
      childrenTrees: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2"],
      pure: true,
      propertyKeys: [],
      roPropertyKeys: []
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole": {
      key: "memberRole",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0",
      pure: true,
      propertyKeys: ["type"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1",
      pure: true,
      propertyKeys: ["type", "role"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role": {
      key: "role",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2",
      pure: true,
      propertyKeys: ["type", "attribute"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute": {
      key: "attribute",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf",
      childrenTrees: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2"],
      pure: true,
      propertyKeys: [],
      roPropertyKeys: []
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified": {
      key: "ignoreEmailVerified",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider": {
      key: "coreIdProvider",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode": {
      key: "redirectMode",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0",
      pure: true,
      propertyKeys: ["type"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1",
      pure: true,
      propertyKeys: ["type", "emailDomain"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain": {
      key: "emailDomain",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2",
      pure: true,
      propertyKeys: ["type"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf",
      childrenTrees: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2"],
      pure: true,
      propertyKeys: [],
      roPropertyKeys: []
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1",
      pure: true,
      propertyKeys: ["type", "site"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site": {
      key: "site",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2",
      pure: true,
      propertyKeys: ["type", "site", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type": {
      key: "type",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site": {
      key: "site",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider": {
      key: "provider",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf",
      refPointer: "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf",
      childrenTrees: ["https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1", "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2"],
      pure: true,
      propertyKeys: [],
      roPropertyKeys: []
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#": {
      comp: "section",

      children: [{
        key: "theme"
      }, {
        key: "logo"
      }, {
        key: "authMode"
      }, {
        key: "authOnlyOtherSite"
      }, {
        key: "reducedPersonalInfoAtCreation"
      }, {
        key: "tosMessage"
      }, {
        key: "authProviders"
      }],

      title: "Site patch",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme": {
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/theme/properties/primaryColor": {
      comp: "text-field",
      label: "primaryColor"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/logo": {
      comp: "text-field",
      label: "URL d'un logo"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authMode": {
      comp: "select",
      label: "Mode d'authentification",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"onlyLocal\",\"title\":\"uniquement sur le site lui même\",\"key\":\"onlyLocal\",\"value\":\"onlyLocal\"},{\"const\":\"onlyBackOffice\",\"title\":\"uniquement sur le back-office\",\"key\":\"onlyBackOffice\",\"value\":\"onlyBackOffice\"},{\"const\":\"ssoBackOffice\",\"title\":\"sur le site et sur le back-office par SSO\",\"key\":\"ssoBackOffice\",\"value\":\"ssoBackOffice\"},{\"const\":\"onlyOtherSite\",\"title\":\"uniquement sur un autre de vos sites\",\"key\":\"onlyOtherSite\",\"value\":\"onlyOtherSite\"}]",
        immutable: true,
        ref: 1
      },

      defaultData: "onlyBackOffice",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authOnlyOtherSite": {
      comp: "text-field",
      label: "Autre site pour l'authentification"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/reducedPersonalInfoAtCreation": {
      comp: "checkbox",
      label: "Réduire les informations personnelles à la création de compte",
      help: "<p>Si cette option est activée, les informations personnelles demandées à la création d&#39;un compte seront réduites à l&#39;email.</p>"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/tosMessage": {
      comp: "text-field",
      label: "Message des conditions d'utilisation",
      help: "<p>Vous pouvez remplacer le message des conditions d&#39;utilisation par défaut.</p>"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders": {
      comp: "list",
      title: "Fournisseurs d'identité (SSO)",
      listEditMode: "inline-single",
      listActions: ["add", "edit", "delete", "duplicate", "sort"]
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items": {
      comp: "section",

      children: [{
        key: "id"
      }, {
        key: "title"
      }, {
        key: "$oneOf"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      },

      nullable: true
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/id": {
      comp: "text-field",
      label: "Identifiant",

      options: {
        readOnly: true
      },

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 2
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/properties/title": {
      comp: "text-field",
      label: "Nom"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf": {
      comp: "one-of-select"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/0": {
      comp: "section",

      children: [{
        key: "color"
      }, {
        key: "img"
      }, {
        key: "type"
      }, {
        key: "discovery"
      }, {
        key: "client"
      }, {
        key: "createMember"
      }, {
        key: "memberRole"
      }, {
        key: "ignoreEmailVerified"
      }, {
        key: "coreIdProvider"
      }, {
        key: "redirectMode"
      }],

      title: "OpenID Connect",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/color": {
      comp: "text-field",
      label: "Couleur"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/img": {
      comp: "text-field",
      label: "URL du logo (petite taille)"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/type": {
      comp: "none",
      constData: "oidc",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/discovery": {
      comp: "text-field",
      label: "URL de découverte",
      help: "<p>probablement de la forme <a href=\"http://mon-fournisseur/.well-known/openid-configuration\">http://mon-fournisseur/.well-known/openid-configuration</a></p>"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client": {
      comp: "section",

      children: [{
        key: "id"
      }, {
        key: "secret"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/id": {
      comp: "text-field",
      label: "Identifiant du client"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/client/properties/secret": {
      comp: "text-field",
      label: "Secret"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember": {
      comp: "section",

      children: [{
        key: "$oneOf"
      }],

      title: null,
      help: "<p>si cette option est activée tous les utilisateurs créés au travers de ce fournisseur d&#39;identité seront automatiquement membres de l&#39;organisation propriétaire du site.</p>",

      defaultData: {
        type: "never"
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf": {
      comp: "one-of-select"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0": {
      comp: "section",

      children: [{
        key: "type"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0/properties/type": {
      comp: "none",
      constData: "never",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1": {
      comp: "section",

      children: [{
        key: "type"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1/properties/type": {
      comp: "none",
      constData: "always",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "emailDomain"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/type": {
      comp: "none",
      constData: "emailDomain",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2/properties/emailDomain": {
      comp: "text-field",
      label: "nom de domaine de l'email"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole": {
      comp: "section",

      children: [{
        key: "$oneOf"
      }],

      title: null,
      help: "<p>Le rôle des membres créés automatiquement par ce fournisseur d&#39;identité.</p>",

      defaultData: {
        type: "none"
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf": {
      comp: "one-of-select"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0": {
      comp: "section",

      children: [{
        key: "type"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0/properties/type": {
      comp: "none",
      constData: "none",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "role"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/type": {
      comp: "none",
      constData: "static",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1/properties/role": {
      comp: "text-field",
      label: "Rôle des membres"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "attribute"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/type": {
      comp: "none",
      constData: "attribute",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2/properties/attribute": {
      comp: "text-field",
      label: "Nom de l'attribut"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/ignoreEmailVerified": {
      comp: "checkbox",
      label: "Accepter les utilisateurs aux emails non vérifiés",
      help: "<p>Par défaut si le fournisseur d&#39;identité retourne email_verified=false l&#39;authentification est refusée. Cochez cette option pour changer ce comportement.</p>"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/coreIdProvider": {
      comp: "checkbox",
      label: "Traiter ce fournisseur comme une source principale d'identité",
      help: "<p>Cette option a plusieurs effets :</p>\n<ul>\n<li>un compte associé à ce fournisseur ne peut pas avoir d&#39;autre moyen d&#39;authentification (mot de posse ou autre fournisseur rattaché au même compte)</li>\n<li>les informations du compte seront en lecture seule et synchronisées automatiquement depuis le fournisseur quand l&#39;utilisateur a une session active</li>\n<li>cette synchronisation inclue la destruction de la session et la désactivation du compte si celui-ci n&#39;existe plus dans le fournisseur d&#39;identité</li>\n<li>si l&#39;option &quot;Rôle des membres&quot; est utilisée le rôle sera lui aussi synchronisé et ne sera pas éditable dans le back-office</li>\n</ul>"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode": {
      comp: "section",

      children: [{
        key: "$oneOf"
      }],

      title: null,
      help: "<p>Si vous utilisez un mode basé sur l&#39;email alors la mire d&#39;authentification demandera l&#39;email de l&#39;utilisateur en 1ère étape.</p>",

      defaultData: {
        type: "button"
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf": {
      comp: "one-of-select"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0": {
      comp: "section",

      children: [{
        key: "type"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0/properties/type": {
      comp: "none",
      constData: "button",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "emailDomain"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/type": {
      comp: "none",
      constData: "emailDomain",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1/properties/emailDomain": {
      comp: "text-field",
      label: "nom de domaine de l'email"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2": {
      comp: "section",

      children: [{
        key: "type"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2/properties/type": {
      comp: "none",
      constData: "always",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "site"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/type": {
      comp: "none",
      constData: "otherSite",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1/properties/site": {
      comp: "text-field",
      label: "Site"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "site"
      }, {
        key: "provider"
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

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/type": {
      comp: "none",
      constData: "otherSiteProvider",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/site": {
      comp: "text-field",
      label: "Site"
    },

    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2/properties/provider": {
      comp: "text-field",
      label: "Fournisseur"
    }
  },

  validates: {
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/0": validate40,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/1": validate41,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/createMember/oneOf/2": validate42,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/0": validate43,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/1": validate44,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/memberRole/oneOf/2": validate45,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/0": validate46,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/1": validate47,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider/properties/redirectMode/oneOf/2": validate48,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/$defs/oidcProvider": validate49,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/1": validate50,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items/oneOf/2": validate51,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#/properties/authProviders/items": validate52,
    "https://github.com/data-fair/simple-directory/sites/patch-req-body#": validate55
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3],
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
    },

    checkbox: {
      name: "checkbox"
    },

    list: {
      name: "list"
    },

    "one-of-select": {
      name: "one-of-select"
    },

    none: {
      name: "none"
    }
  },

  localizeErrors: localizeErrors
};

const nodeComponents = {
  
  "section": sectionNode,
  
  "text-field": textfieldNode,
  
  "select": selectNode,
  
  "checkbox": checkboxNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
    
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