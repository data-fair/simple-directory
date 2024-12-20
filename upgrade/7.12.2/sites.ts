import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// copied from api/config/default.cjs
const defaultTheme = {
  logo: undefined,
  colors: {
    // standard vuetify colors, see https://vuetifyjs.com/en/styles/colors/#material-colors
    background: '#FFFFFF',
    'on-background': '#424242', // grey-darken-3
    surface: '#FFFFFF',
    'on-surface': '#424242', // grey-darken-3
    primary: '#1976D2', // blue.darken2
    'on-primary': '#FFFFFF', // white
    'text-primary': undefined, // same as primary by default
    secondary: '#90CAF9', // blue-lighten-3
    'on-secondary': '#000000',
    accent: '#DD2C00', // deep-orange-darken-4
    'on-accent': '#FFFFFF',
    error: '#D50000', // red-accent-4
    'on-error': '#FFFFFF',
    info: '#2962FF', // blue-accent-4
    'on-info': '#FFFFFF',
    success: '#2E7D32', // green-darken-3
    'on-success': '#FFFFFF',
    warning: '#D81B60', // pink-darken-1
    'on-warning': '#FFFFFF',
    admin: '#B71C1C', // red-darken-4
    'on-admin': '#FFFFFF',
  },
  dark: false,
  darkColors: {
    background: '#FFFFFF',
    'on-background': '#424242', // grey-darken-3
    surface: '#FFFFFF',
    'on-surface': '#424242', // grey-darken-3
    primary: '#1976D2', // blue.darken2
    'on-primary': '#FFFFFF', // white
    'text-primary': undefined, // same as primary by default
    secondary: '#90CAF9', // blue-lighten-3
    'on-secondary': '#000000',
    accent: '#DD2C00', // deep-orange-darken-4
    'on-accent': '#FFFFFF',
    error: '#D50000', // red-accent-4
    'on-error': '#FFFFFF',
    info: '#2962FF', // blue-accent-4
    'on-info': '#FFFFFF',
    success: '#2E7D32', // green-darken-3
    'on-success': '#FFFFFF',
    warning: '#D81B60', // pink-darken-1
    'on-warning': '#FFFFFF',
    admin: '#B71C1C', // red-darken-4
    'on-admin': '#FFFFFF',
  },
  hc: false,
  hcColors: {
    background: '#FFFFFF',
    'on-background': '#424242', // grey-darken-3
    surface: '#FFFFFF',
    'on-surface': '#424242', // grey-darken-3
    primary: '#1976D2', // blue.darken2
    'on-primary': '#FFFFFF', // white
    'text-primary': undefined, // same as primary by default
    secondary: '#90CAF9', // blue-lighten-3
    'on-secondary': '#000000',
    accent: '#DD2C00', // deep-orange-darken-4
    'on-accent': '#FFFFFF',
    error: '#D50000', // red-accent-4
    'on-error': '#FFFFFF',
    info: '#2962FF', // blue-accent-4
    'on-info': '#FFFFFF',
    success: '#2E7D32', // green-darken-3
    'on-success': '#FFFFFF',
    warning: '#D81B60', // pink-darken-1
    'on-warning': '#FFFFFF',
    admin: '#B71C1C', // red-darken-4
    'on-admin': '#FFFFFF',
  }
}

const upgradeScript: UpgradeScript = {
  description: 'Upgrade sites definitions for more complete themes',
  async exec (db, debug) {
    for await (const site of db.collection('sites').find({ 'theme.colors': { $exists: false } })) {
      debug(`update site (${site.host}${site.path || ''})`)

      const theme = { ...defaultTheme }
      if (site.theme?.logo) theme.logo = site.theme.logo
      if (site.theme?.primaryColor) theme.colors.primary = site.theme.primaryColor

      await db.collection('sites').updateOne({ _id: site._id }, { $set: { theme }, $unset: { logo: 1 } })
    }
  }
}

export default upgradeScript
