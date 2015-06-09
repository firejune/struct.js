struct.js
=========

C-Like Data Structure for JavaScript.
* Inherit vary type struct
* Support vary arrayBuffer byte length
* Support 64-bit typed arrayBuffer
* Support multiple typed array
* Support assign multi-byte typed arrays as one property
* Calculate offset automatically
* Convert javascript data structure to arrayBuffer
* Convert arrayBuffer to javascript data structure
* Recycling of javascript structure
* Cool updating values of arrayBuffer
* Auto convert string to charCode
* Auto convert charCode to string
* Teeny tiny library
* Super easy to use

### Why?
The syntax of handle straight binary is not elegant in javascript.
```javascript
// define struct
var struct = {
  foo: 0,
  bar: 127,
  baz: {
    qux: 65535
  }
};

// write arraybuffer from javascript object
var ab = new ArrayBuffer(4);
var dv = new DataView(ab);
dv.setUint8(0, struct.foo);
dv.setInt8(1, struct.bar);
dv.setUint16(2, struct.baz.qux, true);

console.log(dv.buffer);
// => ArrayBuffer {byteLength: 4, slice: function}

// read data from arraybuffer
var dv2 = new DataView(dv.buffer);
var data = {
  foo: dv2.getUint8(0),
  bar: dv2.getInt8(1),
  baz: {
    qux: dv2.getUint16(2, true)
  }
};

console.log(data);
// => Obejct {foo: 0, bar: 127, baz: {qux: 65535}}
```

### With struct.js
More sexy things for handle straight binary in javascript.
```javascript
/**
 * create struct
 *
 * @param {object} data object
 * @param {number} default value[optional, default 0]
 * @param {boolean} endian[optional, default true]
 */

var struct = new Struct({
  foo: 'uint8',
  bar: ['int8', 127],
  baz: {
    qux: ['uint16', 65535]
  }
}, 0, true);

  
/**
 * write arraybuffer from javascript object
 *
 * @param {object} for update[optional]
 */

var ab = struct.write();
// => ArrayBuffer {byteLength: 4, slice: function}


/**
 * read data object from arraybuffer
 *
 * @param {object} arraybuffer
 * @param {number} offset[optinal, default 0]
 */

struct.read(ab);
// => Obejct {foo: 0, bar: 127, baz: {qux: 65535}}


/**
 * update data of arrayBuffer with write and read methods
 */

var ab2 = struct.write({foo: 255, baz: {qux: 0}});
// => ArrayBuffer {byteLength: 4, slice: function}

struct.read(ab2);
// => Obejct {foo: 255, bar: 127, baz: {qux: 0}}
```

Using custom offset for multiple binary:
```javascript
/**
 * read data with custom offset
 */

var struct = new Struct({
  sig: 'uint8',
  mimeType: 'uint8',
  id: 'uint16',
  byteLength: 'uint32'
});

...

function parseBinary(count, chunk, callback) {
  var offset = 0;
  for (var index = 0; index < count; index++) {
    var meta = struct.read(chunk, offset)
      , buffer = chunk.slice(
        offset += struct.byteLength,
        offset += meta.byteLength
      );

    callback(meta, new Uint8Array(buffer));
  }
}
```

Assign multi-byte typed array and convert string automatically:
```javascript
/**
 * create struct with multi-byte value
 */

var struct = new Struct({
  foo: ['uint16', [0xffff, 4095]],
  bar: ['uint8', 'firejune', 8]
});

var ab = struct.write();
// => ArrayBuffer {byteLength: 12, slice: function}

var obj = struct.read(ab);
// => Object {bar: [65535, 4095], qux: "firejune"}
```
Have fun!


### License

The MIT License

Copyright (c) 2013 firejune (http://firejune.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
