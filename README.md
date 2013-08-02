struct.js
=========

C-Like Struct for JavaScript


### Usage
 ```javascript
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

  
/**
 * write arraybuffer from javascript object
 */

var ab = struct.write();
// => ArrayBuffer {byteLength: 4, slice: function}


/**
 * read data object from arraybuffer
 *
 * arg1 = arraybuffer
 */

struct.read(ab);
// => Obejct {foo: 0, bar: 127, baz: {qux: 65535}}


/**
 * update data with write and read
 *
 * arg1 = object(optional)
 */

var ab2 = struct.write({foo: 255, baz: {qux: 0}};
// => ArrayBuffer {byteLength: 4, slice: function}

struct.read(ab2);
// => Obejct {foo: 255, bar: 127, baz: {qux: 0}}
```
Have fun!

### License

MIT <3
