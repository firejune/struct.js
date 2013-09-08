/*!
 * C-Like Data Structure for JavaScript.
 *
 * @author Joon Kyoung (aka. Firejune)
 * @license MIT
 * @version 0.5.2
 *
 */

// TODO: add options[, 'string convert']

(function(global, undefined) {

  "use strict";


  /**
   * @class Struct
   *
   * @param {object} struct
   * @param {*} value
   * @param {boolean} endian
   *
   */

  var Struct = function(struct, value, endian) {
    this.endian = endian == undefined && true || endian;
    this.defaultValue = value || 0;
    
    this.struct = normalize(struct, this.defaultValue);
    this.byteLength = getByteLength(this.struct);
    this.emptyBuffer = new ArrayBuffer(this.byteLength);

    this._debug = false;
    this._struct = {};
    /*
    console.log('STRUCT.CREATE, defaultValue:', this.defaultValue
      , 'byteLength:', this.byteLength
      , 'endian:', this.endian
      , 'struct:', this.struct);
    */
  };


  /** @method **/

  Struct.prototype = {
    update: function(struct) {
      this.struct = update(this.struct, struct);
      this.byteLength = getByteLength(this.struct);
      this.emptyBuffer = new ArrayBuffer(this.byteLength);

      return clone(this.struct);
    },

    read: function(arrayBuffer, offset) {
      var that = this
        , endian = this.endian
        , dv = arrayBuffer instanceof DataView && arrayBuffer || new DataView(arrayBuffer);

      this.offset = offset || 0;

      this._debug && console.info(
          'STRUCT.READ'
        , 'byteLength:', arrayBuffer.byteLength
        , 'readOffset:', this.offset
      );
  
      return align(this.struct, function(item, prop, struct) {
        var values = []
          , typed = item[0]
          , value = item[1]
          , length = item[2]
          , vary = item[3]
          , lengthTyped = 'uint8'
          , i = 0;
  
        if (isString(length)) {
          lengthTyped = length;
          length = value.byteLength || value.length;
        }

        if (vary === true) {
          length = dv['get' + capitalise(lengthTyped)](that.offset, endian) / typedefs[typed];
          that.offset += typedefs[lengthTyped];

          that._struct[prop + 'Size'] = [lengthTyped, length * typedefs[typed]];
          that._debug && console.log(prop + 'Size', that._struct[prop + 'Size'], that.offset);
        }

        if (isArrayBuffer(value)) {
          values = arrayBuffer.slice(that.offset, that.offset + length * typedefs[typed]);
          //console.log(arrayBuffer.byteLength, values.byteLength, length);
          that.offset += length * typedefs[typed];
        } else {
          while (i < length) {
            values[i] = dv['get' + capitalise(typed)](that.offset, endian);
            that.offset += typedefs[typed];
            i++;
          }
        }

        // for vary types
        if (isArrayBuffer(value) || isString(value) || isArray(value) || length > 1) {
          struct[prop] = isString(value) ? charCodeArrToStr(values) : values;
        } else {
          struct[prop] = values[0];
        }
        
        that._struct[prop] = [typed, struct[prop]];
        that._debug && console.log(prop, that._struct[prop], that.offset);
      });
      
      this.offset != this.emptyBuffer.byteLength && console.warn('Incorrect read buffer size');
    },

    write: function(struct) {
      var that = this
        , offset = 0
        , endian = this.endian;
  
      if (struct !== undefined) {
        this.update(struct);
      }

      var dataView = new DataView(this.emptyBuffer)
  
      this._debug && console.info(
          'STRUCT.WRITE'
        , 'byteLength:', this.byteLength
      );
  
      align(this.struct, function(item, prop) {
        var values = []
          , typed = item[0]
          , value = item[1]
          , length = item[2]
          , vary = item[3]
          , lengthTyped = 'uint8';

        if (isString(length)) {
          lengthTyped = length;
          length = value.byteLength || value.length;
        }

        if (vary === true) {
          dataView['set' + capitalise(lengthTyped)](offset, length * typedefs[typed], endian);
          offset += typedefs[lengthTyped];
          that._struct[prop + 'Size'] = [lengthTyped, length * typedefs[typed]];
          that._debug && console.log(prop + 'Size', that._struct[prop + 'Size'], offset);
        }

        that._struct[prop] = [typed, value];

        // for vary types
        if (isArrayBuffer(value) || isString(value) || isArray(value) || length > 1) {
          if (isArrayBuffer(value)) values = arrayBufferToArray(value, typed);
          if (isFunction(value)) values = [that.defaultValue];
          values = isString(value) && strToCharCodeArr(value) || value;
        } else {
          values = [value];
        }

        for (var i = 0; i < length; i++) {
          dataView['set' + capitalise(typed)](offset, values[i], endian);
          offset += typedefs[typed];
        }

        that._debug && console.log(prop, that._struct[prop], offset);
      });

      offset != this.emptyBuffer.byteLength && console.warn('Incorrect write buffer size');

      return dataView.buffer;
    }
  };

  var typedefs = {
    int8   : 1, uint8  : 1,
    int16  : 2, uint16 : 2,
    int32  : 4, uint32 : 4, float32: 4, 
    int64  : 8, uint64 : 8, float64: 8
  };


  /** @private **/

  function isArray(a) {
    return !!a && a === Array || a.constructor === Array;
  }

  function isObject(a) {
    return !!a && a === Object || a.constructor === Object;
  }
  
  function isNumber(a) {
    return !!a && a === Number || a.constructor === Number;
  }
  
  function isString(a) {
    return !!a && a === String || a.constructor === String;
  }
  
  function isFunction(a) {
    return !!a && a === Function || a.constructor === Function;
  }

  function isArrayBuffer(a) {
    return !!a && a === ArrayBuffer || a.constructor === ArrayBuffer;
  }

  function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function align(model, callback) {
    var struct = {};
    for (var p in model) {
      if (model.hasOwnProperty(p)) {
        var item = model[p];
        if (isObject(item)) {
          struct[p] = align(item, callback);
        } else {
          callback(item, p, struct);
        }
      }
    }
    return struct;
  }

  function update(model, obj) {
    for (var p in obj) {
      if (model.hasOwnProperty(p)) {
        if (isObject(model[p])) {
          model[p] = update(model[p], obj[p]);
        } else {
          model[p][1] = obj[p];
        }
      }
    }
    return model;
  }
  
  function clone(obj) {
    var struct = {}
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        struct[p] = obj[p];
      }
    }
    return struct;
  }

  function normalize(model, defaultValue) {
    return align(model, function(item, prop, struct) {
      var values = []
        // item이 배열이면 item[0] 아니면 item을 소문자로 변환
        , typed = (isArray(item) && item[0] || item).toLowerCase()
        // item이 그냥 스트링이면 기본값 아니면 item[1]
        , value = isString(item) ? defaultValue : item[1]
        // item이 배열이고 길이가 3이거나 더 길면 item[2]
        // value가 스트링이거나 배열이면  value.length
        // value가 버퍼배열이면 value.byteLength
        // 암것도 아니면 1
        , length = isArray(item) && item.length >= 3 && item[2]
          || (isString(value) || isArray(value) || isArrayBuffer(value)) && value.length
          || isArrayBuffer(value) && value.byteLength || 1
        // item이 배열이고 length가 스트링이거나 1보다 크면
        // length가 스트링이고 item[3]가 undefined이고 때 true 아니면 item[3]
        // 아니면 false
        , vary = isArray(item) && (isString(length) || length > 1)
          ? isString(length) && item[3] === undefined && true || item[3] : false;

      struct[prop] = [typed, value, length, vary];
    });
  }

  function getByteLength(struct) {
    var byteLength = 0;

    align(struct, function(item, prop) {
      var typed = item[0]
        , value = item[1]
        , length = item[2]
        , vary = item[3]
        , lengthTyped = 'uint8';

      if (isString(length)) {
        lengthTyped = length;
        length = value.byteLength || value.length;
      }

      if (vary === true) byteLength += typedefs[lengthTyped];

      byteLength += length * typedefs[typed];
    });

    return byteLength;
  }

  function strToCharCodeArr(str) {
    var arr = []
      , len = str.length
      , idx = 0;

    while (idx < len) {
      arr[idx] = str.charCodeAt(idx);
      idx++;
    }

    return arr;
  }

  function charCodeArrToStr(arr) {
    var str = []
      , len = arr.length
      , idx = 0;

    while (idx < len) {
      str[idx] = String.fromCharCode(arr[idx]);
      idx++;
    }

    return str.join('');
  }

  function arrayBufferToArray(buf, typed) {
    return Array.prototype.slice.call(new global[capitalise(typed) + 'Array'](buf));
  }

  /** support 64bit shim **/

  if (DataView.prototype.getUint64 === undefined &&
      DataView.prototype.setUint64 === undefined &&
      DataView.prototype.getInt64  === undefined &&
      DataView.prototype.setInt64  === undefined) {

    var TWO_PWR_16_DBL = 1 << 16;
    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

    var Long = function(low, high, unsigned) {
      this.low = low | 0;
      this.high = high | 0;
      this.unsigned = !!unsigned;
    };

    Long.prototype = {
      equals: function(other) {
        if (this.unsigned != other.unsigned && (this.high >>> 31) != (other.high >>> 31)) return false;
        return (this.high == other.high) && (this.low == other.low);
      },

      not: function() {
        return Long.fromBits(~this.low, ~this.high, this.unsigned);
      },
  
      add: function(other) {
        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
          
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
  
        var b48 = other.high >>> 16;
        var b32 = other.high & 0xFFFF;
        var b16 = other.low >>> 16;
        var b00 = other.low & 0xFFFF;
  
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
  
        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
      },
  
      negate: function() {
        if (!this.unsigned && this.equals(Long.MIN_SIGNED_VALUE)) return Long.MIN_SIGNED_VALUE;
        return this.not().add(Long.ONE);
      },
  
      toInt: function() {
        return this.unsigned ? this.low >>> 0 : this.low;
      },
      
      getHighBitsUnsigned: function() {
        return this.high >>> 0;
      },
  
      getLowBitsUnsigned: function() {
        return this.low >>> 0;
      },
  
      getLowBits: function() {
        return this.low;
      },
  
      getHighBits: function() {
        return this.high;
      }
    };


    Long.fromBits = function(lowBits, highBits, unsigned) {
      return new Long(lowBits, highBits, unsigned);
    };

    Long.fromInt = function(value, unsigned) {
      if (!unsigned) {
        value = value | 0;
        return new Long(value, value < 0 ? -1 : 0, false);
      } else {
        value = value >>> 0;
        return new Long(value, (value | 0) < 0 ? -1 : 0, true);
      }
    };

    Long.fromNumber = function(value, unsigned) {
      unsigned = !!unsigned;

      if (isNaN(value) || !isFinite(value)) {
        return Long.ZERO;
      } else if (!unsigned && value <= -TWO_PWR_63_DBL) {
        return Long.MIN_SIGNED_VALUE;
      } else if (unsigned && value <= 0) {
        return Long.MIN_UNSIGNED_VALUE;
      } else if (!unsigned && value + 1 >= TWO_PWR_63_DBL) {
        return Long.MAX_SIGNED_VALUE;
      } else if (unsigned && value >= TWO_PWR_64_DBL) {
        return Long.MAX_UNSIGNED_VALUE;
      } else if (value < 0) {
        return Long.fromNumber(-value, false).negate();
      } else {
        return new Long((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
      }
    };

    Long.ZERO = Long.fromInt(0);
    Long.ONE = Long.fromInt(1);

    Long.MAX_SIGNED_VALUE = Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
    Long.MAX_UNSIGNED_VALUE = Long.fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
    Long.MIN_SIGNED_VALUE = Long.fromBits(0, 0x80000000 | 0, false);
    Long.MIN_UNSIGNED_VALUE = Long.fromBits(0, 0, true);


    DataView.prototype.getUint64 = function(offset, littleEndian) {
      var value;
      if (littleEndian) {
        value = Long.fromBits(this.getUint32(offset, true), this.getUint32(offset + 4, true), true);
      } else {
        value = Long.fromBits(this.getUint32(offset + 4, false), this.getUint32(offset, false), true);
      }
      return value.toInt();
    };

    DataView.prototype.setUint64 = function(offset, value, littleEndian) {
      value = Long.fromNumber(value, true);

      if (littleEndian) {
        this.setUint32(offset, value.getLowBitsUnsigned(), true);
        this.setUint32(offset + 4, value.getHighBitsUnsigned(), true);
      } else {
        this.setUint32(offset, value.getHighBitsUnsigned(), false);
        this.setUint32(offset + 4, value.getLowBitsUnsigned(), false);
      }
    };

    DataView.prototype.getInt64 = function(offset, littleEndian) {
      var value;
      if (littleEndian) {
        value = Long.fromBits(this.getInt32(offset, true), this.getInt32(offset + 4, true), false);
      } else {
        value = Long.fromBits(this.getInt32(offset + 4, false), this.getInt32(offset, false), false);
      }
      return value.toInt();
    };

    DataView.prototype.setInt64 = function(offset, littleEndian) {
      value = Long.fromNumber(value, false);
      if (littleEndian) {
        this.setInt32(offset, value.getLowBits(), true);
        this.setInt32(offset + 4, value.getHighBits(), true);
      } else {
        this.setInt32(offset, value.getHighBits(), false);
        this.setInt32(offset + 4, value.getLowBits(), false);
      }
    };
  }
  
  /** @global **/

  global.Struct = Struct;


})(window);
