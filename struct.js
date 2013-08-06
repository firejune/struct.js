/*!
 * C-Like Data Structure for JavaScript.
 *
 * @author Joon Kyoung (aka. Firejune)
 * @license MIT
 * @version 0.2.3
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
  };


  /** @method **/

  Struct.prototype = {
    read: function(arrayBuffer, offset) {
      var dv
        , that = this
        , endian = this.endian
        , defaultValue = this.defaultValue;

      if (arrayBuffer instanceof DataView) {
        dv = arrayBuffer;
      } else {
        dv = new DataView(arrayBuffer); 
      }

      this.offset = offset || 0;
  
      return align(this.struct, function(item, prop, struct) {
        var values = []
          , typed = item[0]
          , value = item[1]
          , bytes = item[2]
          , i = 0;
  
        while (i < bytes) {
          values[i] = dv['get' + capitalise(typed)](that.offset, endian);
          that.offset += typedefs[typed];
          i++;
        }
  
        if (isString(value) || isArray(value) || bytes > 1) {
          struct[prop] = isString(value) ? charCodeArrToStr(values) : values;
        } else {
          struct[prop] = values[0];
        }
      });
    },

    write: function(struct) {
      var dataView = new DataView(this.emptyBuffer)
        , endian = this.endian
        , offset = 0;
  
      if (struct != undefined) this.struct = update(this.struct, struct);
  
      align(this.struct, function(item) {
        var typed = item[0]
          , value = item[1]
          , bytes = item[2];

        if (isString(value) || isArray(value) || bytes > 1) {
          value = isString(value) && strToCharCodeArr(value) || value;
        } else {
          value = [value];
        }

        for (var i = 0; i < bytes; i++) {
          dataView['set' + capitalise(typed)](offset, value[i], endian);
          offset += typedefs[typed];
        }
      });

      return dataView.buffer;
    }
  };

  var typedefs = {
    int8   : 1, uint8  : 1,
    int16  : 2, uint16 : 2,
    int32  : 4, uint32 : 4,
    float32: 4, float64: 8
  };


  /** @private **/

  function isArray(a) {
    return (!!a) && (a.constructor === Array);
  }
  
  function isObject(a) {
    return (!!a) && (a.constructor === Object);
  }
  
  function isString(a) {
    return (!!a) && (a.constructor === String);
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
        if (isString(model[p])) {
          model[p] = [model[p], 0];
        }

        if (isObject(model[p])) {
          model[p] = update(model[p], obj[p]);
        } else {
          model[p][1] = obj[p];
        }
      }
    }
    return model;
  }

  function normalize(model, defaultValue) {
    return align(model, function(item, prop, struct) {
      var values = []
        , typed = (isArray(item) && item[0] || item).toLowerCase()
        , value = isString(item) ? defaultValue : item[1]
        , bytes = isArray(item) && item.length == 3 && item[2]
          || (isString(value) || isArray(value)) && value.length || 1;

      struct[prop] = [typed, value, bytes];
    });
  }

  function getByteLength(struct) {
    var byteLength = 0;

    align(struct, function(item) {
      byteLength += typedefs[item[0]] * item[2];
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
  
  
  /** @global **/

  global.Struct = Struct;


})(window);