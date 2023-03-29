
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
  

  
    
    function anonymous3 (input) {
      // https://github.com/data-fair/simple-directory/site#/properties/owner
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["type"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"type\":"
      json += serializer.asString(obj["type"])
      } else {
        throw new Error('"type" is required!')
      
      }
    
      if (obj["id"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"id\":"
      json += serializer.asString(obj["id"])
      } else {
        throw new Error('"id" is required!')
      
      }
    
      if (obj["name"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"name\":"
      json += serializer.asString(obj["name"])
      } else {
        throw new Error('"name" is required!')
      
      }
    
      if (obj["department"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"department\":"
      json += serializer.asString(obj["department"])
      }
    
      if (obj["departmentName"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"departmentName\":"
      json += serializer.asString(obj["departmentName"])
      }
    
      return json + '}'
    }
  

    function anonymous4 (input) {
      // https://github.com/data-fair/simple-directory/site#/properties/theme
  
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
  

    function anonymous6 (input) {
      // https://github.com/data-fair/simple-directory/site#/properties/authProviders/items
  
      const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
      let json = '{'
      let addComma = false
  
      if (obj["title"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"title\":"
      json += serializer.asString(obj["title"])
      } else {
        throw new Error('"title" is required!')
      
      }
    
      if (obj["color"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"color\":"
      json += serializer.asString(obj["color"])
      }
    
      if (obj["img"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"img\":"
      json += serializer.asString(obj["img"])
      }
    if (obj['type'] === undefined) throw new Error('"type" is required!')

    const propertiesKeys = ["title","color","img"]
    for (const [key, value] of Object.entries(obj)) {
      if (
        propertiesKeys.includes(key) ||
        value === undefined ||
        typeof value === 'function' ||
        typeof value === 'symbol'
      ) continue
  
        !addComma && (addComma = true) || (json += ',')
        json += serializer.asString(key) + ':' + JSON.stringify(value)
      
    }
  
      return json + '}'
    }
  

    function anonymous5 (obj) {
      // https://github.com/data-fair/simple-directory/site#/properties/authProviders
  
    if (!Array.isArray(obj)) {
      throw new TypeError(`The value of 'https://github.com/data-fair/simple-directory/site#/properties/authProviders' does not match schema definition.`)
    }
    const arrayLength = obj.length
  
    let jsonOutput = ''
  
      for (let i = 0; i < arrayLength; i++) {
        let json = ''
        json += anonymous6(obj[i])
        jsonOutput += json
        if (i < arrayLength - 1) {
          jsonOutput += ','
        }
      }
    return `[${jsonOutput}]`
  }

    function anonymous2 (input) {
      // https://github.com/data-fair/simple-directory/site#
  
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
    
      if (obj["owner"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"owner\":"
      json += anonymous3(obj["owner"])
      } else {
        throw new Error('"owner" is required!')
      
      }
    
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
      json += anonymous4(obj["theme"])
      } else {
        throw new Error('"theme" is required!')
      
      }
    
      if (obj["logo"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"logo\":"
      json += serializer.asString(obj["logo"])
      }
    
      if (obj["authMode"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authMode\":"
      json += serializer.asString(obj["authMode"])
      } else {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authMode\":\"onlyBackOffice\""
      
      }
    
      if (obj["authProviders"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"authProviders\":"
      json += anonymous5(obj["authProviders"])
      }
    
    const propertiesKeys = ["_id","owner","host","theme","logo","authMode","authProviders"]
    for (const [key, value] of Object.entries(obj)) {
      if (
        propertiesKeys.includes(key) ||
        value === undefined ||
        typeof value === 'function' ||
        typeof value === 'symbol'
      ) continue
  
        !addComma && (addComma = true) || (json += ',')
        json += serializer.asString(key) + ':' + JSON.stringify(value)
      
    }
  
      return json + '}'
    }
  

    function anonymous1 (obj) {
      // #/properties/results
  
    if (!Array.isArray(obj)) {
      throw new TypeError(`The value of '#/properties/results' does not match schema definition.`)
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
  
      if (obj["count"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"count\":"
      json += serializer.asInteger(obj["count"])
      } else {
        throw new Error('"count" is required!')
      
      }
    
      if (obj["results"] !== undefined) {
        !addComma && (addComma = true) || (json += ',')
        json += "\"results\":"
      json += anonymous1(obj["results"])
      } else {
        throw new Error('"results" is required!')
      
      }
    
      return json + '}'
    }
  
    const main = anonymous0
    
    

  module.exports = main