/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/admin/oauth-tokens': RouteRecordInfo<'/admin/oauth-tokens', '/admin/oauth-tokens', Record<never, never>, Record<never, never>>,
    '/admin/organizations': RouteRecordInfo<'/admin/organizations', '/admin/organizations', Record<never, never>, Record<never, never>>,
    '/admin/sites/': RouteRecordInfo<'/admin/sites/', '/admin/sites', Record<never, never>, Record<never, never>>,
    '/admin/sites/[id]': RouteRecordInfo<'/admin/sites/[id]', '/admin/sites/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/admin/users': RouteRecordInfo<'/admin/users', '/admin/users', Record<never, never>, Record<never, never>>,
    '/contact': RouteRecordInfo<'/contact', '/contact', Record<never, never>, Record<never, never>>,
    '/create-organization': RouteRecordInfo<'/create-organization', '/create-organization', Record<never, never>, Record<never, never>>,
    '/dev': RouteRecordInfo<'/dev', '/dev', Record<never, never>, Record<never, never>>,
    '/invitation': RouteRecordInfo<'/invitation', '/invitation', Record<never, never>, Record<never, never>>,
    '/login': RouteRecordInfo<'/login', '/login', Record<never, never>, Record<never, never>>,
    '/me': RouteRecordInfo<'/me', '/me', Record<never, never>, Record<never, never>>,
    '/organization/[id]/': RouteRecordInfo<'/organization/[id]/', '/organization/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/organization/[id]/department/[departmentId]': RouteRecordInfo<'/organization/[id]/department/[departmentId]', '/organization/:id/department/:departmentId', { id: ParamValue<true>, departmentId: ParamValue<true> }, { id: ParamValue<false>, departmentId: ParamValue<false> }>,
  }
}
