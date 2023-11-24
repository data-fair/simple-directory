
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
  

  
    
    function anonymous2 (input) {
      // #/properties/authProviders/items
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["id"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"id\":"
      json += serializer.asString(obj["id"])
      }
    
      if (obj["title"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"title\":"
      json += serializer.asString(obj["title"])
      } else {
        throw new Error('"title" is required!')
      
      }
    if (obj['type'] === undefined) throw new Error('"type" is required!')

      return json + '}'
    }
  

    function anonymous1 (obj) {
      // #/properties/authProviders
  
    if (!Array.isArray(obj)) {
      throw new TypeError(`The value of '#/properties/authProviders' does not match schema definition.`)
    }
    const arrayLength = obj.length
  
    let jsonOutput = ''
  
      for (let i = 0; i < arrayLength; i++) {
        let json = ''
        json += anonymous2(obj[i])
        jsonOutput += json
        if (i < arrayLength - 1) {
          jsonOutput += ','
        }
      }
    return `[${jsonOutput}]`
  }

    function anonymous0 (input) {
      // #
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["_id"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"_id\":"
      json += serializer.asString(obj["_id"])
      } else {
        throw new Error('"_id" is required!')
      
      }
    
      if (obj["reducedPersonalInfoAtCreation"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"reducedPersonalInfoAtCreation\":"
      json += serializer.asBoolean(obj["reducedPersonalInfoAtCreation"])
      }
    
      if (obj["tosMessage"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"tosMessage\":"
      json += serializer.asString(obj["tosMessage"])
      }
    
      if (obj["authMode"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authMode\":"
      json += serializer.asString(obj["authMode"])
      } else {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authMode\":\"onlyBackOffice\""
      
      }
    
      if (obj["authOnlyOtherSite"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authOnlyOtherSite\":"
      json += serializer.asString(obj["authOnlyOtherSite"])
      }
    
      if (obj["authProviders"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authProviders\":"
      json += anonymous1(obj["authProviders"])
      }
    
      return json + '}'
    }
  
    const main = anonymous0
    
    

  module.exports = main