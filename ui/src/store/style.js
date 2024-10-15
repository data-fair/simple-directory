import tinycolor from 'tinycolor2'

const isDark = (color) => tinycolor(color).getLuminance() < 0.4

// calculate a variant of a color with guaranteed readability
// default background is #FAFAFA the light grey background
const contrastColorCache = {}
const contrastColor = (color1, color2 = '#FAFAFA', color3) => {
  if (!color1) return
  const cacheKey = JSON.stringify([color1, color2, color3])
  if (contrastColorCache[cacheKey]) return contrastColorCache[cacheKey]
  const c = tinycolor(color1)
  const dark = isDark(color2)
  while (!tinycolor.isReadable(c, color2, { level: 'AA', size: 'small' }) || !tinycolor.isReadable(c, color3 || color2, { level: 'AA', size: 'small' })) {
    if (dark) {
      c.brighten(1)
    } else {
      c.darken(1)
    }
  }
  contrastColorCache[cacheKey] = c.toString()
  return contrastColorCache[cacheKey]
}

export default () => ({
  state: {
    customPrimaryColor: null
  },
  getters: {
    contrastColor () {
      return (color1, color2, color3) => contrastColor(color1, color2, color2)
    },
    readablePrimaryColor (state, getters, rootState) {
      return state.customPrimaryColor && contrastColor(state.customPrimaryColor)
    },
    darkReadablePrimary10 (state, getters, rootState) {
      return getters.readablePrimaryColor && tinycolor(getters.readablePrimaryColor).darken(10).toHexString()
    },
    style (state, getters, rootState) {
      if (!state.customPrimaryColor) return ''
      return `
      .v-application#app a:not(.v-tab):not(.v-list-item):not(.v-card--link):not(.v-btn--has-bg) {
        color: ${getters.readablePrimaryColor};
      }
      .v-application#app a:not(.v-tab):not(.v-list-item):not(.v-card--link):not(.v-btn--has-bg):hover {
        color: ${getters.darkReadablePrimary10};
      }
      .v-application#app .area--dark a,
      .v-application#app .area--dark a:not(.v-tab):not(.v-list-item):not(.v-card--link),
      .v-application#app .area--dark a:not(.v-tab):not(.v-list-item):not(.v-card--link):hover,
      .v-application#app .area--dark h3,
      .v-application#app .area--dark span {
        color: white;
      }
      .v-application#app .v-btn:not(.v-btn--outlined).primary,
      .v-application#app .v-btn:not(.v-btn--outlined).secondary,
      .v-application#app .v-btn:not(.v-btn--outlined).accent,
      .v-application#app .v-btn:not(.v-btn--outlined).success,
      .v-application#app .v-btn:not(.v-btn--outlined).error,
      .v-application#app .v-btn:not(.v-btn--outlined).warning,
      .v-application#app .v-btn:not(.v-btn--outlined).info {
        color: white;
      }
      .v-application#app .theme--dark.v-list a {
        color: white;
      }
      .v-application#app .area--light a:not(.v-tab):not(.v-list-item),
      .v-application#app .area--light h3,
      .v-application#app .area--light span,
      .v-application#app .area--light .v-tabs-bar.primary .v-tab--active {
        color: ${getters.readablePrimaryColor}!important;
      }
      .v-application#app .primary--text {
        color: ${getters.readablePrimaryColor}!important;
      }
      .v-application#app .primary-darker--text {
        color: ${getters.darkReadablePrimary10}!important;
      }
        `
    }
  }
})
