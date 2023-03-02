
  'use strict'
  

// eslint-disable-next-line
const STR_ESCAPE = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]|[\ud800-\udbff](?![\udc00-\udfff])|(?:[^\ud800-\udbff]|^)[\udc00-\udfff]/

class Serializer {
  constructor (options) {
    switch (options && options.rounding) {
      case 'floor':
        this.parseInteger = Math.floor
        break
      case 'ceil':
        this.parseInteger = Math.ceil
        break
      case 'round':
        this.parseInteger = Math.round
        break
      case 'trunc':
      default:
        this.parseInteger = Math.trunc
        break
    }
  }

  asInteger (i) {
    if (typeof i === 'number') {
      if (i === Infinity || i === -Infinity) {
        throw new Error(`The value "${i}" cannot be converted to an integer.`)
      }
      if (Number.isInteger(i)) {
        return '' + i
      }
      if (Number.isNaN(i)) {
        throw new Error(`The value "${i}" cannot be converted to an integer.`)
      }
      return this.parseInteger(i)
    } else if (i === null) {
      return '0'
    } else if (typeof i === 'bigint') {
      return i.toString()
    } else {
      /* eslint no-undef: "off" */
      const integer = this.parseInteger(i)
      if (Number.isFinite(integer)) {
        return '' + integer
      } else {
        throw new Error(`The value "${i}" cannot be converted to an integer.`)
      }
    }
  }

  asNumber (i) {
    const num = Number(i)
    if (Number.isNaN(num)) {
      throw new Error(`The value "${i}" cannot be converted to a number.`)
    } else if (!Number.isFinite(num)) {
      return null
    } else {
      return '' + num
    }
  }

  asBoolean (bool) {
    return bool && 'true' || 'false' // eslint-disable-line
  }

  asDateTime (date) {
    if (date === null) return '""'
    if (date instanceof Date) {
      return '"' + date.toISOString() + '"'
    }
    if (typeof date === 'string') {
      return '"' + date + '"'
    }
    throw new Error(`The value "${date}" cannot be converted to a date-time.`)
  }

  asDate (date) {
    if (date === null) return '""'
    if (date instanceof Date) {
      return '"' + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10) + '"'
    }
    if (typeof date === 'string') {
      return '"' + date + '"'
    }
    throw new Error(`The value "${date}" cannot be converted to a date.`)
  }

  asTime (date) {
    if (date === null) return '""'
    if (date instanceof Date) {
      return '"' + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(11, 19) + '"'
    }
    if (typeof date === 'string') {
      return '"' + date + '"'
    }
    throw new Error(`The value "${date}" cannot be converted to a time.`)
  }

  asString (str) {
    if (typeof str !== 'string') {
      if (str === null) {
        return '""'
      }
      if (str instanceof Date) {
        return '"' + str.toISOString() + '"'
      }
      if (str instanceof RegExp) {
        str = str.source
      } else {
        str = str.toString()
      }
    }

    // Fast escape chars check
    if (!STR_ESCAPE.test(str)) {
      return '"' + str + '"'
    } else if (str.length < 42) {
      return this.asStringSmall(str)
    } else {
      return JSON.stringify(str)
    }
  }

  // magically escape strings for json
  // relying on their charCodeAt
  // everything below 32 needs JSON.stringify()
  // every string that contain surrogate needs JSON.stringify()
  // 34 and 92 happens all the time, so we
  // have a fast case for them
  asStringSmall (str) {
    const l = str.length
    let result = ''
    let last = 0
    let found = false
    let surrogateFound = false
    let point = 255
    // eslint-disable-next-line
    for (var i = 0; i < l && point >= 32; i++) {
      point = str.charCodeAt(i)
      if (point >= 0xD800 && point <= 0xDFFF) {
        // The current character is a surrogate.
        surrogateFound = true
      }
      if (point === 34 || point === 92) {
        result += str.slice(last, i) + '\\'
        last = i
        found = true
      }
    }

    if (!found) {
      result = str
    } else {
      result += str.slice(last)
    }
    return ((point < 32) || (surrogateFound === true)) ? JSON.stringify(str) : '"' + result + '"'
  }
}

  
  const serializer = new Serializer()
  

  
    
    function anonymous1 (input) {
      // https://github.com/data-fair/simple-directory/site#/definitions/theme
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["primaryColor"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"primaryColor\":"
      json += serializer.asString(obj["primaryColor"])
      } else {
        throw new Error('"primaryColor" is required!')
      
      }
    
      return json + '}'
    }
  

    function anonymous0 (input) {
      // #
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["host"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"host\":"
      json += serializer.asString(obj["host"])
      } else {
        throw new Error('"host" is required!')
      
      }
    
      if (obj["theme"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"theme\":"
      json += anonymous1(obj["theme"])
      } else {
        throw new Error('"theme" is required!')
      
      }
    
      return json + '}'
    }
  
    const main = anonymous0
    
    

  module.exports = main