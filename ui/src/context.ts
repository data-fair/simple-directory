import { ofetch } from 'ofetch'
import type { UiConfig } from '../../api/src/ui-config'

export const $uiConfig = (window as any).__UI_CONFIG as UiConfig
export const $sitePath = (window as any).__SITE_PATH as string
export const $cspNonce = (window as any).__CSP_NONCE as string
export const $siteUrl = window.location.origin + $sitePath
export const $sdUrl = $siteUrl + '/simple-directory'
export const $apiPath = $sitePath + '/simple-directory/api'
export const $fetch = ofetch.create({ baseURL: $apiPath })
