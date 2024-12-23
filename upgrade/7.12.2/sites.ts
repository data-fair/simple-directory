import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// copied from api/config/default.cjs
const defaultTheme = {
  logo: undefined,
  colors: {
    // standard vuetify colors, see https://vuetifyjs.com/en/styles/colors/#material-colors
    background: '#FAFAFA', // grey-lighten-5
    'on-background': '#424242', // grey-darken-3
    surface: '#FFFFFF',
    'on-surface': '#424242', // grey-darken-3
    primary: '#1976D2', // blue-darken-2
    'on-primary': '#FFFFFF',
    'text-primary': '#1565C0',
    secondary: '#81D4FA', // light-blue-lighten-3
    'on-secondary': '#000000',
    'text-secondary': '#0277BD', // light-blue-darken-3
    accent: '#2962FF', // blue-accent-4
    'on-accent': '#FFFFFF',
    'text-accent': undefined,
    info: '#FFE0B2', // orange-lighten-4
    'on-info': '#000000',
    'text-info': '#bf4300',
    success: '#B9F6CA', // green-accent-1
    'on-success': '#000000',
    'text-success': '#2E7D32', // green-darken-3
    error: '#D50000', // red-accent-4
    'on-error': '#FFFFFF',
    'text-error': undefined,
    warning: '#D81B60', // pink-darken-1
    'on-warning': '#FFFFFF',
    'text-warning': undefined,
    admin: '#B71C1C', // red-darken-4
    'on-admin': '#FFFFFF',
    'text-admin': undefined,
  },
  dark: false,
  darkColors: {
    background: '#121212',
    'on-background': '#FFFFFF', // white
    surface: '#212121',
    'on-surface': '#FFFFFF', // white
    primary: '#1976D2', // blue-darken-2
    'on-primary': '#FFFFFF', // white
    'text-primary': '#2196F3', // blue
    secondary: '#BBDEFB', // blue-lighten-4
    'on-secondary': '#000000',
    'text-secondary': undefined,
    accent: '#2962FF', // blue-accent-1
    'on-accent': '#FFFFFF',
    'text-accent': '#82B1FF',
    error: '#D50000', // red-accent-4
    'on-error': '#FFFFFF',
    'text-error': '#FF5252', // red-accent-2
    info: '#FFE0B2',
    'on-info': '#000000',
    'text-info': undefined,
    success: '#B9F6CA', // green-accent-1
    'on-success': '#000000',
    'text-success': undefined,
    warning: '#D81B60', // pink-darken-1
    'on-warning': '#FFFFFF',
    'text-warning': '#FF4081', // pink-accent-2
    admin: '#B71C1C', // red-darken-4
    'on-admin': '#FFFFFF',
    'text-admin': '#FFCDD2'
  },
  hc: false,
  hcColors: {
    // standard vuetify colors, see https://vuetifyjs.com/en/styles/colors/#material-colors
    background: '#FFFFFF',
    'on-background': '#000000',
    surface: '#FFFFFF',
    'on-surface': '#000000',
    primary: '#0D47A1', // blue-darken-4
    'on-primary': '#FFFFFF',
    'text-primary': undefined,
    secondary: '#81D4FA', // light-blue-lighten-3
    'on-secondary': '#000000',
    'text-secondary': '#01579B', // light-blue-darken-3
    accent: '#1d44b3', // blue-accent-4
    'on-accent': '#FFFFFF',
    'text-accent': undefined,
    info: '#FFE0B2', // orange-lighten-4
    'on-info': '#000000',
    'text-info': '#993500',
    success: '#B9F6CA', // green-accent-1
    'on-success': '#000000',
    'text-success': '#1B5E20', // green-darken-4
    error: '#b30000',
    'on-error': '#FFFFFF',
    'text-error': undefined,
    warning: '#880E4F', // pink-darken-4
    'on-warning': '#FFFFFF',
    'text-warning': undefined,
    admin: '#b30000',
    'on-admin': '#FFFFFF',
    'text-admin': undefined,
  },
  hcDark: false,
  hcDarkColors: {
    background: '#121212',
    'on-background': '#FFFFFF', // white
    surface: '#121212',
    'on-surface': '#FFFFFF', // white
    primary: '#0D47A1', // blue-darken-4
    'on-primary': '#FFFFFF', // white
    'text-primary': '#42A5F5', // blue-lighten-1
    secondary: '#BBDEFB', // blue-lighten-4
    'on-secondary': '#000000',
    'text-secondary': undefined,
    accent: '#1d44b3', // blue-accent-1
    'on-accent': '#FFFFFF',
    'text-accent': '#82B1FF',
    error: '#b30000',
    'on-error': '#FFFFFF',
    'text-error': '#FF8A80', // red-accent-1
    info: '#FFE0B2',
    'on-info': '#000000',
    'text-info': undefined,
    success: '#B9F6CA', // green-accent-1
    'on-success': '#000000',
    'text-success': undefined,
    warning: '#880E4F', // pink-darken-4
    'on-warning': '#FFFFFF',
    'text-warning': '#FF80AB', // pink-accent-1
    admin: '#b30000',
    'on-admin': '#FFFFFF',
    'text-admin': '#FFCDD2'
  },
}

const upgradeScript: UpgradeScript = {
  description: 'Upgrade sites definitions for more complete themes',
  async exec (db, debug) {
    for await (const site of db.collection('sites').find({ 'theme.hcDarkColors': { $exists: false } })) {
      debug(`update site (${site.host}${site.path || ''})`)

      const theme = { ...defaultTheme }
      if (site.theme?.logo) theme.logo = site.theme.logo
      theme.colors.primary = site.theme.primaryColor ?? site.theme.colors.primary ?? theme.colors.primary

      await db.collection('sites').updateOne({ _id: site._id }, { $set: { theme }, $unset: { logo: 1 } })
    }
  }
}

export default upgradeScript
