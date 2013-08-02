/*!
 * C-Like Struct for JavaScript
 *
 * @author Joon Kyoung (aka. Firejune)
 * @license MIT
 * @version 0.1.1
 *
 */
 
(function(exports, undefined) {

  var typedefs = {
    int8 : 1, uint8 : 1,
    int16: 2, uint16: 2,
    int32: 4, uint32: 4, float32: 4,
    float64: 8
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
    for (var key in model) {
      if (model.hasOwnProperty(key)) {
        if (isObject(model[key])) {
          align(model[key], callback);
        } else {
          callback(model[key], key);
        }
      }
    }
  }

  function make(model, dv, that) {
    var struct = {};

    for (var key in model) {
      if (model.hasOwnProperty(key)) {
        if (isObject(model[key])) {
          struct[key] = make(model[key], dv, that);
        } else {
          var typed = (isArray(model[key]) ? model[key][0] : model[key]).toLowerCase();
          struct[key] = dv['get' + capitalise(typed)](that.offset, that.endian);
          that.offset += typedefs[typed];
        }
      }
    }

    return struct;
  }

  function getByteLength(struct) {
    var byteLength = 0;

    align(struct, function(item) {
      var typed = (isString(item) ? item : item[0]).toLowerCase();
      byteLength += typedefs[typed];
    });
   
    return byteLength;
  }

  var Struct = function(struct, value, endian) {
    this.struct = struct;
    this.defaultValue = value || 0;
    this.emptyBuffer = new ArrayBuffer(getByteLength(struct));
    this.endian = endian == undefined ? true : endian;
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
  
      align(this.struct, function(item) {
        var typed = (isString(item) ? item : item[0]).toLowerCase()
          , value = isString(item) ? defaultValue : item[1];

        dataView['set' + capitalise(typed)](offset, value, endian);
        offset += typedefs[typed];
      });
      
      return dataView.buffer;
    }
  };
  
  exports.Struct = Struct;

})(window);
