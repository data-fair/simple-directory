import path from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Unfonts from 'unplugin-fonts/vite'
import Vuetify from 'vite-plugin-vuetify'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { autoImports } from '@data-fair/lib-vuetify/vite.js'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/events',
  optimizeDeps: { include: ['debug'] },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/')
    },
  },
  plugins: [
    VueRouter({
      dts: './dts/typed-router.d.ts',
      exclude: process.env.NODE_ENV === 'development' ? [] : ['src/pages/dev.vue']
    }),
    Vue(),
    VueI18nPlugin(),
    Vuetify(),
    Unfonts({ google: { families: [{ name: 'Nunito', styles: 'ital,wght@0,200..1000;1,200..1000' }] } }),
    AutoImport({
      dts: './dts/auto-imports.d.ts',
      vueTemplate: true,
      imports: [
        ...(autoImports as any),
        {
          '~/context': ['$uiConfig', '$sitePath', '$apiPath', '$fetch'],
          '@mdi/js': ['mdiBell', 'mdiRefresh', 'mdiSend', 'mdiDelete', 'mdiDevices', 'mdiEmail', 'mdiRss', 'mdiDotsVertical', 'mdiCheckCircle', 'mdiCancel', 'mdiAlertCircle', 'mdiCellphone', 'mdiWeb']
        }
      ],
      dirs: [
        'src/utils',
        'src/composables'
      ]
    }),
    Components(),
    {
      name: 'inject-site-context',
      async transformIndexHtml (html) {
        // in production this injection will be performed by an express middleware
        if (process.env.NODE_ENV !== 'development') return html
        const { uiConfig } = await import('../api/src/config')
        return microTemplate(html, { SITE_PATH: '', UI_CONFIG: JSON.stringify(uiConfig) })
      }
    }
  ],
  experimental: {
    renderBuiltUrl (filename, { hostType }) {
      if (hostType === 'html') return '{SITE_PATH}/events/' + filename
      return { relative: true }
    }
  },
  server: { hmr: { port: 7200 } }
})
