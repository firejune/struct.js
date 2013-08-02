struct.js
=========

C-Like Struct for JavaScript


### Usage

    /**
     * write arraybuffer from javascript object
     *
     * arg1 = data object
     * arg2 = default value(optional default 0)
     * arg3 = endian(optional, default true)
     */

    var struct = new Struct({
      foo: ['uint8', 255], // foo 키에 값이 255로 할당 됨
      bar: ['int8', 127], 
      baz: {
        qux: ['uint16', 65535] // 값을 지정하지 않는 경우 기본값이 설정됨
      }
    }, 0, true);
      
    var ab = struct.write(); // return ArrayBuffer
    console.log(ab);
    // => ArrayBuffer {byteLength: 4, slice: function};


    /**
     * read data from arraybuffer
     *
     * arg1 = arraybuffer
     */

    var data = struct.read(ab);
    console.log(data);
    // => Obejct {foo: 255, bar: 127, baz: {qux: 65535}}
    
    
Have fun!

### License

MIT <3