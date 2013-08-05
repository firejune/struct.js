/*!
 * C-Like Data Structure for JavaScript.
 *
 * @author Joon Kyoung (aka. Firejune)
 * @license MIT
 * @version 0.2.1
 *
 */
 
(function(global, undefined) {
  "use strict";

  var typedefs = {
    int8   : 1, uint8  : 1,
    int16  : 2, uint16 : 2,
    int32  : 4, uint32 : 4,
    float32: 4, float64: 8
  };

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

  function align(model, callback) {
    for (var p in model) {
      if (model.hasOwnProperty(p)) {
        var item = model[p];
        if (isObject(item)) {
          align(item, callback);
        } else {
          var value = isString(item) ? undefined : item[1];
          callback(item, {
            value: value,
            typed: (isArray(item) && item[0] || item).toLowerCase(),
            bytes: isArray(item) && item.length == 3 && item[2]
              || (isString(value) || isArray(value)) && value.length || 1
          });
        }
      }
    }
  }

  function make(model, dv, that) {
    var struct = {}
      , endian = that.endian
      , defaultValue = that.defaultValue;

    for (var p in model) {
      if (model.hasOwnProperty(p)) {
        var item = model[p];
        if (isObject(item)) {
          struct[p] = make(item, dv, that);
        } else {
          var values = []
            , typed = (isArray(item) && item[0] || item).toLowerCase()
            , value = isString(item) ? defaultValue : item[1]
            , bytes = isArray(item) && item.length == 3 && item[2]
              || (isString(value) || isArray(value)) && value.length || 1;

          for (var i = 0; i < bytes; i++) {
            values[i] = dv['get' + capitalise(typed)](that.offset, endian);
            that.offset += typedefs[typed];
          }

          if (isString(value) || isArray(value) || bytes > 1) {
            struct[p] = isString(value) ? charCodeArrToStr(values) : values;
          } else {
            struct[p] = values[0];
          }
        }
      }
    }

    return struct;
  }

  function getByteLength(struct) {
    var byteLength = 0;

    align(struct, function(item, p) {
      byteLength += typedefs[p.typed] * p.bytes;
    });
   
    return byteLength;
  }

  function strToCharCodeArr(str) {
    var arr = [];

    for (var i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);   
    }

    return arr;
  }

  function charCodeArrToStr(arr) {
    var str = [];

    for (var i = 0; i < arr.length; i++) {
      str[i] = String.fromCharCode(arr[i]);
    }

    return str.join('');
  }

  var Struct = function(struct, value, endian) {
    this.struct = struct;
    this.defaultValue = value || 0;
    this.byteLength = getByteLength(struct);
    this.emptyBuffer = new ArrayBuffer(this.byteLength);
    this.endian = endian == undefined && true || endian;
  };

  Struct.prototype = {
    read: function(arrayBuffer, offset) {
      var dataView;
      if (arrayBuffer instanceof DataView) {
        dataView = arrayBuffer;
      } else {
        dataView = new DataView(arrayBuffer); 
      }

      this.offset = offset || 0;
      return make(this.struct, dataView, this);
    },

    write: function(struct) {
      var dataView = new DataView(this.emptyBuffer)
        , defaultValue = this.defaultValue
        , endian = this.endian
        , offset = 0;
  
      if (struct != undefined) this.struct = update(this.struct, struct);
  
      align(this.struct, function(item, p) {
        var value = p.value === undefined ? defaultValue : p.value
          , typed = p.typed
          , bytes = p.bytes;

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
  
  global.Struct = Struct;


})(window);