/*!
 * C-Like Struct for JavaScript
 *
 * @author Joon Kyoung (aka. Firejune)
 * @license MIT
 * @version 0.1.0
 *
 */
 
(function(exports) {

  var typedefs = {
    int8 : 1, uint8 : 1,
    int16: 2, uint16: 2,
    int32: 4, uint32: 4, float32: 4,
    float64: 8
  };

  function forEach(model, callback) {
    for (var key in model) {
      if (isObject(model[key]))
        forEach(model[key], callback);
      else
        callback(model[key]);
    }
  }

  function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getByteLength(struct) {
    var byteLength = 0;

    forEach(struct, function(item) {
      byteLength += typedefs[item[0]];
    });
    
    return byteLength;
  }

  function isArray(a) {
    return (!!a) && (a.constructor === Array);
  }
  
  function isObject(a) {
    return (!!a) && (a.constructor === Object);
  }
  
  function isString(a) {
    return (!!a) && (a.constructor === String);
  }


  var Struct = function(struct, value, endian) {
    this.struct = struct;
    this.defaultValue = value || 0;
    this.endian = endian == undefined ? true : endian;
  };

  Struct.prototype = {
    _align: function(model, dv) {
      var struct = {};
  
      for (var key in model) {
        if (isObject(model[key])) {
          struct[key] = this._align(model[key], dv);
        } else {
          var typedef = isArray(model[key]) ? model[key][0] : model[key];
          struct[key] = dv['get' + capitalise(typedef)](this.offset, this.endian);
          this.offset += typedefs[typedef];
        }
      }
  
      return struct;
    },
    read: function(arrayBuffer, offset) {
      var dataView;
      if (arrayBuffer instanceof DataView) {
        dataView = arrayBuffer;
      } else {
        dataView = new DataView(arrayBuffer); 
      }

      this.offset = offset || 0;
      return this._align(this.struct, dataView);
    },
    write: function() {
      var byteLength = getByteLength(this.struct)
        , arrayBuffer = new ArrayBuffer(byteLength)
        , dataView = new DataView(arrayBuffer)
        , defaultValue = this.defaultValue
        , endian = this.endian
        , offset = 0;
  
      forEach(this.struct, function(item) {
        var typedef = isString(item) ? item : item[0]
          , value = isString(item) ? defaultValue : item[1];
  
        dataView['set' + capitalise(typedef)](offset, value, endian);
        offset += typedefs[typedef];
      });
      
      return dataView.buffer;
    }
  };
  
  exports.Struct = Struct;

})(window);