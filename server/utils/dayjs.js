const dayjs = require('dayjs')
require('dayjs/locale/de')
require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/fr')
require('dayjs/locale/it')
require('dayjs/locale/pt')
const localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat)
module.exports = dayjs
