export default () => ({
  state: {
    customPrimaryColor: null
  },
  getters: {
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
