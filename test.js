(function() {

"use strict";

try {
  /**
   * create struct
   *
   * arg1 = data object
   * arg2 = default value(optional, default 0)
   * arg3 = endian(optional, default true)
   */
  
  var struct = new Struct({
    foo: 'uint8',
    bar: ['int8', 127],
    baz: {
      qux: ['uint16', 65535]
    }
  }, 0, true);

  if (!struct instanceof Struct) {
    //throw new Error("returned wrong data type");
  }

  if (struct.byteLength !== 4 || !struct instanceof Object) {
    throw new Error("wrong property of instance of struct");
  }

  
  /**
   * write arraybuffer from javascript object
   *
   * arg1 = object(optional)
   */
  
  var ab = struct.write();
  // => ArrayBuffer {byteLength: 4, slice: function}

  if (!ab instanceof ArrayBuffer) {
    throw new Error("returned wrong data type");
  }

  if (ab.byteLength !== 4) {
    throw new Error("wrong byteLength of arrayBuffer");
  }
 
  
  /**
   * read data object from arraybuffer
   *
   * arg1 = arraybuffer
   * arg2 = offset(optinal, default 0)
   */
  
  var obj = struct.read(ab);
  // => Obejct {foo: 0, bar: 127, baz: {qux: 65535}}

  if (!obj instanceof Object) {
    throw new Error("returned wrong data type");
  }

  if (obj.foo !== 0 || obj.bar !== 127 || obj.baz.qux !== 65535) {
    console.log(obj);
    throw new Error("wrong data object value");
  }

  
  /**
   * update data of arrayBuffer with write and read
   */
  
  ab = struct.write({foo: 255, baz: {qux: 0}});
  // => ArrayBuffer {byteLength: 4, slice: function}

  if (!ab instanceof ArrayBuffer) {
    throw new Error("returned wrong data type");
  }

  if (ab.byteLength !== 4) {
    throw new Error("wrong byteLength of arrayBuffer");
  }

  
  obj = struct.read(ab);
  // => Obejct {foo: 255, bar: 127, baz: {qux: 0}}
  
  if (!obj instanceof Object) {
    throw new Error("returned wrong data type");
  }

  if (obj.foo !== 255 || obj.bar !== 127 || obj.baz.qux !== 0) {
    console.log(obj);
    throw new Error("wrong data object value");
  }

  /**
   * create struct with multi-byte value
   */

  struct = new Struct({
    foo: ['uint16', [0xffff, 4095]],
    bar: ['uint8', 'firejune', 8]
  });
  
  ab = struct.write();
  // => ArrayBuffer {byteLength: 12, slice: function}

  if (!ab instanceof ArrayBuffer) {
    throw new Error("returned wrong data type");
  }

  if (ab.byteLength !== 12) {
    throw new Error("wrong byteLength of arrayBuffer");
  }


  obj = struct.read(ab);
  // => Object {bar: [65535, 4095], qux: "firejune"}
  
  if (!obj instanceof Object) {
    throw new Error("returned wrong data type");
  }

  if (obj.foo[0] !== 65535 || obj.foo[1] !== 4095 || obj.bar !== 'firejune') {
    console.log(obj);
    throw new Error("wrong data object value");
  }



  console.log("All tests OK!");
}

catch (e) {
  console.error("Test failed: " + e.message);
}

})();