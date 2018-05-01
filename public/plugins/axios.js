
export default ({$axios, app}) => {
  // Send the current locale to the server using Accept-Language header, so
  // that server side texts (error messages, emails, etc.) can be internationalized too
  $axios.defaults.headers.common['Accept-Language'] = app.i18n.locale
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    $axios.defaults.headers.common['Accept-Language'] = newLocale
  }
}
