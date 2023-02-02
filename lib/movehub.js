(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict'

    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray

    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63

    function getLens (b64) {
      var len = b64.length

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // Trim off extra bytes after placeholder bytes are found
      // See: https://github.com/beatgammit/base64-js/issues/42
      var validLen = b64.indexOf('=')
      if (validLen === -1) validLen = len

      var placeHoldersLen = validLen === len
        ? 0
        : 4 - (validLen % 4)

      return [validLen, placeHoldersLen]
    }

// base64 is 4/3 + up to two characters of the original data
    function byteLength (b64) {
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }

    function _byteLength (b64, validLen, placeHoldersLen) {
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }

    function toByteArray (b64) {
      var tmp
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]

      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

      var curByte = 0

      // if there are placeholders, only get up to the last complete 4 chars
      var len = placeHoldersLen > 0
        ? validLen - 4
        : validLen

      var i
      for (i = 0; i < len; i += 4) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 18) |
          (revLookup[b64.charCodeAt(i + 1)] << 12) |
          (revLookup[b64.charCodeAt(i + 2)] << 6) |
          revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xFF
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }

      if (placeHoldersLen === 2) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 2) |
          (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xFF
      }

      if (placeHoldersLen === 1) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 10) |
          (revLookup[b64.charCodeAt(i + 1)] << 4) |
          (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }

      return arr
    }

    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] +
        lookup[num >> 12 & 0x3F] +
        lookup[num >> 6 & 0x3F] +
        lookup[num & 0x3F]
    }

    function encodeChunk (uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp =
          ((uint8[i] << 16) & 0xFF0000) +
          ((uint8[i + 1] << 8) & 0xFF00) +
          (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }

    function fromByteArray (uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(
          lookup[tmp >> 2] +
          lookup[(tmp << 4) & 0x3F] +
          '=='
        )
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(
          lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3F] +
          lookup[(tmp << 2) & 0x3F] +
          '='
        )
      }

      return parts.join('')
    }

  },{}],2:[function(require,module,exports){
    (function (Buffer){(function (){
      /*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
      /* eslint-disable no-proto */

      'use strict'

      var base64 = require('base64-js')
      var ieee754 = require('ieee754')

      exports.Buffer = Buffer
      exports.SlowBuffer = SlowBuffer
      exports.INSPECT_MAX_BYTES = 50

      var K_MAX_LENGTH = 0x7fffffff
      exports.kMaxLength = K_MAX_LENGTH

      /**
       * If `Buffer.TYPED_ARRAY_SUPPORT`:
       *   === true    Use Uint8Array implementation (fastest)
       *   === false   Print warning and recommend using `buffer` v4.x which has an Object
       *               implementation (most compatible, even IE6)
       *
       * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
       * Opera 11.6+, iOS 4.2+.
       *
       * We report that the browser does not support typed arrays if the are not subclassable
       * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
       * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
       * for __proto__ and has a buggy typed array implementation.
       */
      Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

      if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
        typeof console.error === 'function') {
        console.error(
          'This browser lacks typed array (Uint8Array) support which is required by ' +
          '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
        )
      }

      function typedArraySupport () {
        // Can typed array instances can be augmented?
        try {
          var arr = new Uint8Array(1)
          arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
          return arr.foo() === 42
        } catch (e) {
          return false
        }
      }

      Object.defineProperty(Buffer.prototype, 'parent', {
        enumerable: true,
        get: function () {
          if (!Buffer.isBuffer(this)) return undefined
          return this.buffer
        }
      })

      Object.defineProperty(Buffer.prototype, 'offset', {
        enumerable: true,
        get: function () {
          if (!Buffer.isBuffer(this)) return undefined
          return this.byteOffset
        }
      })

      function createBuffer (length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"')
        }
        // Return an augmented `Uint8Array` instance
        var buf = new Uint8Array(length)
        buf.__proto__ = Buffer.prototype
        return buf
      }

      /**
       * The Buffer constructor returns instances of `Uint8Array` that have their
       * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
       * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
       * and the `Uint8Array` methods. Square bracket notation works as expected -- it
       * returns a single octet.
       *
       * The `Uint8Array` prototype remains unmodified.
       */

      function Buffer (arg, encodingOrOffset, length) {
        // Common case.
        if (typeof arg === 'number') {
          if (typeof encodingOrOffset === 'string') {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            )
          }
          return allocUnsafe(arg)
        }
        return from(arg, encodingOrOffset, length)
      }

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
      if (typeof Symbol !== 'undefined' && Symbol.species != null &&
        Buffer[Symbol.species] === Buffer) {
        Object.defineProperty(Buffer, Symbol.species, {
          value: null,
          configurable: true,
          enumerable: false,
          writable: false
        })
      }

      Buffer.poolSize = 8192 // not used by this implementation

      function from (value, encodingOrOffset, length) {
        if (typeof value === 'string') {
          return fromString(value, encodingOrOffset)
        }

        if (ArrayBuffer.isView(value)) {
          return fromArrayLike(value)
        }

        if (value == null) {
          throw TypeError(
            'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
            'or Array-like Object. Received type ' + (typeof value)
          )
        }

        if (isInstance(value, ArrayBuffer) ||
          (value && isInstance(value.buffer, ArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length)
        }

        if (typeof value === 'number') {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          )
        }

        var valueOf = value.valueOf && value.valueOf()
        if (valueOf != null && valueOf !== value) {
          return Buffer.from(valueOf, encodingOrOffset, length)
        }

        var b = fromObject(value)
        if (b) return b

        if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
          typeof value[Symbol.toPrimitive] === 'function') {
          return Buffer.from(
            value[Symbol.toPrimitive]('string'), encodingOrOffset, length
          )
        }

        throw new TypeError(
          'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
          'or Array-like Object. Received type ' + (typeof value)
        )
      }

      /**
       * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
       * if value is a number.
       * Buffer.from(str[, encoding])
       * Buffer.from(array)
       * Buffer.from(buffer)
       * Buffer.from(arrayBuffer[, byteOffset[, length]])
       **/
      Buffer.from = function (value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length)
      }

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
      Buffer.prototype.__proto__ = Uint8Array.prototype
      Buffer.__proto__ = Uint8Array

      function assertSize (size) {
        if (typeof size !== 'number') {
          throw new TypeError('"size" argument must be of type number')
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"')
        }
      }

      function alloc (size, fill, encoding) {
        assertSize(size)
        if (size <= 0) {
          return createBuffer(size)
        }
        if (fill !== undefined) {
          // Only pay attention to encoding if it's a string. This
          // prevents accidentally sending in a number that would
          // be interpretted as a start offset.
          return typeof encoding === 'string'
            ? createBuffer(size).fill(fill, encoding)
            : createBuffer(size).fill(fill)
        }
        return createBuffer(size)
      }

      /**
       * Creates a new filled Buffer instance.
       * alloc(size[, fill[, encoding]])
       **/
      Buffer.alloc = function (size, fill, encoding) {
        return alloc(size, fill, encoding)
      }

      function allocUnsafe (size) {
        assertSize(size)
        return createBuffer(size < 0 ? 0 : checked(size) | 0)
      }

      /**
       * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
       * */
      Buffer.allocUnsafe = function (size) {
        return allocUnsafe(size)
      }
      /**
       * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
       */
      Buffer.allocUnsafeSlow = function (size) {
        return allocUnsafe(size)
      }

      function fromString (string, encoding) {
        if (typeof encoding !== 'string' || encoding === '') {
          encoding = 'utf8'
        }

        if (!Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }

        var length = byteLength(string, encoding) | 0
        var buf = createBuffer(length)

        var actual = buf.write(string, encoding)

        if (actual !== length) {
          // Writing a hex string, for example, that contains invalid characters will
          // cause everything after the first invalid character to be ignored. (e.g.
          // 'abxxcd' will be treated as 'ab')
          buf = buf.slice(0, actual)
        }

        return buf
      }

      function fromArrayLike (array) {
        var length = array.length < 0 ? 0 : checked(array.length) | 0
        var buf = createBuffer(length)
        for (var i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255
        }
        return buf
      }

      function fromArrayBuffer (array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds')
        }

        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds')
        }

        var buf
        if (byteOffset === undefined && length === undefined) {
          buf = new Uint8Array(array)
        } else if (length === undefined) {
          buf = new Uint8Array(array, byteOffset)
        } else {
          buf = new Uint8Array(array, byteOffset, length)
        }

        // Return an augmented `Uint8Array` instance
        buf.__proto__ = Buffer.prototype
        return buf
      }

      function fromObject (obj) {
        if (Buffer.isBuffer(obj)) {
          var len = checked(obj.length) | 0
          var buf = createBuffer(len)

          if (buf.length === 0) {
            return buf
          }

          obj.copy(buf, 0, 0, len)
          return buf
        }

        if (obj.length !== undefined) {
          if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0)
          }
          return fromArrayLike(obj)
        }

        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data)
        }
      }

      function checked (length) {
        // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
        // length is NaN (which is otherwise coerced to zero.)
        if (length >= K_MAX_LENGTH) {
          throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
            'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
        }
        return length | 0
      }

      function SlowBuffer (length) {
        if (+length != length) { // eslint-disable-line eqeqeq
          length = 0
        }
        return Buffer.alloc(+length)
      }

      Buffer.isBuffer = function isBuffer (b) {
        return b != null && b._isBuffer === true &&
          b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
      }

      Buffer.compare = function compare (a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
        if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          )
        }

        if (a === b) return 0

        var x = a.length
        var y = b.length

        for (var i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i]
            y = b[i]
            break
          }
        }

        if (x < y) return -1
        if (y < x) return 1
        return 0
      }

      Buffer.isEncoding = function isEncoding (encoding) {
        switch (String(encoding).toLowerCase()) {
          case 'hex':
          case 'utf8':
          case 'utf-8':
          case 'ascii':
          case 'latin1':
          case 'binary':
          case 'base64':
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return true
          default:
            return false
        }
      }

      Buffer.concat = function concat (list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }

        if (list.length === 0) {
          return Buffer.alloc(0)
        }

        var i
        if (length === undefined) {
          length = 0
          for (i = 0; i < list.length; ++i) {
            length += list[i].length
          }
        }

        var buffer = Buffer.allocUnsafe(length)
        var pos = 0
        for (i = 0; i < list.length; ++i) {
          var buf = list[i]
          if (isInstance(buf, Uint8Array)) {
            buf = Buffer.from(buf)
          }
          if (!Buffer.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers')
          }
          buf.copy(buffer, pos)
          pos += buf.length
        }
        return buffer
      }

      function byteLength (string, encoding) {
        if (Buffer.isBuffer(string)) {
          return string.length
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength
        }
        if (typeof string !== 'string') {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
            'Received type ' + typeof string
          )
        }

        var len = string.length
        var mustMatch = (arguments.length > 2 && arguments[2] === true)
        if (!mustMatch && len === 0) return 0

        // Use a for loop to avoid recursion
        var loweredCase = false
        for (;;) {
          switch (encoding) {
            case 'ascii':
            case 'latin1':
            case 'binary':
              return len
            case 'utf8':
            case 'utf-8':
              return utf8ToBytes(string).length
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return len * 2
            case 'hex':
              return len >>> 1
            case 'base64':
              return base64ToBytes(string).length
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
              }
              encoding = ('' + encoding).toLowerCase()
              loweredCase = true
          }
        }
      }
      Buffer.byteLength = byteLength

      function slowToString (encoding, start, end) {
        var loweredCase = false

        // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
        // property of a typed array.

        // This behaves neither like String nor Uint8Array in that we set start/end
        // to their upper/lower bounds if the value passed is out of range.
        // undefined is handled specially as per ECMA-262 6th Edition,
        // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
        if (start === undefined || start < 0) {
          start = 0
        }
        // Return early if start > this.length. Done here to prevent potential uint32
        // coercion fail below.
        if (start > this.length) {
          return ''
        }

        if (end === undefined || end > this.length) {
          end = this.length
        }

        if (end <= 0) {
          return ''
        }

        // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
        end >>>= 0
        start >>>= 0

        if (end <= start) {
          return ''
        }

        if (!encoding) encoding = 'utf8'

        while (true) {
          switch (encoding) {
            case 'hex':
              return hexSlice(this, start, end)

            case 'utf8':
            case 'utf-8':
              return utf8Slice(this, start, end)

            case 'ascii':
              return asciiSlice(this, start, end)

            case 'latin1':
            case 'binary':
              return latin1Slice(this, start, end)

            case 'base64':
              return base64Slice(this, start, end)

            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return utf16leSlice(this, start, end)

            default:
              if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
              encoding = (encoding + '').toLowerCase()
              loweredCase = true
          }
        }
      }

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
      Buffer.prototype._isBuffer = true

      function swap (b, n, m) {
        var i = b[n]
        b[n] = b[m]
        b[m] = i
      }

      Buffer.prototype.swap16 = function swap16 () {
        var len = this.length
        if (len % 2 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 16-bits')
        }
        for (var i = 0; i < len; i += 2) {
          swap(this, i, i + 1)
        }
        return this
      }

      Buffer.prototype.swap32 = function swap32 () {
        var len = this.length
        if (len % 4 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 32-bits')
        }
        for (var i = 0; i < len; i += 4) {
          swap(this, i, i + 3)
          swap(this, i + 1, i + 2)
        }
        return this
      }

      Buffer.prototype.swap64 = function swap64 () {
        var len = this.length
        if (len % 8 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 64-bits')
        }
        for (var i = 0; i < len; i += 8) {
          swap(this, i, i + 7)
          swap(this, i + 1, i + 6)
          swap(this, i + 2, i + 5)
          swap(this, i + 3, i + 4)
        }
        return this
      }

      Buffer.prototype.toString = function toString () {
        var length = this.length
        if (length === 0) return ''
        if (arguments.length === 0) return utf8Slice(this, 0, length)
        return slowToString.apply(this, arguments)
      }

      Buffer.prototype.toLocaleString = Buffer.prototype.toString

      Buffer.prototype.equals = function equals (b) {
        if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
        if (this === b) return true
        return Buffer.compare(this, b) === 0
      }

      Buffer.prototype.inspect = function inspect () {
        var str = ''
        var max = exports.INSPECT_MAX_BYTES
        str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
        if (this.length > max) str += ' ... '
        return '<Buffer ' + str + '>'
      }

      Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer.from(target, target.offset, target.byteLength)
        }
        if (!Buffer.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. ' +
            'Received type ' + (typeof target)
          )
        }

        if (start === undefined) {
          start = 0
        }
        if (end === undefined) {
          end = target ? target.length : 0
        }
        if (thisStart === undefined) {
          thisStart = 0
        }
        if (thisEnd === undefined) {
          thisEnd = this.length
        }

        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError('out of range index')
        }

        if (thisStart >= thisEnd && start >= end) {
          return 0
        }
        if (thisStart >= thisEnd) {
          return -1
        }
        if (start >= end) {
          return 1
        }

        start >>>= 0
        end >>>= 0
        thisStart >>>= 0
        thisEnd >>>= 0

        if (this === target) return 0

        var x = thisEnd - thisStart
        var y = end - start
        var len = Math.min(x, y)

        var thisCopy = this.slice(thisStart, thisEnd)
        var targetCopy = target.slice(start, end)

        for (var i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i]
            y = targetCopy[i]
            break
          }
        }

        if (x < y) return -1
        if (y < x) return 1
        return 0
      }

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
      function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
        // Empty buffer means no match
        if (buffer.length === 0) return -1

        // Normalize byteOffset
        if (typeof byteOffset === 'string') {
          encoding = byteOffset
          byteOffset = 0
        } else if (byteOffset > 0x7fffffff) {
          byteOffset = 0x7fffffff
        } else if (byteOffset < -0x80000000) {
          byteOffset = -0x80000000
        }
        byteOffset = +byteOffset // Coerce to Number.
        if (numberIsNaN(byteOffset)) {
          // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
          byteOffset = dir ? 0 : (buffer.length - 1)
        }

        // Normalize byteOffset: negative offsets start from the end of the buffer
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset
        if (byteOffset >= buffer.length) {
          if (dir) return -1
          else byteOffset = buffer.length - 1
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0
          else return -1
        }

        // Normalize val
        if (typeof val === 'string') {
          val = Buffer.from(val, encoding)
        }

        // Finally, search either indexOf (if dir is true) or lastIndexOf
        if (Buffer.isBuffer(val)) {
          // Special case: looking for empty string/buffer always fails
          if (val.length === 0) {
            return -1
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
        } else if (typeof val === 'number') {
          val = val & 0xFF // Search for a byte value [0-255]
          if (typeof Uint8Array.prototype.indexOf === 'function') {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
            }
          }
          return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
        }

        throw new TypeError('val must be string, number or Buffer')
      }

      function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
        var indexSize = 1
        var arrLength = arr.length
        var valLength = val.length

        if (encoding !== undefined) {
          encoding = String(encoding).toLowerCase()
          if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
            if (arr.length < 2 || val.length < 2) {
              return -1
            }
            indexSize = 2
            arrLength /= 2
            valLength /= 2
            byteOffset /= 2
          }
        }

        function read (buf, i) {
          if (indexSize === 1) {
            return buf[i]
          } else {
            return buf.readUInt16BE(i * indexSize)
          }
        }

        var i
        if (dir) {
          var foundIndex = -1
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
            } else {
              if (foundIndex !== -1) i -= i - foundIndex
              foundIndex = -1
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
          for (i = byteOffset; i >= 0; i--) {
            var found = true
            for (var j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false
                break
              }
            }
            if (found) return i
          }
        }

        return -1
      }

      Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1
      }

      Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
      }

      Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
      }

      function hexWrite (buf, string, offset, length) {
        offset = Number(offset) || 0
        var remaining = buf.length - offset
        if (!length) {
          length = remaining
        } else {
          length = Number(length)
          if (length > remaining) {
            length = remaining
          }
        }

        var strLen = string.length

        if (length > strLen / 2) {
          length = strLen / 2
        }
        for (var i = 0; i < length; ++i) {
          var parsed = parseInt(string.substr(i * 2, 2), 16)
          if (numberIsNaN(parsed)) return i
          buf[offset + i] = parsed
        }
        return i
      }

      function utf8Write (buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
      }

      function asciiWrite (buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length)
      }

      function latin1Write (buf, string, offset, length) {
        return asciiWrite(buf, string, offset, length)
      }

      function base64Write (buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length)
      }

      function ucs2Write (buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
      }

      Buffer.prototype.write = function write (string, offset, length, encoding) {
        // Buffer#write(string)
        if (offset === undefined) {
          encoding = 'utf8'
          length = this.length
          offset = 0
          // Buffer#write(string, encoding)
        } else if (length === undefined && typeof offset === 'string') {
          encoding = offset
          length = this.length
          offset = 0
          // Buffer#write(string, offset[, length][, encoding])
        } else if (isFinite(offset)) {
          offset = offset >>> 0
          if (isFinite(length)) {
            length = length >>> 0
            if (encoding === undefined) encoding = 'utf8'
          } else {
            encoding = length
            length = undefined
          }
        } else {
          throw new Error(
            'Buffer.write(string, encoding, offset[, length]) is no longer supported'
          )
        }

        var remaining = this.length - offset
        if (length === undefined || length > remaining) length = remaining

        if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
          throw new RangeError('Attempt to write outside buffer bounds')
        }

        if (!encoding) encoding = 'utf8'

        var loweredCase = false
        for (;;) {
          switch (encoding) {
            case 'hex':
              return hexWrite(this, string, offset, length)

            case 'utf8':
            case 'utf-8':
              return utf8Write(this, string, offset, length)

            case 'ascii':
              return asciiWrite(this, string, offset, length)

            case 'latin1':
            case 'binary':
              return latin1Write(this, string, offset, length)

            case 'base64':
              // Warning: maxLength not taken into account in base64Write
              return base64Write(this, string, offset, length)

            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return ucs2Write(this, string, offset, length)

            default:
              if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
              encoding = ('' + encoding).toLowerCase()
              loweredCase = true
          }
        }
      }

      Buffer.prototype.toJSON = function toJSON () {
        return {
          type: 'Buffer',
          data: Array.prototype.slice.call(this._arr || this, 0)
        }
      }

      function base64Slice (buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf)
        } else {
          return base64.fromByteArray(buf.slice(start, end))
        }
      }

      function utf8Slice (buf, start, end) {
        end = Math.min(buf.length, end)
        var res = []

        var i = start
        while (i < end) {
          var firstByte = buf[i]
          var codePoint = null
          var bytesPerSequence = (firstByte > 0xEF) ? 4
            : (firstByte > 0xDF) ? 3
              : (firstByte > 0xBF) ? 2
                : 1

          if (i + bytesPerSequence <= end) {
            var secondByte, thirdByte, fourthByte, tempCodePoint

            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 0x80) {
                  codePoint = firstByte
                }
                break
              case 2:
                secondByte = buf[i + 1]
                if ((secondByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                  if (tempCodePoint > 0x7F) {
                    codePoint = tempCodePoint
                  }
                }
                break
              case 3:
                secondByte = buf[i + 1]
                thirdByte = buf[i + 2]
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                  if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                    codePoint = tempCodePoint
                  }
                }
                break
              case 4:
                secondByte = buf[i + 1]
                thirdByte = buf[i + 2]
                fourthByte = buf[i + 3]
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                  if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                    codePoint = tempCodePoint
                  }
                }
            }
          }

          if (codePoint === null) {
            // we did not generate a valid codePoint so insert a
            // replacement char (U+FFFD) and advance only 1 byte
            codePoint = 0xFFFD
            bytesPerSequence = 1
          } else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000
            res.push(codePoint >>> 10 & 0x3FF | 0xD800)
            codePoint = 0xDC00 | codePoint & 0x3FF
          }

          res.push(codePoint)
          i += bytesPerSequence
        }

        return decodeCodePointsArray(res)
      }

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
      var MAX_ARGUMENTS_LENGTH = 0x1000

      function decodeCodePointsArray (codePoints) {
        var len = codePoints.length
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
        }

        // Decode in chunks to avoid "call stack size exceeded".
        var res = ''
        var i = 0
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          )
        }
        return res
      }

      function asciiSlice (buf, start, end) {
        var ret = ''
        end = Math.min(buf.length, end)

        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 0x7F)
        }
        return ret
      }

      function latin1Slice (buf, start, end) {
        var ret = ''
        end = Math.min(buf.length, end)

        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i])
        }
        return ret
      }

      function hexSlice (buf, start, end) {
        var len = buf.length

        if (!start || start < 0) start = 0
        if (!end || end < 0 || end > len) end = len

        var out = ''
        for (var i = start; i < end; ++i) {
          out += toHex(buf[i])
        }
        return out
      }

      function utf16leSlice (buf, start, end) {
        var bytes = buf.slice(start, end)
        var res = ''
        for (var i = 0; i < bytes.length; i += 2) {
          res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
        }
        return res
      }

      Buffer.prototype.slice = function slice (start, end) {
        var len = this.length
        start = ~~start
        end = end === undefined ? len : ~~end

        if (start < 0) {
          start += len
          if (start < 0) start = 0
        } else if (start > len) {
          start = len
        }

        if (end < 0) {
          end += len
          if (end < 0) end = 0
        } else if (end > len) {
          end = len
        }

        if (end < start) end = start

        var newBuf = this.subarray(start, end)
        // Return an augmented `Uint8Array` instance
        newBuf.__proto__ = Buffer.prototype
        return newBuf
      }

      /*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
      function checkOffset (offset, ext, length) {
        if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
        if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
      }

      Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) checkOffset(offset, byteLength, this.length)

        var val = this[offset]
        var mul = 1
        var i = 0
        while (++i < byteLength && (mul *= 0x100)) {
          val += this[offset + i] * mul
        }

        return val
      }

      Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) {
          checkOffset(offset, byteLength, this.length)
        }

        var val = this[offset + --byteLength]
        var mul = 1
        while (byteLength > 0 && (mul *= 0x100)) {
          val += this[offset + --byteLength] * mul
        }

        return val
      }

      Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 1, this.length)
        return this[offset]
      }

      Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 2, this.length)
        return this[offset] | (this[offset + 1] << 8)
      }

      Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 2, this.length)
        return (this[offset] << 8) | this[offset + 1]
      }

      Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)

        return ((this[offset]) |
            (this[offset + 1] << 8) |
            (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
      }

      Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)

        return (this[offset] * 0x1000000) +
          ((this[offset + 1] << 16) |
            (this[offset + 2] << 8) |
            this[offset + 3])
      }

      Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) checkOffset(offset, byteLength, this.length)

        var val = this[offset]
        var mul = 1
        var i = 0
        while (++i < byteLength && (mul *= 0x100)) {
          val += this[offset + i] * mul
        }
        mul *= 0x80

        if (val >= mul) val -= Math.pow(2, 8 * byteLength)

        return val
      }

      Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) checkOffset(offset, byteLength, this.length)

        var i = byteLength
        var mul = 1
        var val = this[offset + --i]
        while (i > 0 && (mul *= 0x100)) {
          val += this[offset + --i] * mul
        }
        mul *= 0x80

        if (val >= mul) val -= Math.pow(2, 8 * byteLength)

        return val
      }

      Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 1, this.length)
        if (!(this[offset] & 0x80)) return (this[offset])
        return ((0xff - this[offset] + 1) * -1)
      }

      Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 2, this.length)
        var val = this[offset] | (this[offset + 1] << 8)
        return (val & 0x8000) ? val | 0xFFFF0000 : val
      }

      Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 2, this.length)
        var val = this[offset + 1] | (this[offset] << 8)
        return (val & 0x8000) ? val | 0xFFFF0000 : val
      }

      Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)

        return (this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16) |
          (this[offset + 3] << 24)
      }

      Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)

        return (this[offset] << 24) |
          (this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          (this[offset + 3])
      }

      Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)
        return ieee754.read(this, offset, true, 23, 4)
      }

      Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 4, this.length)
        return ieee754.read(this, offset, false, 23, 4)
      }

      Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 8, this.length)
        return ieee754.read(this, offset, true, 52, 8)
      }

      Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
        offset = offset >>> 0
        if (!noAssert) checkOffset(offset, 8, this.length)
        return ieee754.read(this, offset, false, 52, 8)
      }

      function checkInt (buf, value, offset, ext, max, min) {
        if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
        if (offset + ext > buf.length) throw new RangeError('Index out of range')
      }

      Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
        value = +value
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1
          checkInt(this, value, offset, byteLength, maxBytes, 0)
        }

        var mul = 1
        var i = 0
        this[offset] = value & 0xFF
        while (++i < byteLength && (mul *= 0x100)) {
          this[offset + i] = (value / mul) & 0xFF
        }

        return offset + byteLength
      }

      Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
        value = +value
        offset = offset >>> 0
        byteLength = byteLength >>> 0
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1
          checkInt(this, value, offset, byteLength, maxBytes, 0)
        }

        var i = byteLength - 1
        var mul = 1
        this[offset + i] = value & 0xFF
        while (--i >= 0 && (mul *= 0x100)) {
          this[offset + i] = (value / mul) & 0xFF
        }

        return offset + byteLength
      }

      Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
        this[offset] = (value & 0xff)
        return offset + 1
      }

      Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
        return offset + 2
      }

      Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
        this[offset] = (value >>> 8)
        this[offset + 1] = (value & 0xff)
        return offset + 2
      }

      Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
        this[offset + 3] = (value >>> 24)
        this[offset + 2] = (value >>> 16)
        this[offset + 1] = (value >>> 8)
        this[offset] = (value & 0xff)
        return offset + 4
      }

      Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = (value & 0xff)
        return offset + 4
      }

      Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) {
          var limit = Math.pow(2, (8 * byteLength) - 1)

          checkInt(this, value, offset, byteLength, limit - 1, -limit)
        }

        var i = 0
        var mul = 1
        var sub = 0
        this[offset] = value & 0xFF
        while (++i < byteLength && (mul *= 0x100)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1
          }
          this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
        }

        return offset + byteLength
      }

      Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) {
          var limit = Math.pow(2, (8 * byteLength) - 1)

          checkInt(this, value, offset, byteLength, limit - 1, -limit)
        }

        var i = byteLength - 1
        var mul = 1
        var sub = 0
        this[offset + i] = value & 0xFF
        while (--i >= 0 && (mul *= 0x100)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1
          }
          this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
        }

        return offset + byteLength
      }

      Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
        if (value < 0) value = 0xff + value + 1
        this[offset] = (value & 0xff)
        return offset + 1
      }

      Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
        return offset + 2
      }

      Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
        this[offset] = (value >>> 8)
        this[offset + 1] = (value & 0xff)
        return offset + 2
      }

      Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
        this[offset + 2] = (value >>> 16)
        this[offset + 3] = (value >>> 24)
        return offset + 4
      }

      Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
        if (value < 0) value = 0xffffffff + value + 1
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = (value & 0xff)
        return offset + 4
      }

      function checkIEEE754 (buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError('Index out of range')
        if (offset < 0) throw new RangeError('Index out of range')
      }

      function writeFloat (buf, value, offset, littleEndian, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4)
        return offset + 4
      }

      Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert)
      }

      Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert)
      }

      function writeDouble (buf, value, offset, littleEndian, noAssert) {
        value = +value
        offset = offset >>> 0
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8)
        return offset + 8
      }

      Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert)
      }

      Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert)
      }

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
      Buffer.prototype.copy = function copy (target, targetStart, start, end) {
        if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
        if (!start) start = 0
        if (!end && end !== 0) end = this.length
        if (targetStart >= target.length) targetStart = target.length
        if (!targetStart) targetStart = 0
        if (end > 0 && end < start) end = start

        // Copy 0 bytes; we're done
        if (end === start) return 0
        if (target.length === 0 || this.length === 0) return 0

        // Fatal error conditions
        if (targetStart < 0) {
          throw new RangeError('targetStart out of bounds')
        }
        if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
        if (end < 0) throw new RangeError('sourceEnd out of bounds')

        // Are we oob?
        if (end > this.length) end = this.length
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start
        }

        var len = end - start

        if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
          // Use built-in when available, missing from IE11
          this.copyWithin(targetStart, start, end)
        } else if (this === target && start < targetStart && targetStart < end) {
          // descending copy from end
          for (var i = len - 1; i >= 0; --i) {
            target[i + targetStart] = this[i + start]
          }
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          )
        }

        return len
      }

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
      Buffer.prototype.fill = function fill (val, start, end, encoding) {
        // Handle string cases:
        if (typeof val === 'string') {
          if (typeof start === 'string') {
            encoding = start
            start = 0
            end = this.length
          } else if (typeof end === 'string') {
            encoding = end
            end = this.length
          }
          if (encoding !== undefined && typeof encoding !== 'string') {
            throw new TypeError('encoding must be a string')
          }
          if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
            throw new TypeError('Unknown encoding: ' + encoding)
          }
          if (val.length === 1) {
            var code = val.charCodeAt(0)
            if ((encoding === 'utf8' && code < 128) ||
              encoding === 'latin1') {
              // Fast path: If `val` fits into a single byte, use that numeric value.
              val = code
            }
          }
        } else if (typeof val === 'number') {
          val = val & 255
        }

        // Invalid ranges are not set to a default, so can range check early.
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError('Out of range index')
        }

        if (end <= start) {
          return this
        }

        start = start >>> 0
        end = end === undefined ? this.length : end >>> 0

        if (!val) val = 0

        var i
        if (typeof val === 'number') {
          for (i = start; i < end; ++i) {
            this[i] = val
          }
        } else {
          var bytes = Buffer.isBuffer(val)
            ? val
            : Buffer.from(val, encoding)
          var len = bytes.length
          if (len === 0) {
            throw new TypeError('The value "' + val +
              '" is invalid for argument "value"')
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len]
          }
        }

        return this
      }

// HELPER FUNCTIONS
// ================

      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

      function base64clean (str) {
        // Node takes equal signs as end of the Base64 encoding
        str = str.split('=')[0]
        // Node strips out invalid characters like \n and \t from the string, base64-js does not
        str = str.trim().replace(INVALID_BASE64_RE, '')
        // Node converts strings with length < 2 to ''
        if (str.length < 2) return ''
        // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
        while (str.length % 4 !== 0) {
          str = str + '='
        }
        return str
      }

      function toHex (n) {
        if (n < 16) return '0' + n.toString(16)
        return n.toString(16)
      }

      function utf8ToBytes (string, units) {
        units = units || Infinity
        var codePoint
        var length = string.length
        var leadSurrogate = null
        var bytes = []

        for (var i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i)

          // is surrogate component
          if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
              // no lead yet
              if (codePoint > 0xDBFF) {
                // unexpected trail
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                continue
              } else if (i + 1 === length) {
                // unpaired lead
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                continue
              }

              // valid lead
              leadSurrogate = codePoint

              continue
            }

            // 2 leads in a row
            if (codePoint < 0xDC00) {
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              leadSurrogate = codePoint
              continue
            }

            // valid surrogate pair
            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
          } else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          }

          leadSurrogate = null

          // encode utf8
          if (codePoint < 0x80) {
            if ((units -= 1) < 0) break
            bytes.push(codePoint)
          } else if (codePoint < 0x800) {
            if ((units -= 2) < 0) break
            bytes.push(
              codePoint >> 0x6 | 0xC0,
              codePoint & 0x3F | 0x80
            )
          } else if (codePoint < 0x10000) {
            if ((units -= 3) < 0) break
            bytes.push(
              codePoint >> 0xC | 0xE0,
              codePoint >> 0x6 & 0x3F | 0x80,
              codePoint & 0x3F | 0x80
            )
          } else if (codePoint < 0x110000) {
            if ((units -= 4) < 0) break
            bytes.push(
              codePoint >> 0x12 | 0xF0,
              codePoint >> 0xC & 0x3F | 0x80,
              codePoint >> 0x6 & 0x3F | 0x80,
              codePoint & 0x3F | 0x80
            )
          } else {
            throw new Error('Invalid code point')
          }
        }

        return bytes
      }

      function asciiToBytes (str) {
        var byteArray = []
        for (var i = 0; i < str.length; ++i) {
          // Node's code seems to be doing this and not & 0x7F..
          byteArray.push(str.charCodeAt(i) & 0xFF)
        }
        return byteArray
      }

      function utf16leToBytes (str, units) {
        var c, hi, lo
        var byteArray = []
        for (var i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break

          c = str.charCodeAt(i)
          hi = c >> 8
          lo = c % 256
          byteArray.push(lo)
          byteArray.push(hi)
        }

        return byteArray
      }

      function base64ToBytes (str) {
        return base64.toByteArray(base64clean(str))
      }

      function blitBuffer (src, dst, offset, length) {
        for (var i = 0; i < length; ++i) {
          if ((i + offset >= dst.length) || (i >= src.length)) break
          dst[i + offset] = src[i]
        }
        return i
      }

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
      function isInstance (obj, type) {
        return obj instanceof type ||
          (obj != null && obj.constructor != null && obj.constructor.name != null &&
            obj.constructor.name === type.name)
      }
      function numberIsNaN (obj) {
        // For IE11 support
        return obj !== obj // eslint-disable-line no-self-compare
      }

    }).call(this)}).call(this,require("buffer").Buffer)

  },{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
    /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]

      i += d

      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

      value = Math.abs(value)

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }

        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128
    }

  },{}],4:[function(require,module,exports){
    "use strict";
    var __assign = (this && this.__assign) || function () {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0: case 1: t = op; break;
            case 4: _.label++; return { value: op[1], done: false };
            case 5: _.label++; y = op[1]; op = [0]; continue;
            case 7: op = _.ops.pop(); _.trys.pop(); continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
              if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
              if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
              if (t[2]) _.ops.pop();
              _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HubControl = void 0;
    var manual_1 = require("./states/manual");
    var ai_1 = require("./states/ai");
    var HubControl = /** @class */ (function () {
      function HubControl(deviceInfo, controlData, configuration) {
        this.hub = null;
        this.device = deviceInfo;
        this.control = controlData;
        this.configuration = configuration;
        this.prevControl = __assign({}, this.control);
        this.states = {
          Turn: ai_1.turn,
          Drive: ai_1.drive,
          Stop: ai_1.stop,
          Back: ai_1.back,
          Manual: manual_1.manual,
          Seek: ai_1.seek,
        };
        this.currentState = this.states['Manual'];
      }
      HubControl.prototype.updateConfiguration = function (configuration) {
        this.configuration = configuration;
      };
      HubControl.prototype.start = function (hub) {
        return __awaiter(this, void 0, void 0, function () {
          var _this = this;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                this.hub = hub;
                this.device.connected = true;
                this.hub.emitter.on('error', function (err) {
                  _this.device.err = err;
                });
                this.hub.emitter.on('disconnect', function () {
                  _this.device.connected = false;
                });
                this.hub.emitter.on('distance', function (distance) {
                  _this.device.distance = distance;
                });
                this.hub.emitter.on('rssi', function (rssi) {
                  _this.device.rssi = rssi;
                });
                this.hub.emitter.on('port', function (portObject) {
                  var port = portObject.port, action = portObject.action;
                  _this.device.ports[port].action = action;
                });
                this.hub.emitter.on('color', function (color) {
                  _this.device.color = color;
                });
                this.hub.emitter.on('tilt', function (tilt) {
                  var roll = tilt.roll, pitch = tilt.pitch;
                  _this.device.tilt.roll = roll;
                  _this.device.tilt.pitch = pitch;
                });
                this.hub.emitter.on('rotation', function (rotation) {
                  var port = rotation.port, angle = rotation.angle;
                  _this.device.ports[port].angle = angle;
                });
                return [4 /*yield*/, this.hub.ledAsync('red')];
              case 1:
                _a.sent();
                return [4 /*yield*/, this.hub.ledAsync('yellow')];
              case 2:
                _a.sent();
                return [4 /*yield*/, this.hub.ledAsync('green')];
              case 3:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      HubControl.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.device.connected) return [3 /*break*/, 2];
                return [4 /*yield*/, this.hub.disconnectAsync()];
              case 1:
                _a.sent();
                _a.label = 2;
              case 2: return [2 /*return*/];
            }
          });
        });
      };
      HubControl.prototype.setNextState = function (state) {
        this.control.controlUpdateTime = undefined;
        this.control.state = state;
        this.currentState = this.states[state];
      };
      HubControl.prototype.update = function () {
        // TODO: After removing bind, this requires some more refactoring
        this.currentState(this);
        // TODO: Deep clone
        this.prevControl = __assign({}, this.control);
        this.prevControl.tilt = __assign({}, this.control.tilt);
        this.prevDevice = __assign({}, this.device);
      };
      return HubControl;
    }());
    exports.HubControl = HubControl;

  },{"./states/ai":5,"./states/manual":6}],5:[function(require,module,exports){
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.seek = exports.turn = exports.drive = exports.back = exports.stop = void 0;
    var MIN_DISTANCE = 75;
    var OK_DISTANCE = 100;
    var EXECUTE_TIME_SEC = 60;
    var CHECK_TIME_MS = 59000;
// Speeds must be between -100 and 100
    var TURN_SPEED = 30;
    var TURN_SPEED_OPPOSITE = -10;
    var DRIVE_SPEED = 30;
    var REVERSE_SPEED = -15;
    var seek = function (hubControl) {
      if (!hubControl.control.controlUpdateTime || Date.now() - hubControl.control.controlUpdateTime > CHECK_TIME_MS) {
        hubControl.control.controlUpdateTime = Date.now();
        hubControl.hub.motorTimeMulti(EXECUTE_TIME_SEC, TURN_SPEED, TURN_SPEED_OPPOSITE);
      }
      if (Date.now() - hubControl.control.controlUpdateTime < 250)
        return;
      if (hubControl.device.distance > hubControl.prevDevice.distance) {
        hubControl.control.turnDirection = 'right';
        hubControl.setNextState('Turn');
      }
      else {
        hubControl.control.turnDirection = 'left';
        hubControl.setNextState('Turn');
      }
    };
    exports.seek = seek;
    var turn = function (hubControl) {
      if (hubControl.device.distance < MIN_DISTANCE) {
        hubControl.control.turnDirection = null;
        hubControl.setNextState('Back');
        return;
      }
      else if (hubControl.device.distance > OK_DISTANCE) {
        hubControl.control.turnDirection = null;
        hubControl.setNextState('Drive');
        return;
      }
      if (!hubControl.control.controlUpdateTime || Date.now() - hubControl.control.controlUpdateTime > CHECK_TIME_MS) {
        var motorA = hubControl.control.turnDirection === 'right' ? TURN_SPEED : TURN_SPEED_OPPOSITE;
        var motorB = hubControl.control.turnDirection === 'right' ? TURN_SPEED_OPPOSITE : TURN_SPEED;
        hubControl.control.controlUpdateTime = Date.now();
        hubControl.hub.motorTimeMulti(EXECUTE_TIME_SEC, motorA, motorB);
      }
    };
    exports.turn = turn;
    var drive = function (hubControl) {
      if (hubControl.device.distance < MIN_DISTANCE) {
        hubControl.setNextState('Back');
        return;
      }
      else if (hubControl.device.distance < OK_DISTANCE) {
        hubControl.setNextState('Seek');
        return;
      }
      if (!hubControl.control.controlUpdateTime || Date.now() - hubControl.control.controlUpdateTime > CHECK_TIME_MS) {
        hubControl.control.controlUpdateTime = Date.now();
        var speed = hubControl.configuration.leftMotor === 'A' ? DRIVE_SPEED : DRIVE_SPEED * -1;
        hubControl.hub.motorTimeMulti(EXECUTE_TIME_SEC, speed, speed);
      }
    };
    exports.drive = drive;
    var back = function (hubControl) {
      if (hubControl.device.distance > OK_DISTANCE) {
        hubControl.setNextState('Seek');
        return;
      }
      if (!hubControl.control.controlUpdateTime || Date.now() - hubControl.control.controlUpdateTime > CHECK_TIME_MS) {
        hubControl.control.controlUpdateTime = Date.now();
        var speed = hubControl.configuration.leftMotor === 'A' ? REVERSE_SPEED : REVERSE_SPEED * -1;
        hubControl.hub.motorTimeMulti(EXECUTE_TIME_SEC, speed, speed);
      }
    };
    exports.back = back;
    var stop = function (hubControl) {
      hubControl.control.speed = 0;
      hubControl.control.turnAngle = 0;
      if (!hubControl.control.controlUpdateTime || Date.now() - hubControl.control.controlUpdateTime > CHECK_TIME_MS) {
        hubControl.control.controlUpdateTime = Date.now();
        hubControl.hub.motorTimeMulti(EXECUTE_TIME_SEC, 0, 0);
      }
    };
    exports.stop = stop;

  },{}],6:[function(require,module,exports){
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.manual = void 0;
    function manual(hubControl) {
      if (hubControl.control.speed !== hubControl.prevControl.speed || hubControl.control.turnAngle !== hubControl.prevControl.turnAngle) {
        var motorA = hubControl.control.speed + (hubControl.control.turnAngle > 0 ? Math.abs(hubControl.control.turnAngle) : 0);
        var motorB = hubControl.control.speed + (hubControl.control.turnAngle < 0 ? Math.abs(hubControl.control.turnAngle) : 0);
        if (motorA > 100) {
          motorB -= motorA - 100;
          motorA = 100;
        }
        if (motorB > 100) {
          motorA -= motorB - 100;
          motorB = 100;
        }
        hubControl.control.motorA = motorA;
        hubControl.control.motorB = motorB;
        hubControl.hub.motorTimeMulti(60, motorA, motorB);
      }
      if (hubControl.control.tilt.pitch !== hubControl.prevControl.tilt.pitch) {
        hubControl.hub.motorTime('C', 60, hubControl.control.tilt.pitch);
      }
      if (hubControl.control.tilt.roll !== hubControl.prevControl.tilt.roll) {
        hubControl.hub.motorTime('D', 60, hubControl.control.tilt.roll);
      }
    }
    exports.manual = manual;

  },{}],7:[function(require,module,exports){
    "use strict";
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0: case 1: t = op; break;
            case 4: _.label++; return { value: op[1], done: false };
            case 5: _.label++; y = op[1]; op = [0]; continue;
            case 7: op = _.ops.pop(); _.trys.pop(); continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
              if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
              if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
              if (t[2]) _.ops.pop();
              _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BoostConnector = void 0;
    var BOOST_HUB_SERVICE_UUID = '00001623-1212-efde-1623-785feabcd123';
    var BOOST_CHARACTERISTIC_UUID = '00001624-1212-efde-1623-785feabcd123';
    var BoostConnector = /** @class */ (function () {
      function BoostConnector() {
      }
      BoostConnector.connect = function (disconnectCallback) {
        return __awaiter(this, void 0, void 0, function () {
          var options, _a;
          var _this = this;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                options = {
                  acceptAllDevices: false,
                  filters: [{ services: [BOOST_HUB_SERVICE_UUID] }],
                  optionalServices: [BOOST_HUB_SERVICE_UUID],
                };
                _a = this;
                return [4 /*yield*/, navigator.bluetooth.requestDevice(options)];
              case 1:
                _a.device = _b.sent();
                this.device.addEventListener('gattserverdisconnected', function (event) { return __awaiter(_this, void 0, void 0, function () {
                  return __generator(this, function (_a) {
                    switch (_a.label) {
                      case 0: return [4 /*yield*/, disconnectCallback()];
                      case 1:
                        _a.sent();
                        return [2 /*return*/];
                    }
                  });
                }); });
                // await this.device.watchAdvertisements();
                // this.device.addEventListener('advertisementreceived', event => {
                //   // @ts-ignore
                //   console.log(event.rssi);
                // });
                return [2 /*return*/, BoostConnector.getCharacteristic(this.device)];
            }
          });
        });
      };
      BoostConnector.getCharacteristic = function (device) {
        return __awaiter(this, void 0, void 0, function () {
          var server, service;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0: return [4 /*yield*/, device.gatt.connect()];
              case 1:
                server = _a.sent();
                return [4 /*yield*/, server.getPrimaryService(BOOST_HUB_SERVICE_UUID)];
              case 2:
                service = _a.sent();
                return [4 /*yield*/, service.getCharacteristic(BOOST_CHARACTERISTIC_UUID)];
              case 3: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      BoostConnector.reconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
          var bluetooth;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.device) return [3 /*break*/, 2];
                return [4 /*yield*/, BoostConnector.getCharacteristic(this.device)];
              case 1:
                bluetooth = _a.sent();
                return [2 /*return*/, [true, bluetooth]];
              case 2: return [2 /*return*/, [false, null]];
            }
          });
        });
      };
      BoostConnector.disconnect = function () {
        if (this.device) {
          this.device.gatt.disconnect();
          return true;
        }
        return false;
      };
      BoostConnector.isWebBluetoothSupported = navigator.bluetooth ? true : false;
      return BoostConnector;
    }());
    exports.BoostConnector = BoostConnector;

  },{}],8:[function(require,module,exports){
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var legoBoost_1 = require("./legoBoost");
// @ts-ignore
    window.LegoBoost = legoBoost_1.default;

  },{"./legoBoost":13}],9:[function(require,module,exports){
    (function (Buffer){(function (){
      /*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
      /* eslint-disable no-proto */
      'use strict';
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.kMaxLength = exports.INSPECT_MAX_BYTES = exports.SlowBuffer = exports.Buffer = void 0;
      var base64 = Promise.resolve().then(function () { return require('base64-js'); });
      var ieee754 = Promise.resolve().then(function () { return require('ieee754'); });
      var INSPECT_MAX_BYTES = 50;
      exports.INSPECT_MAX_BYTES = INSPECT_MAX_BYTES;
      var K_MAX_LENGTH = 0x7fffffff;
      var kMaxLength = K_MAX_LENGTH;
      exports.kMaxLength = kMaxLength;
      /**
       * If `Buffer.TYPED_ARRAY_SUPPORT`:
       *   === true    Use Uint8Array implementation (fastest)
       *   === false   Print warning and recommend using `buffer` v4.x which has an Object
       *               implementation (most compatible, even IE6)
       *
       * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
       * Opera 11.6+, iOS 4.2+.
       *
       * We report that the browser does not support typed arrays if the are not subclassable
       * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
       * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
       * for __proto__ and has a buggy typed array implementation.
       */
      Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
        typeof console.error === 'function') {
        console.error('This browser lacks typed array (Uint8Array) support which is required by ' +
          '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
      }
      function typedArraySupport() {
        // Can typed array instances can be augmented?
        try {
          var arr = new Uint8Array(1);
          // @ts-ignore
          arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42; } };
          // @ts-ignore
          return arr.foo() === 42;
        }
        catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer.prototype, 'parent', {
        enumerable: true,
        get: function () {
          if (!Buffer.isBuffer(this))
            return undefined;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer.prototype, 'offset', {
        enumerable: true,
        get: function () {
          if (!Buffer.isBuffer(this))
            return undefined;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        // Return an augmented `Uint8Array` instance
        var buf = new Uint8Array(length);
        // @ts-ignore
        buf.__proto__ = Buffer.prototype;
        return buf;
      }
      /**
       * The Buffer constructor returns instances of `Uint8Array` that have their
       * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
       * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
       * and the `Uint8Array` methods. Square bracket notation works as expected -- it
       * returns a single octet.
       *
       * The `Uint8Array` prototype remains unmodified.
       */
      function Buffer(arg, encodingOrOffset, length) {
        // Common case.
        if (typeof arg === 'number') {
          if (typeof encodingOrOffset === 'string') {
            throw new TypeError('The "string" argument must be of type string. Received type number');
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      exports.Buffer = Buffer;
// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
      if (typeof Symbol !== 'undefined' && Symbol.species != null &&
        Buffer[Symbol.species] === Buffer) {
        Object.defineProperty(Buffer, Symbol.species, {
          value: null,
          configurable: true,
          enumerable: false,
          writable: false
        });
      }
      Buffer.poolSize = 8192; // not used by this implementation
      function from(value, encodingOrOffset, length) {
        if (typeof value === 'string') {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayLike(value);
        }
        if (value == null) {
          throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
            'or Array-like Object. Received type ' + (typeof value));
        }
        if (isInstance(value, ArrayBuffer) ||
          (value && isInstance(value.buffer, ArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === 'number') {
          throw new TypeError('The "value" argument must not be of type number. Received type number');
        }
        var valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer.from(valueOf, encodingOrOffset, length);
        }
        var b = fromObject(value);
        if (b)
          return b;
        if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
          typeof value[Symbol.toPrimitive] === 'function') {
          return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
        }
        throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
          'or Array-like Object. Received type ' + (typeof value));
      }
      /**
       * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
       * if value is a number.
       * Buffer.from(str[, encoding])
       * Buffer.from(array)
       * Buffer.from(buffer)
       * Buffer.from(arrayBuffer[, byteOffset[, length]])
       **/
      Buffer.from = function (value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
      Buffer.prototype.__proto__ = Uint8Array.prototype;
      Buffer.__proto__ = Uint8Array;
      function assertSize(size) {
        if (typeof size !== 'number') {
          throw new TypeError('"size" argument must be of type number');
        }
        else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== undefined) {
          // Only pay attention to encoding if it's a string. This
          // prevents accidentally sending in a number that would
          // be interpretted as a start offset.
          return typeof encoding === 'string'
            // @ts-ignore
            ? createBuffer(size).fill(fill, encoding)
            : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      /**
       * Creates a new filled Buffer instance.
       * alloc(size[, fill[, encoding]])
       **/
      Buffer.alloc = function (size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      /**
       * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
       * */
      Buffer.allocUnsafe = function (size) {
        return allocUnsafe(size);
      };
      /**
       * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
       */
      Buffer.allocUnsafeSlow = function (size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== 'string' || encoding === '') {
          encoding = 'utf8';
        }
        if (!Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding);
        }
        var length = byteLength(string, encoding) | 0;
        var buf = createBuffer(length);
        // @ts-ignore
        var actual = buf.write(string, encoding);
        if (actual !== length) {
          // Writing a hex string, for example, that contains invalid characters will
          // cause everything after the first invalid character to be ignored. (e.g.
          // 'abxxcd' will be treated as 'ab')
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        var length = array.length < 0 ? 0 : checked(array.length) | 0;
        var buf = createBuffer(length);
        for (var i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        var buf;
        if (byteOffset === undefined && length === undefined) {
          buf = new Uint8Array(array);
        }
        else if (length === undefined) {
          buf = new Uint8Array(array, byteOffset);
        }
        else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        // Return an augmented `Uint8Array` instance
        buf.__proto__ = Buffer.prototype;
        return buf;
      }
      function fromObject(obj) {
        if (Buffer.isBuffer(obj)) {
          var len = checked(obj.length) | 0;
          var buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== undefined) {
          if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
        // length is NaN (which is otherwise coerced to zero.)
        if (length >= K_MAX_LENGTH) {
          throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
            'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) { // eslint-disable-line eqeqeq
          length = 0;
        }
        // @ts-ignore
        return Buffer.alloc(+length);
      }
      exports.SlowBuffer = SlowBuffer;
      Buffer.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true &&
          b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
      };
      Buffer.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array))
          a = Buffer.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array))
          b = Buffer.from(b, b.offset, b.byteLength);
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
          throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
        }
        if (a === b)
          return 0;
        var x = a.length;
        var y = b.length;
        for (var i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y)
          return -1;
        if (y < x)
          return 1;
        return 0;
      };
      Buffer.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case 'hex':
          case 'utf8':
          case 'utf-8':
          case 'ascii':
          case 'latin1':
          case 'binary':
          case 'base64':
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return true;
          default:
            return false;
        }
      };
      Buffer.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          // @ts-ignore
          return Buffer.alloc(0);
        }
        var i;
        if (length === undefined) {
          length = 0;
          for (i = 0; i < list.length; ++i) {
            length += list[i].length;
          }
        }
        var buffer = Buffer.allocUnsafe(length);
        var pos = 0;
        for (i = 0; i < list.length; ++i) {
          var buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            // @ts-ignore
            buf = Buffer.from(buf);
          }
          if (!Buffer.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          }
          buf.copy(buffer, pos);
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== 'string') {
          throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
            'Received type ' + typeof string);
        }
        var len = string.length;
        var mustMatch = (arguments.length > 2 && arguments[2] === true);
        if (!mustMatch && len === 0)
          return 0;
        // Use a for loop to avoid recursion
        var loweredCase = false;
        for (;;) {
          switch (encoding) {
            case 'ascii':
            case 'latin1':
            case 'binary':
              return len;
            case 'utf8':
            case 'utf-8':
              // @ts-ignore
              return utf8ToBytes(string).length;
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return len * 2;
            case 'hex':
              return len >>> 1;
            case 'base64':
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                // @ts-ignore
                return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
              }
              encoding = ('' + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        var loweredCase = false;
        // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
        // property of a typed array.
        // This behaves neither like String nor Uint8Array in that we set start/end
        // to their upper/lower bounds if the value passed is out of range.
        // undefined is handled specially as per ECMA-262 6th Edition,
        // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
        if (start === undefined || start < 0) {
          start = 0;
        }
        // Return early if start > this.length. Done here to prevent potential uint32
        // coercion fail below.
        if (start > this.length) {
          return '';
        }
        if (end === undefined || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return '';
        }
        // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return '';
        }
        if (!encoding)
          encoding = 'utf8';
        while (true) {
          switch (encoding) {
            case 'hex':
              return hexSlice(this, start, end);
            case 'utf8':
            case 'utf-8':
              return utf8Slice(this, start, end);
            case 'ascii':
              return asciiSlice(this, start, end);
            case 'latin1':
            case 'binary':
              return latin1Slice(this, start, end);
            case 'base64':
              return base64Slice(this, start, end);
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase)
                throw new TypeError('Unknown encoding: ' + encoding);
              encoding = (encoding + '').toLowerCase();
              loweredCase = true;
          }
        }
      }
// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
      Buffer.prototype._isBuffer = true;
      function swap(b, n, m) {
        var i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer.prototype.swap16 = function swap16() {
        var len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 16-bits');
        }
        for (var i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer.prototype.swap32 = function swap32() {
        var len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 32-bits');
        }
        for (var i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer.prototype.swap64 = function swap64() {
        var len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError('Buffer size must be a multiple of 64-bits');
        }
        for (var i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer.prototype.toString = function toString() {
        var length = this.length;
        if (length === 0)
          return '';
        if (arguments.length === 0)
          return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer.prototype.toLocaleString = Buffer.prototype.toString;
      Buffer.prototype.equals = function equals(b) {
        if (!Buffer.isBuffer(b))
          throw new TypeError('Argument must be a Buffer');
        if (this === b)
          return true;
        return Buffer.compare(this, b) === 0;
      };
      Buffer.prototype.inspect = function inspect() {
        var str = '';
        var max = INSPECT_MAX_BYTES;
        str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
        if (this.length > max)
          str += ' ... ';
        return '<Buffer ' + str + '>';
      };
      Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer.from(target, target.offset, target.byteLength);
        }
        if (!Buffer.isBuffer(target)) {
          throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' +
            'Received type ' + (typeof target));
        }
        if (start === undefined) {
          start = 0;
        }
        if (end === undefined) {
          end = target ? target.length : 0;
        }
        if (thisStart === undefined) {
          thisStart = 0;
        }
        if (thisEnd === undefined) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError('out of range index');
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target)
          return 0;
        var x = thisEnd - thisStart;
        var y = end - start;
        var len = Math.min(x, y);
        var thisCopy = this.slice(thisStart, thisEnd);
        var targetCopy = target.slice(start, end);
        for (var i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y)
          return -1;
        if (y < x)
          return 1;
        return 0;
      };
// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        // Empty buffer means no match
        if (buffer.length === 0)
          return -1;
        // Normalize byteOffset
        if (typeof byteOffset === 'string') {
          encoding = byteOffset;
          byteOffset = 0;
        }
        else if (byteOffset > 0x7fffffff) {
          byteOffset = 0x7fffffff;
        }
        else if (byteOffset < -0x80000000) {
          byteOffset = -0x80000000;
        }
        byteOffset = +byteOffset; // Coerce to Number.
        if (numberIsNaN(byteOffset)) {
          // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
          byteOffset = dir ? 0 : (buffer.length - 1);
        }
        // Normalize byteOffset: negative offsets start from the end of the buffer
        if (byteOffset < 0)
          byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir)
            return -1;
          else
            byteOffset = buffer.length - 1;
        }
        else if (byteOffset < 0) {
          if (dir)
            byteOffset = 0;
          else
            return -1;
        }
        // Normalize val
        if (typeof val === 'string') {
          // @ts-ignore
          val = Buffer.from(val, encoding);
        }
        // Finally, search either indexOf (if dir is true) or lastIndexOf
        if (Buffer.isBuffer(val)) {
          // Special case: looking for empty string/buffer always fails
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        }
        else if (typeof val === 'number') {
          val = val & 0xFF; // Search for a byte value [0-255]
          if (typeof Uint8Array.prototype.indexOf === 'function') {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            }
            else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError('val must be string, number or Buffer');
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        var indexSize = 1;
        var arrLength = arr.length;
        var valLength = val.length;
        if (encoding !== undefined) {
          encoding = String(encoding).toLowerCase();
          if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i) {
          if (indexSize === 1) {
            return buf[i];
          }
          else {
            return buf.readUInt16BE(i * indexSize);
          }
        }
        var i;
        if (dir) {
          var foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1)
                foundIndex = i;
              if (i - foundIndex + 1 === valLength)
                return foundIndex * indexSize;
            }
            else {
              if (foundIndex !== -1)
                i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        }
        else {
          if (byteOffset + valLength > arrLength)
            byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            var found = true;
            for (var j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false;
                break;
              }
            }
            if (found)
              return i;
          }
        }
        return -1;
      }
      Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        var remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        }
        else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        var strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        for (var i = 0; i < length; ++i) {
          var parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed))
            return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function latin1Write(buf, string, offset, length) {
        return asciiWrite(buf, string, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer.prototype.write = function write(string, offset, length, encoding) {
        // Buffer#write(string)
        if (offset === undefined) {
          encoding = 'utf8';
          length = this.length;
          offset = 0;
          // Buffer#write(string, encoding)
        }
        else if (length === undefined && typeof offset === 'string') {
          encoding = offset;
          length = this.length;
          offset = 0;
          // Buffer#write(string, offset[, length][, encoding])
        }
        else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === undefined)
              encoding = 'utf8';
          }
          else {
            encoding = length;
            length = undefined;
          }
        }
        else {
          throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
        }
        var remaining = this.length - offset;
        if (length === undefined || length > remaining)
          length = remaining;
        if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
          throw new RangeError('Attempt to write outside buffer bounds');
        }
        if (!encoding)
          encoding = 'utf8';
        var loweredCase = false;
        for (;;) {
          switch (encoding) {
            case 'hex':
              return hexWrite(this, string, offset, length);
            case 'utf8':
            case 'utf-8':
              return utf8Write(this, string, offset, length);
            case 'ascii':
              return asciiWrite(this, string, offset, length);
            case 'latin1':
            case 'binary':
              return latin1Write(this, string, offset, length);
            case 'base64':
              // Warning: maxLength not taken into account in base64Write
              return base64Write(this, string, offset, length);
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase)
                throw new TypeError('Unknown encoding: ' + encoding);
              encoding = ('' + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer.prototype.toJSON = function toJSON() {
        return {
          type: 'Buffer',
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          // @ts-ignore
          return base64.fromByteArray(buf);
        }
        else {
          // @ts-ignore
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        var res = [];
        var i = start;
        while (i < end) {
          var firstByte = buf[i];
          var codePoint = null;
          var bytesPerSequence = (firstByte > 0xEF) ? 4
            : (firstByte > 0xDF) ? 3
              : (firstByte > 0xBF) ? 2
                : 1;
          if (i + bytesPerSequence <= end) {
            var secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 0x80) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                  if (tempCodePoint > 0x7F) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                  if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                  tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                  if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            // we did not generate a valid codePoint so insert a
            // replacement char (U+FFFD) and advance only 1 byte
            codePoint = 0xFFFD;
            bytesPerSequence = 1;
          }
          else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000;
            res.push(codePoint >>> 10 & 0x3FF | 0xD800);
            codePoint = 0xDC00 | codePoint & 0x3FF;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
      var MAX_ARGUMENTS_LENGTH = 0x1000;
      function decodeCodePointsArray(codePoints) {
        var len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
        }
        // Decode in chunks to avoid "call stack size exceeded".
        var res = '';
        var i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        var ret = '';
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 0x7F);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        var ret = '';
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        var len = buf.length;
        if (!start || start < 0)
          start = 0;
        if (!end || end < 0 || end > len)
          end = len;
        var out = '';
        for (var i = start; i < end; ++i) {
          out += toHex(buf[i]);
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        var bytes = buf.slice(start, end);
        var res = '';
        for (var i = 0; i < bytes.length; i += 2) {
          res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
        }
        return res;
      }
      Buffer.prototype.slice = function slice(start, end) {
        var len = this.length;
        start = ~~start;
        end = end === undefined ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0)
            start = 0;
        }
        else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0)
            end = 0;
        }
        else if (end > len) {
          end = len;
        }
        if (end < start)
          end = start;
        var newBuf = this.subarray(start, end);
        // Return an augmented `Uint8Array` instance
        newBuf.__proto__ = Buffer.prototype;
        return newBuf;
      };
      /*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
      function checkOffset(offset, ext, length) {
        if ((offset % 1) !== 0 || offset < 0)
          throw new RangeError('offset is not uint');
        if (offset + ext > length)
          throw new RangeError('Trying to access beyond buffer length');
      }
      Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert)
          checkOffset(offset, byteLength, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 0x100)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength, this.length);
        }
        var val = this[offset + --byteLength];
        var mul = 1;
        while (byteLength > 0 && (mul *= 0x100)) {
          val += this[offset + --byteLength] * mul;
        }
        return val;
      };
      Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 2, this.length);
        return this[offset] | (this[offset + 1] << 8);
      };
      Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 2, this.length);
        return (this[offset] << 8) | this[offset + 1];
      };
      Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        return ((this[offset]) |
            (this[offset + 1] << 8) |
            (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000);
      };
      Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        return (this[offset] * 0x1000000) +
          ((this[offset + 1] << 16) |
            (this[offset + 2] << 8) |
            this[offset + 3]);
      };
      Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert)
          checkOffset(offset, byteLength, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 0x100)) {
          val += this[offset + i] * mul;
        }
        mul *= 0x80;
        if (val >= mul)
          val -= Math.pow(2, 8 * byteLength);
        return val;
      };
      Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert)
          checkOffset(offset, byteLength, this.length);
        var i = byteLength;
        var mul = 1;
        var val = this[offset + --i];
        while (i > 0 && (mul *= 0x100)) {
          val += this[offset + --i] * mul;
        }
        mul *= 0x80;
        if (val >= mul)
          val -= Math.pow(2, 8 * byteLength);
        return val;
      };
      Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 1, this.length);
        if (!(this[offset] & 0x80))
          return (this[offset]);
        return ((0xff - this[offset] + 1) * -1);
      };
      Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 2, this.length);
        var val = this[offset] | (this[offset + 1] << 8);
        return (val & 0x8000) ? val | 0xFFFF0000 : val;
      };
      Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 2, this.length);
        var val = this[offset + 1] | (this[offset] << 8);
        return (val & 0x8000) ? val | 0xFFFF0000 : val;
      };
      Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        return (this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16) |
          (this[offset + 3] << 24);
      };
      Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        return (this[offset] << 24) |
          (this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          (this[offset + 3]);
      };
      Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        // @ts-ignore
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 4, this.length);
        // @ts-ignore
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 8, this.length);
        // @ts-ignore
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert)
          checkOffset(offset, 8, this.length);
        // @ts-ignore
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer.isBuffer(buf))
          throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min)
          throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length)
          throw new RangeError('Index out of range');
      }
      Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1;
          checkInt(this, value, offset, byteLength, maxBytes, 0);
        }
        var mul = 1;
        var i = 0;
        this[offset] = value & 0xFF;
        while (++i < byteLength && (mul *= 0x100)) {
          this[offset + i] = (value / mul) & 0xFF;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1;
          checkInt(this, value, offset, byteLength, maxBytes, 0);
        }
        var i = byteLength - 1;
        var mul = 1;
        this[offset + i] = value & 0xFF;
        while (--i >= 0 && (mul *= 0x100)) {
          this[offset + i] = (value / mul) & 0xFF;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 1, 0xff, 0);
        this[offset] = (value & 0xff);
        return offset + 1;
      };
      Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        return offset + 2;
      };
      Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
        return offset + 2;
      };
      Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
        return offset + 4;
      };
      Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
        return offset + 4;
      };
      Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          var limit = Math.pow(2, (8 * byteLength) - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = 0;
        var mul = 1;
        var sub = 0;
        this[offset] = value & 0xFF;
        while (++i < byteLength && (mul *= 0x100)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          var limit = Math.pow(2, (8 * byteLength) - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = byteLength - 1;
        var mul = 1;
        var sub = 0;
        this[offset + i] = value & 0xFF;
        while (--i >= 0 && (mul *= 0x100)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 1, 0x7f, -0x80);
        if (value < 0)
          value = 0xff + value + 1;
        this[offset] = (value & 0xff);
        return offset + 1;
      };
      Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 2, 0x7fff, -0x8000);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        return offset + 2;
      };
      Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 2, 0x7fff, -0x8000);
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
        return offset + 2;
      };
      Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        this[offset + 2] = (value >>> 16);
        this[offset + 3] = (value >>> 24);
        return offset + 4;
      };
      Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert)
          checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
        if (value < 0)
          value = 0xffffffff + value + 1;
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
        return offset + 4;
      };
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length)
          throw new RangeError('Index out of range');
        if (offset < 0)
          throw new RangeError('Index out of range');
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
        }
        // @ts-ignore
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
        }
        // @ts-ignore
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
      Buffer.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer.isBuffer(target))
          throw new TypeError('argument should be a Buffer');
        if (!start)
          start = 0;
        if (!end && end !== 0)
          end = this.length;
        if (targetStart >= target.length)
          targetStart = target.length;
        if (!targetStart)
          targetStart = 0;
        if (end > 0 && end < start)
          end = start;
        // Copy 0 bytes; we're done
        if (end === start)
          return 0;
        if (target.length === 0 || this.length === 0)
          return 0;
        // Fatal error conditions
        if (targetStart < 0) {
          throw new RangeError('targetStart out of bounds');
        }
        if (start < 0 || start >= this.length)
          throw new RangeError('Index out of range');
        if (end < 0)
          throw new RangeError('sourceEnd out of bounds');
        // Are we oob?
        if (end > this.length)
          end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        var len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
          // Use built-in when available, missing from IE11
          this.copyWithin(targetStart, start, end);
        }
        else if (this === target && start < targetStart && targetStart < end) {
          // descending copy from end
          for (var i = len - 1; i >= 0; --i) {
            target[i + targetStart] = this[i + start];
          }
        }
        else {
          Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
        }
        return len;
      };
// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
      Buffer.prototype.fill = function fill(val, start, end, encoding) {
        // Handle string cases:
        if (typeof val === 'string') {
          if (typeof start === 'string') {
            encoding = start;
            start = 0;
            end = this.length;
          }
          else if (typeof end === 'string') {
            encoding = end;
            end = this.length;
          }
          if (encoding !== undefined && typeof encoding !== 'string') {
            throw new TypeError('encoding must be a string');
          }
          if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
            throw new TypeError('Unknown encoding: ' + encoding);
          }
          if (val.length === 1) {
            var code = val.charCodeAt(0);
            if ((encoding === 'utf8' && code < 128) ||
              encoding === 'latin1') {
              // Fast path: If `val` fits into a single byte, use that numeric value.
              val = code;
            }
          }
        }
        else if (typeof val === 'number') {
          val = val & 255;
        }
        // Invalid ranges are not set to a default, so can range check early.
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError('Out of range index');
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === undefined ? this.length : end >>> 0;
        if (!val)
          val = 0;
        var i;
        if (typeof val === 'number') {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        }
        else {
          var bytes = Buffer.isBuffer(val)
            ? val
            // @ts-ignore
            : Buffer.from(val, encoding);
          var len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val +
              '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
// HELPER FUNCTIONS
// ================
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        // Node takes equal signs as end of the Base64 encoding
        str = str.split('=')[0];
        // Node strips out invalid characters like \n and \t from the string, base64-js does not
        str = str.trim().replace(INVALID_BASE64_RE, '');
        // Node converts strings with length < 2 to ''
        if (str.length < 2)
          return '';
        // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
        while (str.length % 4 !== 0) {
          str = str + '=';
        }
        return str;
      }
      function toHex(n) {
        if (n < 16)
          return '0' + n.toString(16);
        return n.toString(16);
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        var codePoint;
        var length = string.length;
        var leadSurrogate = null;
        var bytes = [];
        for (var i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          // is surrogate component
          if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
              // no lead yet
              if (codePoint > 0xDBFF) {
                // unexpected trail
                if ((units -= 3) > -1)
                  bytes.push(0xEF, 0xBF, 0xBD);
                continue;
              }
              else if (i + 1 === length) {
                // unpaired lead
                if ((units -= 3) > -1)
                  bytes.push(0xEF, 0xBF, 0xBD);
                continue;
              }
              // valid lead
              leadSurrogate = codePoint;
              continue;
            }
            // 2 leads in a row
            if (codePoint < 0xDC00) {
              if ((units -= 3) > -1)
                bytes.push(0xEF, 0xBF, 0xBD);
              leadSurrogate = codePoint;
              continue;
            }
            // valid surrogate pair
            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
          }
          else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            if ((units -= 3) > -1)
              bytes.push(0xEF, 0xBF, 0xBD);
          }
          leadSurrogate = null;
          // encode utf8
          if (codePoint < 0x80) {
            if ((units -= 1) < 0)
              break;
            bytes.push(codePoint);
          }
          else if (codePoint < 0x800) {
            if ((units -= 2) < 0)
              break;
            bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
          }
          else if (codePoint < 0x10000) {
            if ((units -= 3) < 0)
              break;
            bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
          }
          else if (codePoint < 0x110000) {
            if ((units -= 4) < 0)
              break;
            bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
          }
          else {
            throw new Error('Invalid code point');
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
          // Node's code seems to be doing this and not & 0x7F..
          byteArray.push(str.charCodeAt(i) & 0xFF);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        var c, hi, lo;
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0)
            break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        // @ts-ignore
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length; ++i) {
          if ((i + offset >= dst.length) || (i >= src.length))
            break;
          dst[i + offset] = src[i];
        }
        return i;
      }
// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
      function isInstance(obj, type) {
        return obj instanceof type ||
          (obj != null && obj.constructor != null && obj.constructor.name != null &&
            obj.constructor.name === type.name);
      }
      function numberIsNaN(obj) {
        // For IE11 support
        return obj !== obj; // eslint-disable-line no-self-compare
      }

    }).call(this)}).call(this,require("buffer").Buffer)

  },{"base64-js":1,"buffer":2,"ieee754":3}],10:[function(require,module,exports){
    "use strict";
// https://gist.github.com/mudge/5830382#gistcomment-2658721
    var __spreadArrays = (this && this.__spreadArrays) || function () {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
      return r;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventEmitter = void 0;
    var EventEmitter = /** @class */ (function () {
      function EventEmitter() {
        this.events = {};
      }
      EventEmitter.prototype.on = function (event, listener) {
        var _this = this;
        if (typeof this.events[event] !== 'object') {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return function () { return _this.removeListener(event, listener); };
      };
      EventEmitter.prototype.removeListener = function (event, listener) {
        if (typeof this.events[event] !== 'object') {
          return;
        }
        var idx = this.events[event].indexOf(listener);
        if (idx > -1) {
          this.events[event].splice(idx, 1);
        }
      };
      EventEmitter.prototype.removeAllListeners = function () {
        var _this = this;
        Object.keys(this.events).forEach(function (event) { return _this.events[event].splice(0, _this.events[event].length); });
      };
      EventEmitter.prototype.emit = function (event) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
        }
        if (typeof this.events[event] !== 'object') {
          return;
        }
        __spreadArrays(this.events[event]).forEach(function (listener) { return listener.apply(_this, args); });
      };
      EventEmitter.prototype.once = function (event, listener) {
        var _this = this;
        var remove = this.on(event, function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          remove();
          listener.apply(_this, args);
        });
        return remove;
      };
      return EventEmitter;
    }());
    exports.EventEmitter = EventEmitter;

  },{}],11:[function(require,module,exports){
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Hub = void 0;
    var eventEmitter_1 = require("../helpers/eventEmitter");
    var buffer_1 = require("../helpers/buffer");
    var Hub = /** @class */ (function () {
      function Hub(bluetooth) {
        this.emitter = new eventEmitter_1.EventEmitter();
        this.autoSubscribe = true;
        this.writeCue = [];
        this.isWriting = false;
        this.bluetooth = bluetooth;
        this.log = console.log;
        this.autoSubscribe = true;
        this.ports = {};
        this.num2type = {
          23: 'LED',
          37: 'DISTANCE',
          38: 'IMOTOR',
          39: 'MOTOR',
          40: 'TILT',
        };
        this.port2num = {
          A: 0x00,
          B: 0x01,
          C: 0x02,
          D: 0x03,
          AB: 0x10,
          LED: 0x32,
          TILT: 0x3a,
        };
        this.num2port = Object.entries(this.port2num).reduce(function (acc, _a) {
          var port = _a[0], portNum = _a[1];
          acc[portNum] = port;
          return acc;
        }, {});
        this.num2action = {
          1: 'start',
          5: 'conflict',
          10: 'stop',
        };
        this.num2color = {
          0: 'black',
          3: 'blue',
          5: 'green',
          7: 'yellow',
          9: 'red',
          10: 'white',
        };
        this.ledColors = [
          'off',
          'pink',
          'purple',
          'blue',
          'lightblue',
          'cyan',
          'green',
          'yellow',
          'orange',
          'red',
          'white',
        ];
        this.addListeners();
      }
      Hub.prototype.emit = function (type, data) {
        if (data === void 0) { data = null; }
        this.emitter.emit(type, data);
      };
      Hub.prototype.addListeners = function () {
        var _this = this;
        this.bluetooth.addEventListener('characteristicvaluechanged', function (event) {
          // https://googlechrome.github.io/samples/web-bluetooth/read-characteristic-value-changed.html
          // @ts-ignore
          var data = buffer_1.Buffer.from(event.target.value.buffer);
          _this.parseMessage(data);
        });
        setTimeout(function () {
          // Without timout missed first characteristicvaluechanged events
          _this.bluetooth.startNotifications();
        }, 1000);
      };
      Hub.prototype.parseMessage = function (data) {
        var _this = this;
        switch (data[2]) {
          case 0x04: {
            clearTimeout(this.portInfoTimeout);
            this.portInfoTimeout = setTimeout(function () {
              /**
               * Fires when a connection to the Move Hub is established
               * @event Hub#connect
               */
              if (_this.autoSubscribe) {
                _this.subscribeAll();
              }
              if (!_this.connected) {
                _this.connected = true;
                _this.emit('connect');
              }
            }, 1000);
            this.log('Found: ' + this.num2type[data[5]]);
            this.logDebug('Found', data);
            if (data[4] === 0x01) {
              this.ports[data[3]] = {
                type: 'port',
                deviceType: this.num2type[data[5]],
                deviceTypeNum: data[5],
              };
            }
            else if (data[4] === 0x02) {
              this.ports[data[3]] = {
                type: 'group',
                deviceType: this.num2type[data[5]],
                deviceTypeNum: data[5],
                members: [data[7], data[8]],
              };
            }
            break;
          }
          case 0x05: {
            this.log('Malformed message');
            this.log('<', data);
            break;
          }
          case 0x45: {
            this.parseSensor(data);
            break;
          }
          case 0x47: {
            // 0x47 subscription acknowledgements
            // https://github.com/JorgePe/BOOSTreveng/blob/master/Notifications.md
            break;
          }
          case 0x82: {
            /**
             * Fires on port changes
             * @event Hub#port
             * @param port {object}
             * @param port.port {string}
             * @param port.action {string}
             */
            this.emit('port', {
              port: this.num2port[data[3]],
              action: this.num2action[data[4]],
            });
            break;
          }
          default:
            this.log('unknown message type 0x' + data[2].toString(16));
            this.log('<', data);
        }
      };
      Hub.prototype.parseSensor = function (data) {
        if (!this.ports[data[3]]) {
          this.log('parseSensor unknown port 0x' + data[3].toString(16));
          return;
        }
        switch (this.ports[data[3]].deviceType) {
          case 'DISTANCE': {
            /**
             * @event Hub#color
             * @param color {string}
             */
            this.emit('color', this.num2color[data[4]]);
            // TODO: improve distance calculation!
            var distance = void 0;
            if (data[7] > 0 && data[5] < 2) {
              distance = Math.floor(20 - data[7] * 2.85);
            }
            else if (data[5] > 9) {
              distance = Infinity;
            }
            else {
              distance = Math.floor(20 + data[5] * 18);
            }
            /**
             * @event Hub#distance
             * @param distance {number} distance in millimeters
             */
            this.emit('distance', distance);
            break;
          }
          case 'TILT': {
            var roll = data.readInt8(4);
            var pitch = data.readInt8(5);
            /**
             * @event Hub#tilt
             * @param tilt {object}
             * @param tilt.roll {number}
             * @param tilt.pitch {number}
             */
            this.emit('tilt', { roll: roll, pitch: pitch });
            break;
          }
          case 'MOTOR':
          case 'IMOTOR': {
            var angle = data.readInt32LE(4);
            /**
             * @event Hub#rotation
             * @param rotation {object}
             * @param rotation.port {string}
             * @param rotation.angle
             */
            this.emit('rotation', {
              port: this.num2port[data[3]],
              angle: angle,
            });
            break;
          }
          default:
            this.log('unknown sensor type 0x' + data[3].toString(16), data[3], this.ports[data[3]].deviceType);
        }
      };
      /**
       * Set Move Hub as disconnected
       * @method Hub#setDisconnected
       */
      Hub.prototype.setDisconnected = function () {
        // TODO: Should get this from some notification?
        this.connected = false;
        this.noReconnect = true;
        this.writeCue = [];
      };
      /**
       * Run a motor for specific time
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} seconds
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {function} [callback]
       */
      Hub.prototype.motorTime = function (port, seconds, dutyCycle, callback) {
        if (typeof dutyCycle === 'function') {
          callback = dutyCycle;
          dutyCycle = 100;
        }
        var portNum = typeof port === 'string' ? this.port2num[port] : port;
        this.write(this.encodeMotorTime(portNum, seconds, dutyCycle), callback);
      };
      /**
       * Run both motors (A and B) for specific time
       * @param {number} seconds
       * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {function} callback
       */
      Hub.prototype.motorTimeMulti = function (seconds, dutyCycleA, dutyCycleB, callback) {
        this.write(this.encodeMotorTimeMulti(this.port2num['AB'], seconds, dutyCycleA, dutyCycleB), callback);
      };
      /**
       * Turn a motor by specific angle
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} angle - degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {function} [callback]
       */
      Hub.prototype.motorAngle = function (port, angle, dutyCycle, callback) {
        if (typeof dutyCycle === 'function') {
          callback = dutyCycle;
          dutyCycle = 100;
        }
        var portNum = typeof port === 'string' ? this.port2num[port] : port;
        this.write(this.encodeMotorAngle(portNum, angle, dutyCycle), callback);
      };
      /**
       * Turn both motors (A and B) by specific angle
       * @param {number} angle degrees to turn from `0` to `2147483647`
       * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {function} callback
       */
      Hub.prototype.motorAngleMulti = function (angle, dutyCycleA, dutyCycleB, callback) {
        this.write(this.encodeMotorAngleMulti(this.port2num['AB'], angle, dutyCycleA, dutyCycleB), callback);
      };
      /**
       * Send raw data
       * @param {object} raw raw data
       * @param {function} callback
       */
      Hub.prototype.rawCommand = function (raw, callback) {
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        for (var idx in raw) {
          buf.writeIntLE(raw[idx], idx);
        }
        this.write(buf, callback);
      };
      Hub.prototype.motorPowerCommand = function (port, power) {
        this.write(this.encodeMotorPower(port, power));
      };
      //[0x09, 0x00, 0x81, 0x39, 0x11, 0x07, 0x00, 0x64, 0x03]
      Hub.prototype.encodeMotorPower = function (port, dutyCycle) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        var portNum = typeof port === 'string' ? this.port2num[port] : port;
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x09, 0x00, 0x81, portNum, 0x11, 0x07, 0x00, 0x64, 0x03]);
        //buf.writeUInt16LE(seconds * 1000, 6);
        buf.writeInt8(dutyCycle, 6);
        return buf;
      };
      //0x0C, 0x00, 0x81, port, 0x11, 0x09, 0x00, 0x00, 0x00, 0x64, 0x7F, 0x03
      /**
       * Control the LED on the Move Hub
       * @method Hub#led
       * @param {boolean|number|string} color
       * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
       * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
       * `white`
       * @param {function} [callback]
       */
      Hub.prototype.led = function (color, callback) {
        this.write(this.encodeLed(color), callback);
      };
      /**
       * Subscribe for sensor notifications
       * @param {string|number} port - e.g. call `.subscribe('C')` if you have your distance/color sensor on port C.
       * @param {number} [option=0] Unknown meaning. Needs to be 0 for distance/color, 2 for motors, 8 for tilt
       * @param {function} [callback]
       */
      Hub.prototype.subscribe = function (port, option, callback) {
        if (option === void 0) { option = 0; }
        if (typeof option === 'function') {
          // TODO: Why we have function check here?
          callback = option;
          option = 0x00;
        }
        var portNum = typeof port === 'string' ? this.port2num[port] : port;
        this.write(
          // @ts-ignore
          buffer_1.Buffer.from([0x0a, 0x00, 0x41, portNum, option, 0x01, 0x00, 0x00, 0x00, 0x01]), callback);
      };
      /**
       * Unsubscribe from sensor notifications
       * @param {string|number} port
       * @param {number} [option=0] Unknown meaning. Needs to be 0 for distance/color, 2 for motors, 8 for tilt
       * @param {function} [callback]
       */
      Hub.prototype.unsubscribe = function (port, option, callback) {
        if (option === void 0) { option = 0; }
        if (typeof option === 'function') {
          callback = option;
          option = 0x00;
        }
        var portNum = typeof port === 'string' ? this.port2num[port] : port;
        this.write(
          // @ts-ignore
          buffer_1.Buffer.from([0x0a, 0x00, 0x41, portNum, option, 0x01, 0x00, 0x00, 0x00, 0x00]), callback);
      };
      Hub.prototype.subscribeAll = function () {
        var _this = this;
        Object.entries(this.ports).forEach(function (_a) {
          var port = _a[0], data = _a[1];
          if (data.deviceType === 'DISTANCE') {
            _this.subscribe(parseInt(port, 10), 8);
          }
          else if (data.deviceType === 'TILT') {
            _this.subscribe(parseInt(port, 10), 0);
          }
          else if (data.deviceType === 'IMOTOR') {
            _this.subscribe(parseInt(port, 10), 2);
          }
          else if (data.deviceType === 'MOTOR') {
            _this.subscribe(parseInt(port, 10), 2);
          }
          else {
            _this.logDebug("Port subscribtion not sent: " + port);
          }
        });
      };
      /**
       * Send data over BLE
       * @method Hub#write
       * @param {string|Buffer} data If a string is given it has to have hex bytes separated by spaces, e.g. `0a 01 c3 b2`
       * @param {function} callback
       */
      Hub.prototype.write = function (data, callback) {
        if (typeof data === 'string') {
          var arr_1 = [];
          data.split(' ').forEach(function (c) {
            arr_1.push(parseInt(c, 16));
          });
          // @ts-ignore
          data = buffer_1.Buffer.from(arr_1);
        }
        // Original implementation passed secondArg to define if response is waited
        this.writeCue.push({
          data: data,
          secondArg: true,
          callback: callback,
        });
        this.writeFromCue();
      };
      Hub.prototype.writeFromCue = function () {
        var _this = this;
        if (this.writeCue.length === 0 || this.isWriting)
          return;
        var el = this.writeCue.shift();
        this.logDebug('Writing to device', el);
        this.isWriting = true;
        this.bluetooth
          .writeValue(el.data)
          .then(function () {
            _this.isWriting = false;
            if (typeof el.callback === 'function')
              el.callback();
          })
          .catch(function (err) {
            _this.isWriting = false;
            _this.log("Error while writing: " + el.data + " - Error " + err.toString());
            // TODO: Notify of failure
          })
          .finally(function () {
            _this.writeFromCue();
          });
      };
      Hub.prototype.encodeMotorTimeMulti = function (port, seconds, dutyCycleA, dutyCycleB) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = -100; }
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x0d, 0x00, 0x81, port, 0x11, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x64, 0x7f, 0x03]);
        buf.writeUInt16LE(seconds * 1000, 6);
        buf.writeInt8(dutyCycleA, 8);
        buf.writeInt8(dutyCycleB, 9);
        return buf;
      };
      Hub.prototype.encodeMotorTime = function (port, seconds, dutyCycle) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x0c, 0x00, 0x81, port, 0x11, 0x09, 0x00, 0x00, 0x00, 0x64, 0x7f, 0x03]);
        buf.writeUInt16LE(seconds * 1000, 6);
        buf.writeInt8(dutyCycle, 8);
        return buf;
      };
      Hub.prototype.encodeMotorAngleMulti = function (port, angle, dutyCycleA, dutyCycleB) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = -100; }
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x0f, 0x00, 0x81, port, 0x11, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x7f, 0x03]);
        buf.writeUInt32LE(angle, 6);
        buf.writeInt8(dutyCycleA, 10);
        buf.writeInt8(dutyCycleB, 11);
        return buf;
      };
      Hub.prototype.encodeMotorAngle = function (port, angle, dutyCycle) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        // @ts-ignore
        var buf = buffer_1.Buffer.from([0x0e, 0x00, 0x81, port, 0x11, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x7f, 0x03]);
        buf.writeUInt32LE(angle, 6);
        buf.writeInt8(dutyCycle, 10);
        return buf;
      };
      Hub.prototype.encodeLed = function (color) {
        if (typeof color === 'boolean') {
          color = color ? 'white' : 'off';
        }
        var colorNum = typeof color === 'string' ? this.ledColors.indexOf(color) : color;
        // @ts-ignore
        return buffer_1.Buffer.from([0x08, 0x00, 0x81, 0x32, 0x11, 0x51, 0x00, colorNum]);
      };
      return Hub;
    }());
    exports.Hub = Hub;

  },{"../helpers/buffer":9,"../helpers/eventEmitter":10}],12:[function(require,module,exports){
    "use strict";
    var __extends = (this && this.__extends) || (function () {
      var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
      };
      return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0: case 1: t = op; break;
            case 4: _.label++; return { value: op[1], done: false };
            case 5: _.label++; y = op[1]; op = [0]; continue;
            case 7: op = _.ops.pop(); _.trys.pop(); continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
              if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
              if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
              if (t[2]) _.ops.pop();
              _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HubAsync = exports.DEFAULT_CONFIG = void 0;
    var hub_1 = require("./hub");
    var CALLBACK_TIMEOUT_MS = 1000 / 3;
    exports.DEFAULT_CONFIG = {
      METRIC_MODIFIER: 28.5,
      TURN_MODIFIER: 2.56,
      DRIVE_SPEED: 25,
      TURN_SPEED: 20,
      DEFAULT_STOP_DISTANCE: 105,
      DEFAULT_CLEAR_DISTANCE: 120,
      LEFT_MOTOR: 'A',
      RIGHT_MOTOR: 'B',
      VALID_MOTORS: ['A', 'B'],
    };
    var validateConfiguration = function (configuration) {
      configuration.leftMotor = configuration.leftMotor || exports.DEFAULT_CONFIG.LEFT_MOTOR;
      configuration.rightMotor = configuration.rightMotor || exports.DEFAULT_CONFIG.RIGHT_MOTOR;
      // @ts-ignore
      if (!exports.DEFAULT_CONFIG.VALID_MOTORS.includes(configuration.leftMotor))
        throw Error('Define left port port correctly');
      // @ts-ignore
      if (!exports.DEFAULT_CONFIG.VALID_MOTORS.includes(configuration.rightMotor))
        throw Error('Define right port port correctly');
      if (configuration.leftMotor === configuration.rightMotor)
        throw Error('Left and right motor can not be same');
      configuration.distanceModifier = configuration.distanceModifier || exports.DEFAULT_CONFIG.METRIC_MODIFIER;
      configuration.turnModifier = configuration.turnModifier || exports.DEFAULT_CONFIG.TURN_MODIFIER;
      configuration.driveSpeed = configuration.driveSpeed || exports.DEFAULT_CONFIG.DRIVE_SPEED;
      configuration.turnSpeed = configuration.turnSpeed || exports.DEFAULT_CONFIG.TURN_SPEED;
      configuration.defaultStopDistance = configuration.defaultStopDistance || exports.DEFAULT_CONFIG.DEFAULT_STOP_DISTANCE;
      configuration.defaultClearDistance = configuration.defaultClearDistance || exports.DEFAULT_CONFIG.DEFAULT_CLEAR_DISTANCE;
    };
    var waitForValueToSet = function (valueName, compareFunc, timeoutMs) {
      var _this = this;
      if (compareFunc === void 0) { compareFunc = function (valueNameToCompare) { return _this[valueNameToCompare]; }; }
      if (timeoutMs === void 0) { timeoutMs = 0; }
      if (compareFunc.bind(this)(valueName))
        return Promise.resolve(this[valueName]);
      return new Promise(function (resolve, reject) {
        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _a = resolve;
              return [4 /*yield*/, waitForValueToSet.bind(this)(valueName, compareFunc, timeoutMs)];
            case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
          }
        }); }); }, timeoutMs + 100);
      });
    };
    var HubAsync = /** @class */ (function (_super) {
      __extends(HubAsync, _super);
      function HubAsync(bluetooth, configuration) {
        var _this = _super.call(this, bluetooth) || this;
        validateConfiguration(configuration);
        _this.configuration = configuration;
        return _this;
      }
      /**
       * Disconnect Hub
       * @method Hub#disconnectAsync
       * @returns {Promise<boolean>} disconnection successful
       */
      HubAsync.prototype.disconnectAsync = function () {
        this.setDisconnected();
        return waitForValueToSet.bind(this)('hubDisconnected');
      };
      /**
       * Execute this method after new instance of Hub is created
       * @method Hub#afterInitialization
       */
      HubAsync.prototype.afterInitialization = function () {
        var _this = this;
        this.hubDisconnected = null;
        this.portData = {
          A: { angle: 0 },
          B: { angle: 0 },
          AB: { angle: 0 },
          C: { angle: 0 },
          D: { angle: 0 },
          LED: { angle: 0 },
        };
        this.useMetric = true;
        this.modifier = 1;
        this.emitter.on('rotation', function (rotation) { return (_this.portData[rotation.port].angle = rotation.angle); });
        this.emitter.on('disconnect', function () { return (_this.hubDisconnected = true); });
        this.emitter.on('distance', function (distance) { return (_this.distance = distance); });
      };
      /**
       * Control the LED on the Move Hub
       * @method Hub#ledAsync
       * @param {boolean|number|string} color
       * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
       * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
       * `white`
       * @returns {Promise}
       */
      HubAsync.prototype.ledAsync = function (color) {
        var _this = this;
        return new Promise(function (resolve, reject) {
          _this.led(color, function () {
            // Callback is executed when command is sent and it will take some time before MoveHub executes the command
            setTimeout(resolve, CALLBACK_TIMEOUT_MS);
          });
        });
      };
      /**
       * Run a motor for specific time
       * @method Hub#motorTimeAsync
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} seconds
       * @param {number} [dutyCycle=100] motor power percentsage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
       * @returns {Promise}
       */
      HubAsync.prototype.motorTimeAsync = function (port, seconds, dutyCycle, wait) {
        var _this = this;
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (wait === void 0) { wait = false; }
        return new Promise(function (resolve, _) {
          _this.motorTime(port, seconds, dutyCycle, function () {
            setTimeout(resolve, wait ? CALLBACK_TIMEOUT_MS + seconds * 1000 : CALLBACK_TIMEOUT_MS);
          });
        });
      };
      /**
       * Run both motors (A and B) for specific time
       * @method Hub#motorTimeMultiAsync
       * @param {number} seconds
       * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
       * @returns {Promise}
       */
      HubAsync.prototype.motorTimeMultiAsync = function (seconds, dutyCycleA, dutyCycleB, wait) {
        var _this = this;
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (wait === void 0) { wait = false; }
        return new Promise(function (resolve, _) {
          _this.motorTimeMulti(seconds, dutyCycleA, dutyCycleB, function () {
            setTimeout(resolve, wait ? CALLBACK_TIMEOUT_MS + seconds * 1000 : CALLBACK_TIMEOUT_MS);
          });
        });
      };
      /**
       * Turn a motor by specific angle
       * @method Hub#motorAngleAsync
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} angle - degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
       * @returns {Promise}
       */
      HubAsync.prototype.motorAngleAsync = function (port, angle, dutyCycle, wait) {
        var _this = this;
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (wait === void 0) { wait = false; }
        return new Promise(function (resolve, _) {
          _this.motorAngle(port, angle, dutyCycle, function () { return __awaiter(_this, void 0, void 0, function () {
            var beforeTurn;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  if (!wait) return [3 /*break*/, 5];
                  beforeTurn = void 0;
                  _a.label = 1;
                case 1:
                  beforeTurn = this.portData[port].angle;
                  return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, CALLBACK_TIMEOUT_MS); })];
                case 2:
                  _a.sent();
                  _a.label = 3;
                case 3:
                  if (this.portData[port].angle !== beforeTurn) return [3 /*break*/, 1];
                  _a.label = 4;
                case 4:
                  resolve();
                  return [3 /*break*/, 6];
                case 5:
                  setTimeout(resolve, CALLBACK_TIMEOUT_MS);
                  _a.label = 6;
                case 6: return [2 /*return*/];
              }
            });
          }); });
        });
      };
      /**
       * Turn both motors (A and B) by specific angle
       * @method Hub#motorAngleMultiAsync
       * @param {number} angle degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
       * @returns {Promise}
       */
      HubAsync.prototype.motorAngleMultiAsync = function (angle, dutyCycleA, dutyCycleB, wait) {
        var _this = this;
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (wait === void 0) { wait = false; }
        return new Promise(function (resolve, _) {
          _this.motorAngleMulti(angle, dutyCycleA, dutyCycleB, function () { return __awaiter(_this, void 0, void 0, function () {
            var beforeTurn;
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  if (!wait) return [3 /*break*/, 5];
                  beforeTurn = void 0;
                  _a.label = 1;
                case 1:
                  beforeTurn = this.portData['AB'].angle;
                  return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, CALLBACK_TIMEOUT_MS); })];
                case 2:
                  _a.sent();
                  _a.label = 3;
                case 3:
                  if (this.portData['AB'].angle !== beforeTurn) return [3 /*break*/, 1];
                  _a.label = 4;
                case 4:
                  resolve();
                  return [3 /*break*/, 6];
                case 5:
                  setTimeout(resolve, CALLBACK_TIMEOUT_MS);
                  _a.label = 6;
                case 6: return [2 /*return*/];
              }
            });
          }); });
        });
      };
      /**
       * Use metric units (default)
       * @method Hub#useMetricUnits
       */
      HubAsync.prototype.useMetricUnits = function () {
        this.useMetric = true;
      };
      /**
       * Use imperial units
       * @method Hub#useImperialUnits
       */
      HubAsync.prototype.useImperialUnits = function () {
        this.useMetric = false;
      };
      /**
       * Set friction modifier
       * @method Hub#setFrictionModifier
       * @param {number} modifier friction modifier
       */
      HubAsync.prototype.setFrictionModifier = function (modifier) {
        this.modifier = modifier;
      };
      /**
       * Drive specified distance
       * @method Hub#drive
       * @param {number} distance distance in centimeters (default) or inches. Positive is forward and negative is backward.
       * @param {boolean} [wait=true] will promise wait untill the drive has completed.
       * @returns {Promise}
       */
      HubAsync.prototype.drive = function (distance, wait) {
        if (wait === void 0) { wait = true; }
        var angle = Math.abs(distance) *
          ((this.useMetric ? this.configuration.distanceModifier : this.configuration.distanceModifier / 4) *
            this.modifier);
        var dutyCycleA = this.configuration.driveSpeed * (distance > 0 ? 1 : -1) * (this.configuration.leftMotor === 'A' ? 1 : -1);
        var dutyCycleB = this.configuration.driveSpeed * (distance > 0 ? 1 : -1) * (this.configuration.leftMotor === 'A' ? 1 : -1);
        return this.motorAngleMultiAsync(angle, dutyCycleA, dutyCycleB, wait);
      };
      /**
       * Turn robot specified degrees
       * @method Hub#turn
       * @param {number} degrees degrees to turn. Negative is to the left and positive to the right.
       * @param {boolean} [wait=true] will promise wait untill the turn has completed.
       * @returns {Promise}
       */
      HubAsync.prototype.turn = function (degrees, wait) {
        if (wait === void 0) { wait = true; }
        var angle = Math.abs(degrees) * this.configuration.turnModifier;
        var turnMotorModifier = this.configuration.leftMotor === 'A' ? 1 : -1;
        var leftTurn = this.configuration.turnSpeed * (degrees > 0 ? 1 : -1) * turnMotorModifier;
        var rightTurn = this.configuration.turnSpeed * (degrees > 0 ? -1 : 1) * turnMotorModifier;
        var dutyCycleA = this.configuration.leftMotor === 'A' ? leftTurn : rightTurn;
        var dutyCycleB = this.configuration.leftMotor === 'A' ? rightTurn : leftTurn;
        return this.motorAngleMultiAsync(angle, dutyCycleA, dutyCycleB, wait);
      };
      /**
       * Drive untill sensor shows object in defined distance
       * @method Hub#driveUntil
       * @param {number} [distance=0] distance in centimeters (default) or inches when to stop. Distance sensor is not very sensitive or accurate.
       * By default will stop when sensor notices wall for the first time. Sensor distance values are usualy between 110-50.
       * @param {boolean} [wait=true] will promise wait untill the bot will stop.
       * @returns {Promise}
       */
      HubAsync.prototype.driveUntil = function (distance, wait) {
        if (distance === void 0) { distance = 0; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          var distanceCheck, direction, compareFunc;
          var _this = this;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                distanceCheck = distance !== 0 ? (this.useMetric ? distance : distance * 2.54) : this.configuration.defaultStopDistance;
                direction = this.configuration.leftMotor === 'A' ? 1 : -1;
                compareFunc = direction === 1 ? function () { return distanceCheck >= _this.distance; } : function () { return distanceCheck <= _this.distance; };
                this.motorTimeMulti(60, this.configuration.driveSpeed * direction, this.configuration.driveSpeed * direction);
                if (!wait) return [3 /*break*/, 3];
                return [4 /*yield*/, waitForValueToSet.bind(this)('distance', compareFunc)];
              case 1:
                _a.sent();
                return [4 /*yield*/, this.motorAngleMultiAsync(0)];
              case 2:
                _a.sent();
                return [3 /*break*/, 4];
              case 3: return [2 /*return*/, waitForValueToSet
                .bind(this)('distance', compareFunc)
                .then(function (_) { return _this.motorAngleMulti(0, 0, 0); })];
              case 4: return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Turn until there is no object in sensors sight
       * @method Hub#turnUntil
       * @param {number} [direction=1] direction to turn to. 1 (or any positive) is to the right and 0 (or any negative) is to the left.
       * @param {boolean} [wait=true] will promise wait untill the bot will stop.
       * @returns {Promise}
       */
      HubAsync.prototype.turnUntil = function (direction, wait) {
        if (direction === void 0) { direction = 1; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          var directionModifier;
          var _this = this;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                directionModifier = direction > 0 ? 1 : -1;
                this.turn(360 * directionModifier, false);
                if (!wait) return [3 /*break*/, 3];
                return [4 /*yield*/, waitForValueToSet.bind(this)('distance', function () { return _this.distance >= _this.configuration.defaultClearDistance; })];
              case 1:
                _a.sent();
                return [4 /*yield*/, this.turn(0, false)];
              case 2:
                _a.sent();
                return [3 /*break*/, 4];
              case 3: return [2 /*return*/, waitForValueToSet
                .bind(this)('distance', function () { return _this.distance >= _this.configuration.defaultClearDistance; })
                .then(function (_) { return _this.turn(0, false); })];
              case 4: return [2 /*return*/];
            }
          });
        });
      };
      HubAsync.prototype.updateConfiguration = function (configuration) {
        validateConfiguration(configuration);
        this.configuration = configuration;
      };
      return HubAsync;
    }(hub_1.Hub));
    exports.HubAsync = HubAsync;

  },{"./hub":11}],13:[function(require,module,exports){
    "use strict";
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0: case 1: t = op; break;
            case 4: _.label++; return { value: op[1], done: false };
            case 5: _.label++; y = op[1]; op = [0]; continue;
            case 7: op = _.ops.pop(); _.trys.pop(); continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
              if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
              if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
              if (t[2]) _.ops.pop();
              _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var boostConnector_1 = require("./boostConnector");
    var hubAsync_1 = require("./hub/hubAsync");
    var hub_control_1 = require("./ai/hub-control");
    var LegoBoost = /** @class */ (function () {
      function LegoBoost() {
        this.logDebug = function (s) { };
        /**
         * Information from Lego Boost motors and sensors
         * @property LegoBoost#deviceInfo
         */
        this.deviceInfo = {
          ports: {
            A: { action: '', angle: 0 },
            B: { action: '', angle: 0 },
            AB: { action: '', angle: 0 },
            C: { action: '', angle: 0 },
            D: { action: '', angle: 0 },
            LED: { action: '', angle: 0 },
          },
          tilt: { roll: 0, pitch: 0 },
          distance: Number.MAX_SAFE_INTEGER,
          rssi: 0,
          color: '',
          error: '',
          connected: false,
        };
        /**
         * Input data to used on manual and AI control
         * @property LegoBoost#controlData
         */
        this.controlData = {
          input: null,
          speed: 0,
          turnAngle: 0,
          tilt: { roll: 0, pitch: 0 },
          forceState: null,
          updateInputMode: null,
          controlUpdateTime: undefined,
          state: undefined,
        };
      }
      /**
       * Drive forward until wall is reaced or drive backwards 100meters
       * @method LegoBoost#connect
       * @param {BoostConfiguration} [configuration={}] Lego boost motor and control configuration
       * @returns {Promise}
       */
      LegoBoost.prototype.connect = function (configuration) {
        if (configuration === void 0) { configuration = {}; }
        return __awaiter(this, void 0, void 0, function () {
          var bluetooth, e_1;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                _a.trys.push([0, 2, , 3]);
                this.configuration = configuration;
                return [4 /*yield*/, boostConnector_1.BoostConnector.connect(this.handleGattDisconnect.bind(this))];
              case 1:
                bluetooth = _a.sent();
                this.initHub(bluetooth, this.configuration);
                return [3 /*break*/, 3];
              case 2:
                e_1 = _a.sent();
                console.log('Error from connect: ' + e_1);
                return [3 /*break*/, 3];
              case 3: return [2 /*return*/];
            }
          });
        });
      };
      LegoBoost.prototype.initHub = function (bluetooth, configuration) {
        return __awaiter(this, void 0, void 0, function () {
          var _this = this;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                this.hub = new hubAsync_1.HubAsync(bluetooth, configuration);
                this.hub.logDebug = this.logDebug;
                this.hub.emitter.on('disconnect', function (evt) { return __awaiter(_this, void 0, void 0, function () {
                  return __generator(this, function (_a) {
                    return [2 /*return*/];
                  });
                }); });
                this.hub.emitter.on('connect', function (evt) { return __awaiter(_this, void 0, void 0, function () {
                  return __generator(this, function (_a) {
                    switch (_a.label) {
                      case 0:
                        this.hub.afterInitialization();
                        return [4 /*yield*/, this.hub.ledAsync('white')];
                      case 1:
                        _a.sent();
                        this.logDebug('Connected');
                        return [2 /*return*/];
                    }
                  });
                }); });
                this.hubControl = new hub_control_1.HubControl(this.deviceInfo, this.controlData, configuration);
                return [4 /*yield*/, this.hubControl.start(this.hub)];
              case 1:
                _a.sent();
                this.updateTimer = setInterval(function () {
                  _this.hubControl.update();
                }, 100);
                return [2 /*return*/];
            }
          });
        });
      };
      LegoBoost.prototype.handleGattDisconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            this.logDebug('handleGattDisconnect');
            if (this.deviceInfo.connected === false)
              return [2 /*return*/];
            this.hub.setDisconnected();
            this.deviceInfo.connected = false;
            clearInterval(this.updateTimer);
            this.logDebug('Disconnected');
            return [2 /*return*/];
          });
        });
      };
      /**
       * Change the color of the led between pink and orange
       * @method LegoBoost#changeLed
       * @returns {Promise}
       */
      LegoBoost.prototype.changeLed = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.hub || this.hub.connected === false)
                  return [2 /*return*/];
                this.color = this.color === 'pink' ? 'orange' : 'pink';
                return [4 /*yield*/, this.hub.ledAsync(this.color)];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Drive forward until wall is reaced or drive backwards 100meters
       * @method LegoBoost#driveToDirection
       * @param {number} [direction=1] Direction to drive. 1 or positive is forward, 0 or negative is backwards.
       * @returns {Promise}
       */
      LegoBoost.prototype.driveToDirection = function (direction) {
        if (direction === void 0) { direction = 1; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                if (!(direction > 0)) return [3 /*break*/, 2];
                return [4 /*yield*/, this.hub.driveUntil()];
              case 1: return [2 /*return*/, _a.sent()];
              case 2: return [4 /*yield*/, this.hub.drive(-10000)];
              case 3: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Disconnect Lego Boost
       * @method LegoBoost#disconnect
       * @returns {boolean|undefined}
       */
      LegoBoost.prototype.disconnect = function () {
        if (!this.hub || this.hub.connected === false)
          return;
        this.hub.setDisconnected();
        var success = boostConnector_1.BoostConnector.disconnect();
        return success;
      };
      /**
       * Start AI mode
       * @method LegoBoost#ai
       */
      LegoBoost.prototype.ai = function () {
        if (!this.hub || this.hub.connected === false)
          return;
        this.hubControl.setNextState('Drive');
      };
      /**
       * Stop engines A and B
       * @method LegoBoost#stop
       * @returns {Promise}
       */
      LegoBoost.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                this.controlData.speed = 0;
                this.controlData.turnAngle = 0;
                return [4 /*yield*/, this.hub.motorTimeMultiAsync(1, 0, 0)];
              case 1:
                // control datas values might have always been 0, execute force stop
                return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Update Boost motor and control configuration
       * @method LegoBoost#updateConfiguration
       * @param {BoostConfiguration} configuration Boost motor and control configuration
       */
      LegoBoost.prototype.updateConfiguration = function (configuration) {
        if (!this.hub)
          return;
        this.hub.updateConfiguration(configuration);
        this.hubControl.updateConfiguration(configuration);
      };
      // Methods from Hub
      /**
       * Control the LED on the Move Hub
       * @method LegoBoost#led
       * @param {boolean|number|string} color
       * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
       * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
       * `white`
       */
      LegoBoost.prototype.led = function (color) {
        if (!this.preCheck())
          return;
        this.hub.led(color);
      };
      /**
       * Control the LED on the Move Hub
       * @method LegoBoost#ledAsync
       * @param {boolean|number|string} color
       * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
       * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
       * `white`
       * @returns {Promise}
       */
      LegoBoost.prototype.ledAsync = function (color) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.ledAsync(color)];
              case 1: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Run a motor for specific time
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} seconds
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       */
      LegoBoost.prototype.motorTime = function (port, seconds, dutyCycle) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (!this.preCheck())
          return;
        this.hub.motorTime(port, seconds, dutyCycle);
      };
      /**
       * Run a motor for specific time
       * @method LegoBoost#motorTimeAsync
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} seconds
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
       * @returns {Promise}
       */
      LegoBoost.prototype.motorTimeAsync = function (port, seconds, dutyCycle, wait) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.motorTimeAsync(port, seconds, dutyCycle, wait)];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Run both motors (A and B) for specific time
       * @param {number} seconds
       * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {function} callback
       */
      LegoBoost.prototype.motorTimeMulti = function (seconds, dutyCycleA, dutyCycleB) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (!this.preCheck())
          return;
        this.hub.motorTimeMulti(seconds, dutyCycleA, dutyCycleB);
      };
      /**
       * Run both motors (A and B) for specific time
       * @method LegoBoost#motorTimeMultiAsync
       * @param {number} seconds
       * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
       * is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
       * @returns {Promise}
       */
      LegoBoost.prototype.motorTimeMultiAsync = function (seconds, dutyCycleA, dutyCycleB, wait) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.motorTimeMultiAsync(seconds, dutyCycleA, dutyCycleB, wait)];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Turn a motor by specific angle
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} angle - degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       */
      LegoBoost.prototype.motorAngle = function (port, angle, dutyCycle) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (!this.preCheck())
          return;
        this.hub.motorAngle(port, angle, dutyCycle);
      };
      /**
       * Turn a motor by specific angle
       * @method LegoBoost#motorAngleAsync
       * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
       * @param {number} angle - degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
       * @returns {Promise}
       */
      LegoBoost.prototype.motorAngleAsync = function (port, angle, dutyCycle, wait) {
        if (dutyCycle === void 0) { dutyCycle = 100; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.motorAngleAsync(port, angle, dutyCycle, wait)];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Turn both motors (A and B) by specific angle
       * @method LegoBoost#motorAngleMulti
       * @param {number} angle degrees to turn from `0` to `2147483647`
       * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       */
      LegoBoost.prototype.motorAngleMulti = function (angle, dutyCycleA, dutyCycleB) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (!this.preCheck())
          return;
        this.hub.motorAngleMulti(angle, dutyCycleA, dutyCycleB);
      };
      /**
       * Turn both motors (A and B) by specific angle
       * @method LegoBoost#motorAngleMultiAsync
       * @param {number} angle degrees to turn from `0` to `2147483647`
       * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given
       * rotation is counterclockwise.
       * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
       * @returns {Promise}
       */
      LegoBoost.prototype.motorAngleMultiAsync = function (angle, dutyCycleA, dutyCycleB, wait) {
        if (dutyCycleA === void 0) { dutyCycleA = 100; }
        if (dutyCycleB === void 0) { dutyCycleB = 100; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.motorAngleMultiAsync(angle, dutyCycleA, dutyCycleB, wait)];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      };
      /**
       * Drive specified distance
       * @method LegoBoost#drive
       * @param {number} distance distance in centimeters (default) or inches. Positive is forward and negative is backward.
       * @param {boolean} [wait=true] will promise wait untill the drive has completed.
       * @returns {Promise}
       */
      LegoBoost.prototype.drive = function (distance, wait) {
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.drive(distance, wait)];
              case 1: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Turn robot specified degrees
       * @method LegoBoost#turn
       * @param {number} degrees degrees to turn. Negative is to the left and positive to the right.
       * @param {boolean} [wait=true] will promise wait untill the turn has completed.
       * @returns {Promise}
       */
      LegoBoost.prototype.turn = function (degrees, wait) {
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.turn(degrees, wait)];
              case 1: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Drive untill sensor shows object in defined distance
       * @method LegoBoost#driveUntil
       * @param {number} [distance=0] distance in centimeters (default) or inches when to stop. Distance sensor is not very sensitive or accurate.
       * By default will stop when sensor notices wall for the first time. Sensor distance values are usualy between 110-50.
       * @param {boolean} [wait=true] will promise wait untill the bot will stop.
       * @returns {Promise}
       */
      LegoBoost.prototype.driveUntil = function (distance, wait) {
        if (distance === void 0) { distance = 0; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.driveUntil(distance, wait)];
              case 1: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Turn until there is no object in sensors sight
       * @method LegoBoost#turnUntil
       * @param {number} [direction=1] direction to turn to. 1 (or any positive) is to the right and 0 (or any negative) is to the left.
       * @param {boolean} [wait=true] will promise wait untill the bot will stop.
       * @returns {Promise}
       */
      LegoBoost.prototype.turnUntil = function (direction, wait) {
        if (direction === void 0) { direction = 1; }
        if (wait === void 0) { wait = true; }
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!this.preCheck())
                  return [2 /*return*/];
                return [4 /*yield*/, this.hub.turnUntil(direction, wait)];
              case 1: return [2 /*return*/, _a.sent()];
            }
          });
        });
      };
      /**
       * Send raw data
       * @param {object} raw raw data
       */
      LegoBoost.prototype.rawCommand = function (raw) {
        if (!this.preCheck())
          return;
        return this.hub.rawCommand(raw);
      };
      LegoBoost.prototype.preCheck = function () {
        if (!this.hub || this.hub.connected === false)
          return false;
        this.hubControl.setNextState('Manual');
        return true;
      };
      return LegoBoost;
    }());
    exports.default = LegoBoost;

  },{"./ai/hub-control":4,"./boostConnector":7,"./hub/hubAsync":12}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwic3JjL2FpL2h1Yi1jb250cm9sLnRzIiwic3JjL2FpL3N0YXRlcy9haS50cyIsInNyYy9haS9zdGF0ZXMvbWFudWFsLnRzIiwic3JjL2Jvb3N0Q29ubmVjdG9yLnRzIiwic3JjL2Jyb3dzZXIudHMiLCJzcmMvaGVscGVycy9idWZmZXIudHMiLCJzcmMvaGVscGVycy9ldmVudEVtaXR0ZXIudHMiLCJzcmMvaHViL2h1Yi50cyIsInNyYy9odWIvaHViQXN5bmMudHMiLCJzcmMvbGVnb0Jvb3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LENBQUMsTUFBTSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUE7SUFDckMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ1gsT0FBTyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQ3ZDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFBO0tBQ3pDO0lBRUQsT0FBTyxHQUFHLENBQUE7QUFDWixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLFNBQVMsQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUMvRCxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNyQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUNyRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDL0MsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsU0FBUyxZQUFZLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDckUsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQy9DLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFNBQVMsWUFBWSxDQUFFLE1BQU0sRUFBRSxRQUFRO0lBQ3JFLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRO1FBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRWxELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQixDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN6QixDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUE7QUFDcEMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsU0FBUyxZQUFZLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDckUsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pCLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3JCLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsU0FBUyxDQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUTtJQUMzRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixVQUFVLEdBQUcsVUFBVSxLQUFLLENBQUMsQ0FBQTtJQUM3QixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUUzRCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDdEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ1QsT0FBTyxFQUFFLENBQUMsR0FBRyxVQUFVLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUU7UUFDekMsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFBO0tBQzlCO0lBQ0QsR0FBRyxJQUFJLElBQUksQ0FBQTtJQUVYLElBQUksR0FBRyxJQUFJLEdBQUc7UUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFBO0lBRWxELE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxTQUFTLENBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRO0lBQzNFLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLFVBQVUsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFBO0lBQzdCLElBQUksQ0FBQyxRQUFRO1FBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRTNELElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQTtJQUNsQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7SUFDWCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQzlCLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFBO0tBQ2hDO0lBQ0QsR0FBRyxJQUFJLElBQUksQ0FBQTtJQUVYLElBQUksR0FBRyxJQUFJLEdBQUc7UUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFBO0lBRWxELE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxRQUFRLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDN0QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbEQsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztRQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUNqRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDekMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxXQUFXLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDbkUsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbEQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUNoRCxPQUFPLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUE7QUFDaEQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxXQUFXLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDbkUsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbEQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUNoRCxPQUFPLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUE7QUFDaEQsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxXQUFXLENBQUUsTUFBTSxFQUFFLFFBQVE7SUFDbkUsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQixDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzVCLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsV0FBVyxDQUFFLE1BQU0sRUFBRSxRQUFRO0lBQ25FLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRO1FBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRWxELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pCLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN0QixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLFdBQVcsQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUNuRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxhQUFhO0lBQ2IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNoRCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLFdBQVcsQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUNuRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxhQUFhO0lBQ2IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNqRCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUNyRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxhQUFhO0lBQ2IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNoRCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxNQUFNLEVBQUUsUUFBUTtJQUNyRSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsRCxhQUFhO0lBQ2IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUNqRCxDQUFDLENBQUE7QUFFRCxTQUFTLFFBQVEsQ0FBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1FBQUUsTUFBTSxJQUFJLFNBQVMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFBO0lBQzdGLElBQUksS0FBSyxHQUFHLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRztRQUFFLE1BQU0sSUFBSSxVQUFVLENBQUMsbUNBQW1DLENBQUMsQ0FBQTtJQUN6RixJQUFJLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU07UUFBRSxNQUFNLElBQUksVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFDM0UsQ0FBQztBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsV0FBVyxDQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVE7SUFDdEYsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBQ2QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsVUFBVSxHQUFHLFVBQVUsS0FBSyxDQUFDLENBQUE7SUFDN0IsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDOUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7S0FDdkQ7SUFFRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7SUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQTtJQUMzQixPQUFPLEVBQUUsQ0FBQyxHQUFHLFVBQVUsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtRQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtLQUN4QztJQUVELE9BQU8sTUFBTSxHQUFHLFVBQVUsQ0FBQTtBQUM1QixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRO0lBQ3RGLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLFVBQVUsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFBO0lBQzdCLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzlDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ3ZEO0lBRUQsSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQTtJQUN0QixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7SUFDWCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7SUFDL0IsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUU7UUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUE7S0FDeEM7SUFFRCxPQUFPLE1BQU0sR0FBRyxVQUFVLENBQUE7QUFDNUIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxVQUFVLENBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRO0lBQ3hFLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRO1FBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQzdCLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxTQUFTLGFBQWEsQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVE7SUFDOUUsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBQ2QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUE7SUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQTtJQUNoQyxPQUFPLE1BQU0sR0FBRyxDQUFDLENBQUE7QUFDbkIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsU0FBUyxhQUFhLENBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRO0lBQzlFLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRO1FBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDMUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUE7SUFDakMsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0FBQ25CLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFNBQVMsYUFBYSxDQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsUUFBUTtJQUM5RSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUE7SUFDZCxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQTtJQUNyQixJQUFJLENBQUMsUUFBUTtRQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQzlELElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsQ0FBQTtJQUNqQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUM3QixPQUFPLE1BQU0sR0FBRyxDQUFDLENBQUE7QUFDbkIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsU0FBUyxhQUFhLENBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRO0lBQzlFLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRO1FBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDOUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQyxDQUFBO0lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQTtJQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQ2pDLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLFVBQVUsQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRO0lBQ3BGLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUU3QyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUM3RDtJQUVELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNULElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQTtJQUNYLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQTtJQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFBO0lBQzNCLE9BQU8sRUFBRSxDQUFDLEdBQUcsVUFBVSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQ3pDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4RCxHQUFHLEdBQUcsQ0FBQyxDQUFBO1NBQ1I7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQTtLQUNyRDtJQUVELE9BQU8sTUFBTSxHQUFHLFVBQVUsQ0FBQTtBQUM1QixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLFVBQVUsQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRO0lBQ3BGLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUNkLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUU3QyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUM3RDtJQUVELElBQUksQ0FBQyxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUE7SUFDdEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ1gsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ1gsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFBO0lBQy9CLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQ2pDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4RCxHQUFHLEdBQUcsQ0FBQyxDQUFBO1NBQ1I7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQTtLQUNyRDtJQUVELE9BQU8sTUFBTSxHQUFHLFVBQVUsQ0FBQTtBQUM1QixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLFNBQVMsQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVE7SUFDdEUsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBQ2QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzVELElBQUksS0FBSyxHQUFHLENBQUM7UUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUE7SUFDdkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQzdCLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVE7SUFDNUUsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBQ2QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2hFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQ2hDLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVE7SUFDNUUsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBQ2QsTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUE7SUFDckIsSUFBSSxDQUFDLFFBQVE7UUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2hFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQTtJQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQ2pDLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBRSxLQUFL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USxHQUFoQjtRQUNFLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxLQUFLLEtBQUs7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUM1RCxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxnQkFBQztBQUFELENBcFpBLEFBb1pDLElBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiEgaWVlZTc1NC4gQlNELTMtQ2xhdXNlIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiaW1wb3J0IHsgbWFudWFsIH0gZnJvbSAnLi9zdGF0ZXMvbWFudWFsJztcbmltcG9ydCB7IHN0b3AsIGJhY2ssIGRyaXZlLCB0dXJuLCBzZWVrIH0gZnJvbSAnLi9zdGF0ZXMvYWknO1xuaW1wb3J0IHsgQm9vc3RDb25maWd1cmF0aW9uLCBIdWJBc3luYyB9IGZyb20gJy4uL2h1Yi9odWJBc3luYyc7XG5pbXBvcnQgeyBDb250cm9sRGF0YSwgRGV2aWNlSW5mbywgU3RhdGUgfSBmcm9tICcuLi90eXBlcyc7XG5cbnR5cGUgU3RhdGVzID0ge1xuICBba2V5IGluIFN0YXRlXTogKGh1YjogSHViQ29udHJvbCkgPT4gdm9pZDtcbn07XG5cbmNsYXNzIEh1YkNvbnRyb2wge1xuICBodWI6IEh1YkFzeW5jO1xuICBkZXZpY2U6IERldmljZUluZm87XG4gIHByZXZEZXZpY2U6IERldmljZUluZm87XG4gIGNvbnRyb2w6IENvbnRyb2xEYXRhO1xuICBwcmV2Q29udHJvbDogQ29udHJvbERhdGE7XG4gIGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbjtcbiAgc3RhdGVzOiBTdGF0ZXM7XG4gIGN1cnJlbnRTdGF0ZTogKGh1YjogSHViQ29udHJvbCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihkZXZpY2VJbmZvOiBEZXZpY2VJbmZvLCBjb250cm9sRGF0YTogQ29udHJvbERhdGEsIGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbikge1xuICAgIHRoaXMuaHViID0gbnVsbDtcbiAgICB0aGlzLmRldmljZSA9IGRldmljZUluZm87XG4gICAgdGhpcy5jb250cm9sID0gY29udHJvbERhdGE7XG4gICAgdGhpcy5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICB0aGlzLnByZXZDb250cm9sID0geyAuLi50aGlzLmNvbnRyb2wgfTtcblxuICAgIHRoaXMuc3RhdGVzID0ge1xuICAgICAgVHVybjogdHVybixcbiAgICAgIERyaXZlOiBkcml2ZSxcbiAgICAgIFN0b3A6IHN0b3AsXG4gICAgICBCYWNrOiBiYWNrLFxuICAgICAgTWFudWFsOiBtYW51YWwsXG4gICAgICBTZWVrOiBzZWVrLFxuICAgIH07XG5cbiAgICB0aGlzLmN1cnJlbnRTdGF0ZSA9IHRoaXMuc3RhdGVzWydNYW51YWwnXTtcbiAgfVxuXG4gIHVwZGF0ZUNvbmZpZ3VyYXRpb24oY29uZmlndXJhdGlvbjogQm9vc3RDb25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KGh1YjogSHViQXN5bmMpIHtcbiAgICB0aGlzLmh1YiA9IGh1YjtcbiAgICB0aGlzLmRldmljZS5jb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgdGhpcy5odWIuZW1pdHRlci5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgdGhpcy5kZXZpY2UuZXJyID0gZXJyO1xuICAgIH0pO1xuXG4gICAgdGhpcy5odWIuZW1pdHRlci5vbignZGlzY29ubmVjdCcsICgpID0+IHtcbiAgICAgIHRoaXMuZGV2aWNlLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5odWIuZW1pdHRlci5vbignZGlzdGFuY2UnLCBkaXN0YW5jZSA9PiB7XG4gICAgICB0aGlzLmRldmljZS5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIH0pO1xuXG4gICAgdGhpcy5odWIuZW1pdHRlci5vbigncnNzaScsIHJzc2kgPT4ge1xuICAgICAgdGhpcy5kZXZpY2UucnNzaSA9IHJzc2k7XG4gICAgfSk7XG5cbiAgICB0aGlzLmh1Yi5lbWl0dGVyLm9uKCdwb3J0JywgcG9ydE9iamVjdCA9PiB7XG4gICAgICBjb25zdCB7IHBvcnQsIGFjdGlvbiB9ID0gcG9ydE9iamVjdDtcbiAgICAgIHRoaXMuZGV2aWNlLnBvcnRzW3BvcnRdLmFjdGlvbiA9IGFjdGlvbjtcbiAgICB9KTtcblxuICAgIHRoaXMuaHViLmVtaXR0ZXIub24oJ2NvbG9yJywgY29sb3IgPT4ge1xuICAgICAgdGhpcy5kZXZpY2UuY29sb3IgPSBjb2xvcjtcbiAgICB9KTtcblxuICAgIHRoaXMuaHViLmVtaXR0ZXIub24oJ3RpbHQnLCB0aWx0ID0+IHtcbiAgICAgIGNvbnN0IHsgcm9sbCwgcGl0Y2ggfSA9IHRpbHQ7XG4gICAgICB0aGlzLmRldmljZS50aWx0LnJvbGwgPSByb2xsO1xuICAgICAgdGhpcy5kZXZpY2UudGlsdC5waXRjaCA9IHBpdGNoO1xuICAgIH0pO1xuXG4gICAgdGhpcy5odWIuZW1pdHRlci5vbigncm90YXRpb24nLCByb3RhdGlvbiA9PiB7XG4gICAgICBjb25zdCB7IHBvcnQsIGFuZ2xlIH0gPSByb3RhdGlvbjtcbiAgICAgIHRoaXMuZGV2aWNlLnBvcnRzW3BvcnRdLmFuZ2xlID0gYW5nbGU7XG4gICAgfSk7XG5cbiAgICBhd2FpdCB0aGlzLmh1Yi5sZWRBc3luYygncmVkJyk7XG4gICAgYXdhaXQgdGhpcy5odWIubGVkQXN5bmMoJ3llbGxvdycpO1xuICAgIGF3YWl0IHRoaXMuaHViLmxlZEFzeW5jKCdncmVlbicpO1xuICB9XG5cbiAgYXN5bmMgZGlzY29ubmVjdCgpIHtcbiAgICBpZiAodGhpcy5kZXZpY2UuY29ubmVjdGVkKSB7XG4gICAgICBhd2FpdCB0aGlzLmh1Yi5kaXNjb25uZWN0QXN5bmMoKTtcbiAgICB9XG4gIH1cblxuICBzZXROZXh0U3RhdGUoc3RhdGU6IFN0YXRlKSB7XG4gICAgdGhpcy5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29udHJvbC5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuY3VycmVudFN0YXRlID0gdGhpcy5zdGF0ZXNbc3RhdGVdO1xuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIC8vIFRPRE86IEFmdGVyIHJlbW92aW5nIGJpbmQsIHRoaXMgcmVxdWlyZXMgc29tZSBtb3JlIHJlZmFjdG9yaW5nXG4gICAgdGhpcy5jdXJyZW50U3RhdGUodGhpcyk7XG5cbiAgICAvLyBUT0RPOiBEZWVwIGNsb25lXG4gICAgdGhpcy5wcmV2Q29udHJvbCA9IHsgLi4udGhpcy5jb250cm9sIH07XG4gICAgdGhpcy5wcmV2Q29udHJvbC50aWx0ID0geyAuLi50aGlzLmNvbnRyb2wudGlsdCB9O1xuICAgIHRoaXMucHJldkRldmljZSA9IHsgLi4udGhpcy5kZXZpY2UgfTtcbiAgfVxufVxuXG5leHBvcnQgeyBIdWJDb250cm9sIH07XG4iLCJpbXBvcnQgeyBIdWJDb250cm9sIH0gZnJvbSAnLi4vaHViLWNvbnRyb2wnO1xuXG5jb25zdCBNSU5fRElTVEFOQ0UgPSA3NTtcbmNvbnN0IE9LX0RJU1RBTkNFID0gMTAwO1xuXG5jb25zdCBFWEVDVVRFX1RJTUVfU0VDID0gNjA7XG5jb25zdCBDSEVDS19USU1FX01TID0gNTkwMDA7XG5cbi8vIFNwZWVkcyBtdXN0IGJlIGJldHdlZW4gLTEwMCBhbmQgMTAwXG5jb25zdCBUVVJOX1NQRUVEID0gMzA7XG5jb25zdCBUVVJOX1NQRUVEX09QUE9TSVRFID0gLTEwO1xuY29uc3QgRFJJVkVfU1BFRUQgPSAzMDtcbmNvbnN0IFJFVkVSU0VfU1BFRUQgPSAtMTU7XG5cbmNvbnN0IHNlZWsgPSAoaHViQ29udHJvbDogSHViQ29udHJvbCkgPT4ge1xuICBpZiAoIWh1YkNvbnRyb2wuY29udHJvbC5jb250cm9sVXBkYXRlVGltZSB8fCBEYXRlLm5vdygpIC0gaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lID4gQ0hFQ0tfVElNRV9NUykge1xuICAgIGh1YkNvbnRyb2wuY29udHJvbC5jb250cm9sVXBkYXRlVGltZSA9IERhdGUubm93KCk7XG4gICAgaHViQ29udHJvbC5odWIubW90b3JUaW1lTXVsdGkoRVhFQ1VURV9USU1FX1NFQywgVFVSTl9TUEVFRCwgVFVSTl9TUEVFRF9PUFBPU0lURSk7XG4gIH1cblxuICBpZiAoRGF0ZS5ub3coKSAtIGh1YkNvbnRyb2wuY29udHJvbC5jb250cm9sVXBkYXRlVGltZSA8IDI1MCkgcmV0dXJuO1xuXG4gIGlmIChodWJDb250cm9sLmRldmljZS5kaXN0YW5jZSA+IGh1YkNvbnRyb2wucHJldkRldmljZS5kaXN0YW5jZSkge1xuICAgIGh1YkNvbnRyb2wuY29udHJvbC50dXJuRGlyZWN0aW9uID0gJ3JpZ2h0JztcbiAgICBodWJDb250cm9sLnNldE5leHRTdGF0ZSgnVHVybicpO1xuICB9IGVsc2Uge1xuICAgIGh1YkNvbnRyb2wuY29udHJvbC50dXJuRGlyZWN0aW9uID0gJ2xlZnQnO1xuICAgIGh1YkNvbnRyb2wuc2V0TmV4dFN0YXRlKCdUdXJuJyk7XG4gIH1cbn1cblxuY29uc3QgdHVybiA9IChodWJDb250cm9sOiBIdWJDb250cm9sKSA9PiB7XG4gIGlmIChodWJDb250cm9sLmRldmljZS5kaXN0YW5jZSA8IE1JTl9ESVNUQU5DRSkge1xuICAgIGh1YkNvbnRyb2wuY29udHJvbC50dXJuRGlyZWN0aW9uID0gbnVsbDtcbiAgICBodWJDb250cm9sLnNldE5leHRTdGF0ZSgnQmFjaycpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChodWJDb250cm9sLmRldmljZS5kaXN0YW5jZSA+IE9LX0RJU1RBTkNFKSB7XG4gICAgaHViQ29udHJvbC5jb250cm9sLnR1cm5EaXJlY3Rpb24gPSBudWxsO1xuICAgIGh1YkNvbnRyb2wuc2V0TmV4dFN0YXRlKCdEcml2ZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lIHx8IERhdGUubm93KCkgLSBodWJDb250cm9sLmNvbnRyb2wuY29udHJvbFVwZGF0ZVRpbWUgPiBDSEVDS19USU1FX01TKSB7XG4gICAgY29uc3QgbW90b3JBID0gaHViQ29udHJvbC5jb250cm9sLnR1cm5EaXJlY3Rpb24gPT09ICdyaWdodCcgPyBUVVJOX1NQRUVEIDogVFVSTl9TUEVFRF9PUFBPU0lURTtcbiAgICBjb25zdCBtb3RvckIgPSBodWJDb250cm9sLmNvbnRyb2wudHVybkRpcmVjdGlvbiA9PT0gJ3JpZ2h0JyA/IFRVUk5fU1BFRURfT1BQT1NJVEUgOiBUVVJOX1NQRUVEO1xuXG4gICAgaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBodWJDb250cm9sLmh1Yi5tb3RvclRpbWVNdWx0aShFWEVDVVRFX1RJTUVfU0VDLCBtb3RvckEsIG1vdG9yQik7XG4gIH1cbn1cblxuXG5jb25zdCBkcml2ZSA9IChodWJDb250cm9sOiBIdWJDb250cm9sKSA9PiB7XG4gIGlmIChodWJDb250cm9sLmRldmljZS5kaXN0YW5jZSA8IE1JTl9ESVNUQU5DRSkge1xuICAgIGh1YkNvbnRyb2wuc2V0TmV4dFN0YXRlKCdCYWNrJyk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGh1YkNvbnRyb2wuZGV2aWNlLmRpc3RhbmNlIDwgT0tfRElTVEFOQ0UpIHtcbiAgICBodWJDb250cm9sLnNldE5leHRTdGF0ZSgnU2VlaycpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lIHx8IERhdGUubm93KCkgLSBodWJDb250cm9sLmNvbnRyb2wuY29udHJvbFVwZGF0ZVRpbWUgPiBDSEVDS19USU1FX01TKSB7XG4gICAgaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBzcGVlZCA9IGh1YkNvbnRyb2wuY29uZmlndXJhdGlvbi5sZWZ0TW90b3IgPT09ICdBJyA/IERSSVZFX1NQRUVEIDogRFJJVkVfU1BFRUQgKiAtMTtcbiAgICBodWJDb250cm9sLmh1Yi5tb3RvclRpbWVNdWx0aShFWEVDVVRFX1RJTUVfU0VDLCBzcGVlZCwgc3BlZWQpO1xuICB9XG59XG5cbmNvbnN0IGJhY2sgPSAoaHViQ29udHJvbDogSHViQ29udHJvbCkgPT4ge1xuICBpZiAoaHViQ29udHJvbC5kZXZpY2UuZGlzdGFuY2UgPiBPS19ESVNUQU5DRSkge1xuICAgIGh1YkNvbnRyb2wuc2V0TmV4dFN0YXRlKCdTZWVrJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFodWJDb250cm9sLmNvbnRyb2wuY29udHJvbFVwZGF0ZVRpbWUgfHwgRGF0ZS5ub3coKSAtIGh1YkNvbnRyb2wuY29udHJvbC5jb250cm9sVXBkYXRlVGltZSA+IENIRUNLX1RJTUVfTVMpIHtcbiAgICBodWJDb250cm9sLmNvbnRyb2wuY29udHJvbFVwZGF0ZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHNwZWVkID0gaHViQ29udHJvbC5jb25maWd1cmF0aW9uLmxlZnRNb3RvciA9PT0gJ0EnID8gUkVWRVJTRV9TUEVFRCA6IFJFVkVSU0VfU1BFRUQgKiAtMTtcbiAgICBodWJDb250cm9sLmh1Yi5tb3RvclRpbWVNdWx0aShFWEVDVVRFX1RJTUVfU0VDLCBzcGVlZCwgc3BlZWQpO1xuICB9XG59XG5cblxuY29uc3Qgc3RvcCA9IChodWJDb250cm9sOiBIdWJDb250cm9sKSA9PiB7XG4gIGh1YkNvbnRyb2wuY29udHJvbC5zcGVlZCA9IDA7XG4gIGh1YkNvbnRyb2wuY29udHJvbC50dXJuQW5nbGUgPSAwO1xuXG4gIGlmICghaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lIHx8IERhdGUubm93KCkgLSBodWJDb250cm9sLmNvbnRyb2wuY29udHJvbFVwZGF0ZVRpbWUgPiBDSEVDS19USU1FX01TKSB7XG4gICAgaHViQ29udHJvbC5jb250cm9sLmNvbnRyb2xVcGRhdGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBodWJDb250cm9sLmh1Yi5tb3RvclRpbWVNdWx0aShFWEVDVVRFX1RJTUVfU0VDLCAwLCAwKTtcbiAgfVxufVxuXG5leHBvcnQgeyBzdG9wLCBiYWNrLCBkcml2ZSwgdHVybiwgc2VlayB9O1xuIiwiaW1wb3J0IHsgSHViQ29udHJvbCB9IGZyb20gJy4uL2h1Yi1jb250cm9sJztcblxuZnVuY3Rpb24gbWFudWFsKGh1YkNvbnRyb2w6IEh1YkNvbnRyb2wpIHtcbiAgaWYgKGh1YkNvbnRyb2wuY29udHJvbC5zcGVlZCAhPT0gaHViQ29udHJvbC5wcmV2Q29udHJvbC5zcGVlZCB8fCBodWJDb250cm9sLmNvbnRyb2wudHVybkFuZ2xlICE9PSBodWJDb250cm9sLnByZXZDb250cm9sLnR1cm5BbmdsZSkge1xuICAgIGxldCBtb3RvckEgPSBodWJDb250cm9sLmNvbnRyb2wuc3BlZWQgKyAoaHViQ29udHJvbC5jb250cm9sLnR1cm5BbmdsZSA+IDAgPyBNYXRoLmFicyhodWJDb250cm9sLmNvbnRyb2wudHVybkFuZ2xlKSA6IDApO1xuICAgIGxldCBtb3RvckIgPSBodWJDb250cm9sLmNvbnRyb2wuc3BlZWQgKyAoaHViQ29udHJvbC5jb250cm9sLnR1cm5BbmdsZSA8IDAgPyBNYXRoLmFicyhodWJDb250cm9sLmNvbnRyb2wudHVybkFuZ2xlKSA6IDApO1xuXG4gICAgaWYgKG1vdG9yQSA+IDEwMCkge1xuICAgICAgbW90b3JCIC09IG1vdG9yQSAtIDEwMDtcbiAgICAgIG1vdG9yQSA9IDEwMDtcbiAgICB9XG5cbiAgICBpZiAobW90b3JCID4gMTAwKSB7XG4gICAgICBtb3RvckEgLT0gbW90b3JCIC0gMTAwO1xuICAgICAgbW90b3JCID0gMTAwO1xuICAgIH1cblxuICAgIGh1YkNvbnRyb2wuY29udHJvbC5tb3RvckEgPSBtb3RvckE7XG4gICAgaHViQ29udHJvbC5jb250cm9sLm1vdG9yQiA9IG1vdG9yQjtcblxuICAgIGh1YkNvbnRyb2wuaHViLm1vdG9yVGltZU11bHRpKDYwLCBtb3RvckEsIG1vdG9yQik7XG4gIH1cblxuICBpZiAoaHViQ29udHJvbC5jb250cm9sLnRpbHQucGl0Y2ggIT09IGh1YkNvbnRyb2wucHJldkNvbnRyb2wudGlsdC5waXRjaCkge1xuICAgIGh1YkNvbnRyb2wuaHViLm1vdG9yVGltZSgnQycsIDYwLCBodWJDb250cm9sLmNvbnRyb2wudGlsdC5waXRjaCk7XG4gIH1cblxuICBpZiAoaHViQ29udHJvbC5jb250cm9sLnRpbHQucm9sbCAhPT0gaHViQ29udHJvbC5wcmV2Q29udHJvbC50aWx0LnJvbGwpIHtcbiAgICBodWJDb250cm9sLmh1Yi5tb3RvclRpbWUoJ0QnLCA2MCwgaHViQ29udHJvbC5jb250cm9sLnRpbHQucm9sbCk7XG4gIH1cbn1cblxuZXhwb3J0IHsgbWFudWFsIH07XG4iLCJjb25zdCBCT09TVF9IVUJfU0VSVklDRV9VVUlEID0gJzAwMDAxNjIzLTEyMTItZWZkZS0xNjIzLTc4NWZlYWJjZDEyMyc7XG5jb25zdCBCT09TVF9DSEFSQUNURVJJU1RJQ19VVUlEID0gJzAwMDAxNjI0LTEyMTItZWZkZS0xNjIzLTc4NWZlYWJjZDEyMyc7XG5cbmV4cG9ydCBjbGFzcyBCb29zdENvbm5lY3RvciB7XG4gIHByaXZhdGUgc3RhdGljIGRldmljZTogQmx1ZXRvb3RoRGV2aWNlO1xuXG4gIHB1YmxpYyBzdGF0aWMgaXNXZWJCbHVldG9vdGhTdXBwb3J0ZWQgOiBib29sZWFuID0gIG5hdmlnYXRvci5ibHVldG9vdGggPyB0cnVlIDogZmFsc2U7XG4gIFxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNvbm5lY3QoZGlzY29ubmVjdENhbGxiYWNrOiAoKSA9PiBQcm9taXNlPHZvaWQ+KTogUHJvbWlzZTxCbHVldG9vdGhSZW1vdGVHQVRUQ2hhcmFjdGVyaXN0aWM+IHtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgYWNjZXB0QWxsRGV2aWNlczogZmFsc2UsXG4gICAgICBmaWx0ZXJzOiBbeyBzZXJ2aWNlczogW0JPT1NUX0hVQl9TRVJWSUNFX1VVSURdIH1dLFxuICAgICAgb3B0aW9uYWxTZXJ2aWNlczogW0JPT1NUX0hVQl9TRVJWSUNFX1VVSURdLFxuICAgIH07XG5cbiAgICB0aGlzLmRldmljZSA9IGF3YWl0IG5hdmlnYXRvci5ibHVldG9vdGgucmVxdWVzdERldmljZShvcHRpb25zKTtcblxuICAgIHRoaXMuZGV2aWNlLmFkZEV2ZW50TGlzdGVuZXIoJ2dhdHRzZXJ2ZXJkaXNjb25uZWN0ZWQnLCBhc3luYyBldmVudCA9PiB7XG4gICAgICBhd2FpdCBkaXNjb25uZWN0Q2FsbGJhY2soKTtcbiAgICB9KTtcblxuICAgIC8vIGF3YWl0IHRoaXMuZGV2aWNlLndhdGNoQWR2ZXJ0aXNlbWVudHMoKTtcblxuICAgIC8vIHRoaXMuZGV2aWNlLmFkZEV2ZW50TGlzdGVuZXIoJ2FkdmVydGlzZW1lbnRyZWNlaXZlZCcsIGV2ZW50ID0+IHtcbiAgICAvLyAgIC8vIEB0cy1pZ25vcmVcbiAgICAvLyAgIGNvbnNvbGUubG9nKGV2ZW50LnJzc2kpO1xuICAgIC8vIH0pO1xuXG4gICAgcmV0dXJuIEJvb3N0Q29ubmVjdG9yLmdldENoYXJhY3RlcmlzdGljKHRoaXMuZGV2aWNlKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIGdldENoYXJhY3RlcmlzdGljKGRldmljZTogQmx1ZXRvb3RoRGV2aWNlKTogUHJvbWlzZTxCbHVldG9vdGhSZW1vdGVHQVRUQ2hhcmFjdGVyaXN0aWM+IHtcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCBkZXZpY2UuZ2F0dC5jb25uZWN0KCk7XG4gICAgY29uc3Qgc2VydmljZSA9IGF3YWl0IHNlcnZlci5nZXRQcmltYXJ5U2VydmljZShCT09TVF9IVUJfU0VSVklDRV9VVUlEKTtcbiAgICByZXR1cm4gYXdhaXQgc2VydmljZS5nZXRDaGFyYWN0ZXJpc3RpYyhCT09TVF9DSEFSQUNURVJJU1RJQ19VVUlEKTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVjb25uZWN0KCk6IFByb21pc2U8W2Jvb2xlYW4sIEJsdWV0b290aFJlbW90ZUdBVFRDaGFyYWN0ZXJpc3RpY10+IHtcbiAgICBpZiAodGhpcy5kZXZpY2UpIHtcbiAgICAgIGNvbnN0IGJsdWV0b290aCA9IGF3YWl0IEJvb3N0Q29ubmVjdG9yLmdldENoYXJhY3RlcmlzdGljKHRoaXMuZGV2aWNlKTtcbiAgICAgIHJldHVybiBbdHJ1ZSwgYmx1ZXRvb3RoXTtcbiAgICB9XG4gICAgcmV0dXJuIFtmYWxzZSwgbnVsbF07XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGRpc2Nvbm5lY3QoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuZGV2aWNlKSB7XG4gICAgICB0aGlzLmRldmljZS5nYXR0LmRpc2Nvbm5lY3QoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiIsImltcG9ydCBMZWdvQm9vc3QgZnJvbSAnLi9sZWdvQm9vc3QnO1xuLy8gQHRzLWlnbm9yZVxud2luZG93LkxlZ29Cb29zdCA9IExlZ29Cb29zdDtcbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSBpbXBvcnQoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IGltcG9ydCgnaWVlZTc1NCcpXG5cbmNvbnN0IElOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmNvbnN0IGtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIC8vIEB0cy1pZ25vcmVcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZykgXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICAvLyBAdHMtaWdub3JlXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbi8vIEB0cy1pZ25vcmVcbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IElOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICAvLyBAdHMtaWdub3JlXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICAvLyBAdHMtaWdub3JlXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICAvLyBAdHMtaWdub3JlXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIC8vIEB0cy1pZ25vcmVcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICAvLyBAdHMtaWdub3JlXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIC8vIEB0cy1pZ25vcmVcbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIC8vIEB0cy1pZ25vcmVcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuXG5leHBvcnQgeyBCdWZmZXIsIFNsb3dCdWZmZXIsIElOU1BFQ1RfTUFYX0JZVEVTLCBrTWF4TGVuZ3RoIH0iLCIvLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9tdWRnZS81ODMwMzgyI2dpc3Rjb21tZW50LTI2NTg3MjFcblxudHlwZSBMaXN0ZW5lciA9ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcbmludGVyZmFjZSBJRXZlbnRzIHtcbiAgW2V2ZW50OiBzdHJpbmddOiBMaXN0ZW5lcltdO1xufVxuXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyPFQgZXh0ZW5kcyBzdHJpbmc+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBldmVudHM6IElFdmVudHMgPSB7fTtcblxuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6IExpc3RlbmVyKTogKCkgPT4gdm9pZCB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmV2ZW50c1tldmVudF0gIT09ICdvYmplY3QnKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSBbXTtcbiAgICB9XG5cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgcmV0dXJuICgpID0+IHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogTGlzdGVuZXIpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZXZlbnRzW2V2ZW50XSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpZHg6IG51bWJlciA9IHRoaXMuZXZlbnRzW2V2ZW50XS5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5zcGxpY2UoaWR4LCAxKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlQWxsTGlzdGVuZXJzKCk6IHZvaWQge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuZXZlbnRzKS5mb3JFYWNoKChldmVudDogc3RyaW5nKSA9PiB0aGlzLmV2ZW50c1tldmVudF0uc3BsaWNlKDAsIHRoaXMuZXZlbnRzW2V2ZW50XS5sZW5ndGgpKTtcbiAgfVxuXG4gIHB1YmxpYyBlbWl0KGV2ZW50OiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmV2ZW50c1tldmVudF0gIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgWy4uLnRoaXMuZXZlbnRzW2V2ZW50XV0uZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKSk7XG4gIH1cblxuICBwdWJsaWMgb25jZShldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogTGlzdGVuZXIpOiAoKSA9PiB2b2lkIHtcbiAgICBjb25zdCByZW1vdmU6ICgpID0+IHZvaWQgPSB0aGlzLm9uKGV2ZW50LCAoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgIHJlbW92ZSgpO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVtb3ZlO1xuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi9oZWxwZXJzL2V2ZW50RW1pdHRlcic7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICcuLi9oZWxwZXJzL2J1ZmZlcic7XG5pbXBvcnQgeyBSYXdEYXRhIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG50eXBlIERldmljZSA9ICdMRUQnIHwgJ0RJU1RBTkNFJyB8ICdJTU9UT1InIHwgJ01PVE9SJyB8ICdUSUxUJztcblxudHlwZSBQb3J0ID0gJ0EnIHwgJ0InIHwgJ0MnIHwgJ0QnIHwgJ0FCJyB8ICdMRUQnIHwgJ1RJTFQnO1xuXG50eXBlIExlZENvbG9yID1cbiAgfCAnb2ZmJ1xuICB8ICdwaW5rJ1xuICB8ICdwdXJwbGUnXG4gIHwgJ2JsdWUnXG4gIHwgJ2xpZ2h0Ymx1ZSdcbiAgfCAnY3lhbidcbiAgfCAnZ3JlZW4nXG4gIHwgJ3llbGxvdydcbiAgfCAnb3JhbmdlJ1xuICB8ICdyZWQnXG4gIHwgJ3doaXRlJztcblxuZXhwb3J0IGNsYXNzIEh1YiB7XG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIGJsdWV0b290aDogQmx1ZXRvb3RoUmVtb3RlR0FUVENoYXJhY3RlcmlzdGljO1xuXG4gIGxvZzogKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSkgPT4gdm9pZDtcbiAgbG9nRGVidWc6IChtZXNzYWdlPzogYW55LCAuLi5vcHRpb25hbFBhcmFtczogYW55W10pID0+IHZvaWQ7XG5cbiAgYXV0b1N1YnNjcmliZTogYm9vbGVhbiA9IHRydWU7XG4gIHBvcnRzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICBudW0ydHlwZTogeyBba2V5OiBudW1iZXJdOiBEZXZpY2UgfTtcbiAgcG9ydDJudW06IHsgW2tleSBpbiBQb3J0XTogbnVtYmVyIH07XG4gIG51bTJwb3J0OiB7IFtrZXk6IG51bWJlcl06IHN0cmluZyB9O1xuICBudW0yYWN0aW9uOiB7IFtrZXk6IG51bWJlcl06IHN0cmluZyB9O1xuICBudW0yY29sb3I6IHsgW2tleTogbnVtYmVyXTogc3RyaW5nIH07XG4gIGxlZENvbG9yczogTGVkQ29sb3JbXTtcbiAgcG9ydEluZm9UaW1lb3V0OiBudW1iZXI7XG4gIG5vUmVjb25uZWN0OiBib29sZWFuO1xuICBjb25uZWN0ZWQ6IGJvb2xlYW47XG4gIHJzc2k6IG51bWJlcjtcbiAgcmVjb25uZWN0OiBib29sZWFuO1xuXG4gIHdyaXRlQ3VlOiBhbnkgPSBbXTtcbiAgaXNXcml0aW5nOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBlbWl0KHR5cGU6IHN0cmluZywgZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KHR5cGUsIGRhdGEpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoYmx1ZXRvb3RoOiBCbHVldG9vdGhSZW1vdGVHQVRUQ2hhcmFjdGVyaXN0aWMpIHtcbiAgICB0aGlzLmJsdWV0b290aCA9IGJsdWV0b290aDtcbiAgICB0aGlzLmxvZyA9IGNvbnNvbGUubG9nO1xuICAgIHRoaXMuYXV0b1N1YnNjcmliZSA9IHRydWU7XG4gICAgdGhpcy5wb3J0cyA9IHt9O1xuICAgIHRoaXMubnVtMnR5cGUgPSB7XG4gICAgICAyMzogJ0xFRCcsXG4gICAgICAzNzogJ0RJU1RBTkNFJyxcbiAgICAgIDM4OiAnSU1PVE9SJyxcbiAgICAgIDM5OiAnTU9UT1InLFxuICAgICAgNDA6ICdUSUxUJyxcbiAgICB9O1xuICAgIHRoaXMucG9ydDJudW0gPSB7XG4gICAgICBBOiAweDAwLFxuICAgICAgQjogMHgwMSxcbiAgICAgIEM6IDB4MDIsXG4gICAgICBEOiAweDAzLFxuICAgICAgQUI6IDB4MTAsXG4gICAgICBMRUQ6IDB4MzIsXG4gICAgICBUSUxUOiAweDNhLFxuICAgIH07XG4gICAgdGhpcy5udW0ycG9ydCA9IE9iamVjdC5lbnRyaWVzKHRoaXMucG9ydDJudW0pLnJlZHVjZSgoYWNjLCBbcG9ydCwgcG9ydE51bV0pID0+IHtcbiAgICAgIGFjY1twb3J0TnVtXSA9IHBvcnQ7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcbiAgICB0aGlzLm51bTJhY3Rpb24gPSB7XG4gICAgICAxOiAnc3RhcnQnLFxuICAgICAgNTogJ2NvbmZsaWN0JyxcbiAgICAgIDEwOiAnc3RvcCcsXG4gICAgfTtcbiAgICB0aGlzLm51bTJjb2xvciA9IHtcbiAgICAgIDA6ICdibGFjaycsXG4gICAgICAzOiAnYmx1ZScsXG4gICAgICA1OiAnZ3JlZW4nLFxuICAgICAgNzogJ3llbGxvdycsXG4gICAgICA5OiAncmVkJyxcbiAgICAgIDEwOiAnd2hpdGUnLFxuICAgIH07XG4gICAgdGhpcy5sZWRDb2xvcnMgPSBbXG4gICAgICAnb2ZmJyxcbiAgICAgICdwaW5rJyxcbiAgICAgICdwdXJwbGUnLFxuICAgICAgJ2JsdWUnLFxuICAgICAgJ2xpZ2h0Ymx1ZScsXG4gICAgICAnY3lhbicsXG4gICAgICAnZ3JlZW4nLFxuICAgICAgJ3llbGxvdycsXG4gICAgICAnb3JhbmdlJyxcbiAgICAgICdyZWQnLFxuICAgICAgJ3doaXRlJyxcbiAgICBdO1xuXG4gICAgdGhpcy5hZGRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuYmx1ZXRvb3RoLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYXJhY3RlcmlzdGljdmFsdWVjaGFuZ2VkJywgZXZlbnQgPT4ge1xuICAgICAgLy8gaHR0cHM6Ly9nb29nbGVjaHJvbWUuZ2l0aHViLmlvL3NhbXBsZXMvd2ViLWJsdWV0b290aC9yZWFkLWNoYXJhY3RlcmlzdGljLXZhbHVlLWNoYW5nZWQuaHRtbFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgZGF0YSA9IEJ1ZmZlci5mcm9tKGV2ZW50LnRhcmdldC52YWx1ZS5idWZmZXIpO1xuICAgICAgdGhpcy5wYXJzZU1lc3NhZ2UoZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIC8vIFdpdGhvdXQgdGltb3V0IG1pc3NlZCBmaXJzdCBjaGFyYWN0ZXJpc3RpY3ZhbHVlY2hhbmdlZCBldmVudHNcbiAgICAgIHRoaXMuYmx1ZXRvb3RoLnN0YXJ0Tm90aWZpY2F0aW9ucygpO1xuICAgIH0sIDEwMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZU1lc3NhZ2UoZGF0YTogYW55KSB7XG4gICAgc3dpdGNoIChkYXRhWzJdKSB7XG4gICAgICBjYXNlIDB4MDQ6IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucG9ydEluZm9UaW1lb3V0KTtcbiAgICAgICAgdGhpcy5wb3J0SW5mb1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIGEgY29ubmVjdGlvbiB0byB0aGUgTW92ZSBIdWIgaXMgZXN0YWJsaXNoZWRcbiAgICAgICAgICAgKiBAZXZlbnQgSHViI2Nvbm5lY3RcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBpZiAodGhpcy5hdXRvU3Vic2NyaWJlKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZUFsbCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghdGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnY29ubmVjdCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICAgICAgdGhpcy5sb2coJ0ZvdW5kOiAnICsgdGhpcy5udW0ydHlwZVtkYXRhWzVdXSk7XG4gICAgICAgIHRoaXMubG9nRGVidWcoJ0ZvdW5kJywgZGF0YSk7XG5cbiAgICAgICAgaWYgKGRhdGFbNF0gPT09IDB4MDEpIHtcbiAgICAgICAgICB0aGlzLnBvcnRzW2RhdGFbM11dID0ge1xuICAgICAgICAgICAgdHlwZTogJ3BvcnQnLFxuICAgICAgICAgICAgZGV2aWNlVHlwZTogdGhpcy5udW0ydHlwZVtkYXRhWzVdXSxcbiAgICAgICAgICAgIGRldmljZVR5cGVOdW06IGRhdGFbNV0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhWzRdID09PSAweDAyKSB7XG4gICAgICAgICAgdGhpcy5wb3J0c1tkYXRhWzNdXSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdncm91cCcsXG4gICAgICAgICAgICBkZXZpY2VUeXBlOiB0aGlzLm51bTJ0eXBlW2RhdGFbNV1dLFxuICAgICAgICAgICAgZGV2aWNlVHlwZU51bTogZGF0YVs1XSxcbiAgICAgICAgICAgIG1lbWJlcnM6IFtkYXRhWzddLCBkYXRhWzhdXSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAweDA1OiB7XG4gICAgICAgIHRoaXMubG9nKCdNYWxmb3JtZWQgbWVzc2FnZScpO1xuICAgICAgICB0aGlzLmxvZygnPCcsIGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgMHg0NToge1xuICAgICAgICB0aGlzLnBhcnNlU2Vuc29yKGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgMHg0Nzoge1xuICAgICAgICAvLyAweDQ3IHN1YnNjcmlwdGlvbiBhY2tub3dsZWRnZW1lbnRzXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Kb3JnZVBlL0JPT1NUcmV2ZW5nL2Jsb2IvbWFzdGVyL05vdGlmaWNhdGlvbnMubWRcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIDB4ODI6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpcmVzIG9uIHBvcnQgY2hhbmdlc1xuICAgICAgICAgKiBAZXZlbnQgSHViI3BvcnRcbiAgICAgICAgICogQHBhcmFtIHBvcnQge29iamVjdH1cbiAgICAgICAgICogQHBhcmFtIHBvcnQucG9ydCB7c3RyaW5nfVxuICAgICAgICAgKiBAcGFyYW0gcG9ydC5hY3Rpb24ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW1pdCgncG9ydCcsIHtcbiAgICAgICAgICBwb3J0OiB0aGlzLm51bTJwb3J0W2RhdGFbM11dLFxuICAgICAgICAgIGFjdGlvbjogdGhpcy5udW0yYWN0aW9uW2RhdGFbNF1dLFxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLmxvZygndW5rbm93biBtZXNzYWdlIHR5cGUgMHgnICsgZGF0YVsyXS50b1N0cmluZygxNikpO1xuICAgICAgICB0aGlzLmxvZygnPCcsIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VTZW5zb3IoZGF0YTogYW55KSB7XG4gICAgaWYgKCF0aGlzLnBvcnRzW2RhdGFbM11dKSB7XG4gICAgICB0aGlzLmxvZygncGFyc2VTZW5zb3IgdW5rbm93biBwb3J0IDB4JyArIGRhdGFbM10udG9TdHJpbmcoMTYpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLnBvcnRzW2RhdGFbM11dLmRldmljZVR5cGUpIHtcbiAgICAgIGNhc2UgJ0RJU1RBTkNFJzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IEh1YiNjb2xvclxuICAgICAgICAgKiBAcGFyYW0gY29sb3Ige3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW1pdCgnY29sb3InLCB0aGlzLm51bTJjb2xvcltkYXRhWzRdXSk7XG5cbiAgICAgICAgLy8gVE9ETzogaW1wcm92ZSBkaXN0YW5jZSBjYWxjdWxhdGlvbiFcbiAgICAgICAgbGV0IGRpc3RhbmNlOiBudW1iZXI7XG4gICAgICAgIGlmIChkYXRhWzddID4gMCAmJiBkYXRhWzVdIDwgMikge1xuICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5mbG9vcigyMCAtIGRhdGFbN10gKiAyLjg1KTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhWzVdID4gOSkge1xuICAgICAgICAgIGRpc3RhbmNlID0gSW5maW5pdHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmZsb29yKDIwICsgZGF0YVs1XSAqIDE4KTtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IEh1YiNkaXN0YW5jZVxuICAgICAgICAgKiBAcGFyYW0gZGlzdGFuY2Uge251bWJlcn0gZGlzdGFuY2UgaW4gbWlsbGltZXRlcnNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW1pdCgnZGlzdGFuY2UnLCBkaXN0YW5jZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnVElMVCc6IHtcbiAgICAgICAgY29uc3Qgcm9sbCA9IGRhdGEucmVhZEludDgoNCk7XG4gICAgICAgIGNvbnN0IHBpdGNoID0gZGF0YS5yZWFkSW50OCg1KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGV2ZW50IEh1YiN0aWx0XG4gICAgICAgICAqIEBwYXJhbSB0aWx0IHtvYmplY3R9XG4gICAgICAgICAqIEBwYXJhbSB0aWx0LnJvbGwge251bWJlcn1cbiAgICAgICAgICogQHBhcmFtIHRpbHQucGl0Y2gge251bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZW1pdCgndGlsdCcsIHsgcm9sbCwgcGl0Y2ggfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnTU9UT1InOlxuICAgICAgY2FzZSAnSU1PVE9SJzoge1xuICAgICAgICBjb25zdCBhbmdsZSA9IGRhdGEucmVhZEludDMyTEUoNCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBldmVudCBIdWIjcm90YXRpb25cbiAgICAgICAgICogQHBhcmFtIHJvdGF0aW9uIHtvYmplY3R9XG4gICAgICAgICAqIEBwYXJhbSByb3RhdGlvbi5wb3J0IHtzdHJpbmd9XG4gICAgICAgICAqIEBwYXJhbSByb3RhdGlvbi5hbmdsZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5lbWl0KCdyb3RhdGlvbicsIHtcbiAgICAgICAgICBwb3J0OiB0aGlzLm51bTJwb3J0W2RhdGFbM11dLFxuICAgICAgICAgIGFuZ2xlLFxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLmxvZygndW5rbm93biBzZW5zb3IgdHlwZSAweCcgKyBkYXRhWzNdLnRvU3RyaW5nKDE2KSwgZGF0YVszXSwgdGhpcy5wb3J0c1tkYXRhWzNdXS5kZXZpY2VUeXBlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IE1vdmUgSHViIGFzIGRpc2Nvbm5lY3RlZFxuICAgKiBAbWV0aG9kIEh1YiNzZXREaXNjb25uZWN0ZWRcbiAgICovXG4gIHNldERpc2Nvbm5lY3RlZCgpIHtcbiAgICAvLyBUT0RPOiBTaG91bGQgZ2V0IHRoaXMgZnJvbSBzb21lIG5vdGlmaWNhdGlvbj9cbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMubm9SZWNvbm5lY3QgPSB0cnVlO1xuICAgIHRoaXMud3JpdGVDdWUgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBtb3RvciBmb3Igc3BlY2lmaWMgdGltZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHBvcnQgcG9zc2libGUgc3RyaW5nIHZhbHVlczogYEFgLCBgQmAsIGBBQmAsIGBDYCwgYERgLlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW4gcm90YXRpb25cbiAgICogaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKi9cbiAgbW90b3JUaW1lKHBvcnQ6IHN0cmluZyB8IG51bWJlciwgc2Vjb25kczogbnVtYmVyLCBkdXR5Q3ljbGU6IG51bWJlciwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgaWYgKHR5cGVvZiBkdXR5Q3ljbGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gZHV0eUN5Y2xlO1xuICAgICAgZHV0eUN5Y2xlID0gMTAwO1xuICAgIH1cbiAgICBjb25zdCBwb3J0TnVtID0gdHlwZW9mIHBvcnQgPT09ICdzdHJpbmcnID8gdGhpcy5wb3J0Mm51bVtwb3J0XSA6IHBvcnQ7XG4gICAgdGhpcy53cml0ZSh0aGlzLmVuY29kZU1vdG9yVGltZShwb3J0TnVtLCBzZWNvbmRzLCBkdXR5Q3ljbGUpLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogUnVuIGJvdGggbW90b3JzIChBIGFuZCBCKSBmb3Igc3BlY2lmaWMgdGltZVxuICAgKiBAcGFyYW0ge251bWJlcn0gc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gZHV0eUN5Y2xlQSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuIHJvdGF0aW9uXG4gICAqIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkdXR5Q3ljbGVCIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW4gcm90YXRpb25cbiAgICogaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIG1vdG9yVGltZU11bHRpKHNlY29uZHM6IG51bWJlciwgZHV0eUN5Y2xlQTogbnVtYmVyLCBkdXR5Q3ljbGVCOiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMud3JpdGUodGhpcy5lbmNvZGVNb3RvclRpbWVNdWx0aSh0aGlzLnBvcnQybnVtWydBQiddLCBzZWNvbmRzLCBkdXR5Q3ljbGVBLCBkdXR5Q3ljbGVCKSwgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm4gYSBtb3RvciBieSBzcGVjaWZpYyBhbmdsZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHBvcnQgcG9zc2libGUgc3RyaW5nIHZhbHVlczogYEFgLCBgQmAsIGBBQmAsIGBDYCwgYERgLlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBkZWdyZWVzIHRvIHR1cm4gZnJvbSBgMGAgdG8gYDIxNDc0ODM2NDdgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZHV0eUN5Y2xlPTEwMF0gbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlblxuICAgKiByb3RhdGlvbiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdXG4gICAqL1xuICBtb3RvckFuZ2xlKHBvcnQ6IHN0cmluZyB8IG51bWJlciwgYW5nbGU6IG51bWJlciwgZHV0eUN5Y2xlOiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIGlmICh0eXBlb2YgZHV0eUN5Y2xlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IGR1dHlDeWNsZTtcbiAgICAgIGR1dHlDeWNsZSA9IDEwMDtcbiAgICB9XG4gICAgY29uc3QgcG9ydE51bSA9IHR5cGVvZiBwb3J0ID09PSAnc3RyaW5nJyA/IHRoaXMucG9ydDJudW1bcG9ydF0gOiBwb3J0O1xuICAgIHRoaXMud3JpdGUodGhpcy5lbmNvZGVNb3RvckFuZ2xlKHBvcnROdW0sIGFuZ2xlLCBkdXR5Q3ljbGUpLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogVHVybiBib3RoIG1vdG9ycyAoQSBhbmQgQikgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIGRlZ3JlZXMgdG8gdHVybiBmcm9tIGAwYCB0byBgMjE0NzQ4MzY0N2BcbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1dHlDeWNsZUEgbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlblxuICAgKiByb3RhdGlvbiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gZHV0eUN5Y2xlQiBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuXG4gICAqIHJvdGF0aW9uIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBtb3RvckFuZ2xlTXVsdGkoYW5nbGU6IG51bWJlciwgZHV0eUN5Y2xlQTogbnVtYmVyLCBkdXR5Q3ljbGVCOiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMud3JpdGUodGhpcy5lbmNvZGVNb3RvckFuZ2xlTXVsdGkodGhpcy5wb3J0Mm51bVsnQUInXSwgYW5nbGUsIGR1dHlDeWNsZUEsIGR1dHlDeWNsZUIpLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCByYXcgZGF0YVxuICAgKiBAcGFyYW0ge29iamVjdH0gcmF3IHJhdyBkYXRhXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICByYXdDb21tYW5kKHJhdzogUmF3RGF0YSwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5mcm9tKFsweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwXSk7XG5cbiAgICBmb3IgKGNvbnN0IGlkeCBpbiByYXcpIHtcbiAgICAgIGJ1Zi53cml0ZUludExFKHJhd1tpZHhdLCBpZHgpO1xuICAgIH1cblxuICAgIHRoaXMud3JpdGUoYnVmLCBjYWxsYmFjayk7XG4gIH1cblxuICBtb3RvclBvd2VyQ29tbWFuZChwb3J0OiBhbnksIHBvd2VyOiBudW1iZXIpIHtcbiAgICB0aGlzLndyaXRlKHRoaXMuZW5jb2RlTW90b3JQb3dlcihwb3J0LCBwb3dlcikpO1xuICB9XG5cbiAgLy9bMHgwOSwgMHgwMCwgMHg4MSwgMHgzOSwgMHgxMSwgMHgwNywgMHgwMCwgMHg2NCwgMHgwM11cbiAgZW5jb2RlTW90b3JQb3dlcihwb3J0OiBzdHJpbmcgfCBudW1iZXIsIGR1dHlDeWNsZSA9IDEwMCkge1xuICAgIGNvbnN0IHBvcnROdW0gPSB0eXBlb2YgcG9ydCA9PT0gJ3N0cmluZycgPyB0aGlzLnBvcnQybnVtW3BvcnRdIDogcG9ydDtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20oWzB4MDksIDB4MDAsIDB4ODEsIHBvcnROdW0sIDB4MTEsIDB4MDcsIDB4MDAsIDB4NjQsIDB4MDNdKTtcbiAgICAvL2J1Zi53cml0ZVVJbnQxNkxFKHNlY29uZHMgKiAxMDAwLCA2KTtcbiAgICBidWYud3JpdGVJbnQ4KGR1dHlDeWNsZSwgNik7XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuXG4gIC8vMHgwQywgMHgwMCwgMHg4MSwgcG9ydCwgMHgxMSwgMHgwOSwgMHgwMCwgMHgwMCwgMHgwMCwgMHg2NCwgMHg3RiwgMHgwM1xuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBMRUQgb24gdGhlIE1vdmUgSHViXG4gICAqIEBtZXRob2QgSHViI2xlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW58bnVtYmVyfHN0cmluZ30gY29sb3JcbiAgICogSWYgc2V0IHRvIGJvb2xlYW4gYGZhbHNlYCB0aGUgTEVEIGlzIHN3aXRjaGVkIG9mZiwgaWYgc2V0IHRvIGB0cnVlYCB0aGUgTEVEIHdpbGwgYmUgd2hpdGUuXG4gICAqIFBvc3NpYmxlIHN0cmluZyB2YWx1ZXM6IGBvZmZgLCBgcGlua2AsIGBwdXJwbGVgLCBgYmx1ZWAsIGBsaWdodGJsdWVgLCBgY3lhbmAsIGBncmVlbmAsIGB5ZWxsb3dgLCBgb3JhbmdlYCwgYHJlZGAsXG4gICAqIGB3aGl0ZWBcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKi9cbiAgbGVkKGNvbG9yOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuLCBjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLndyaXRlKHRoaXMuZW5jb2RlTGVkKGNvbG9yKSwgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSBmb3Igc2Vuc29yIG5vdGlmaWNhdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBwb3J0IC0gZS5nLiBjYWxsIGAuc3Vic2NyaWJlKCdDJylgIGlmIHlvdSBoYXZlIHlvdXIgZGlzdGFuY2UvY29sb3Igc2Vuc29yIG9uIHBvcnQgQy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb249MF0gVW5rbm93biBtZWFuaW5nLiBOZWVkcyB0byBiZSAwIGZvciBkaXN0YW5jZS9jb2xvciwgMiBmb3IgbW90b3JzLCA4IGZvciB0aWx0XG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja11cbiAgICovXG4gIHN1YnNjcmliZShwb3J0OiBzdHJpbmcgfCBudW1iZXIsIG9wdGlvbjogbnVtYmVyID0gMCwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIFRPRE86IFdoeSB3ZSBoYXZlIGZ1bmN0aW9uIGNoZWNrIGhlcmU/XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbjtcbiAgICAgIG9wdGlvbiA9IDB4MDA7XG4gICAgfVxuICAgIGNvbnN0IHBvcnROdW0gPSB0eXBlb2YgcG9ydCA9PT0gJ3N0cmluZycgPyB0aGlzLnBvcnQybnVtW3BvcnRdIDogcG9ydDtcbiAgICB0aGlzLndyaXRlKFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgQnVmZmVyLmZyb20oWzB4MGEsIDB4MDAsIDB4NDEsIHBvcnROdW0sIG9wdGlvbiwgMHgwMSwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMV0pLFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuc3Vic2NyaWJlIGZyb20gc2Vuc29yIG5vdGlmaWNhdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBwb3J0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9uPTBdIFVua25vd24gbWVhbmluZy4gTmVlZHMgdG8gYmUgMCBmb3IgZGlzdGFuY2UvY29sb3IsIDIgZm9yIG1vdG9ycywgOCBmb3IgdGlsdFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdXG4gICAqL1xuICB1bnN1YnNjcmliZShwb3J0OiBzdHJpbmcgfCBudW1iZXIsIG9wdGlvbjogbnVtYmVyID0gMCwgY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb247XG4gICAgICBvcHRpb24gPSAweDAwO1xuICAgIH1cbiAgICBjb25zdCBwb3J0TnVtID0gdHlwZW9mIHBvcnQgPT09ICdzdHJpbmcnID8gdGhpcy5wb3J0Mm51bVtwb3J0XSA6IHBvcnQ7XG4gICAgdGhpcy53cml0ZShcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIEJ1ZmZlci5mcm9tKFsweDBhLCAweDAwLCAweDQxLCBwb3J0TnVtLCBvcHRpb24sIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDBdKSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxuXG4gIHN1YnNjcmliZUFsbCgpIHtcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnBvcnRzKS5mb3JFYWNoKChbcG9ydCwgZGF0YV0pID0+IHtcbiAgICAgIGlmIChkYXRhLmRldmljZVR5cGUgPT09ICdESVNUQU5DRScpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmUocGFyc2VJbnQocG9ydCwgMTApLCA4KTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5kZXZpY2VUeXBlID09PSAnVElMVCcpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmUocGFyc2VJbnQocG9ydCwgMTApLCAwKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5kZXZpY2VUeXBlID09PSAnSU1PVE9SJykge1xuICAgICAgICB0aGlzLnN1YnNjcmliZShwYXJzZUludChwb3J0LCAxMCksIDIpO1xuICAgICAgfSBlbHNlIGlmIChkYXRhLmRldmljZVR5cGUgPT09ICdNT1RPUicpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmUocGFyc2VJbnQocG9ydCwgMTApLCAyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nRGVidWcoYFBvcnQgc3Vic2NyaWJ0aW9uIG5vdCBzZW50OiAke3BvcnR9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBkYXRhIG92ZXIgQkxFXG4gICAqIEBtZXRob2QgSHViI3dyaXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfEJ1ZmZlcn0gZGF0YSBJZiBhIHN0cmluZyBpcyBnaXZlbiBpdCBoYXMgdG8gaGF2ZSBoZXggYnl0ZXMgc2VwYXJhdGVkIGJ5IHNwYWNlcywgZS5nLiBgMGEgMDEgYzMgYjJgXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICB3cml0ZShkYXRhOiBhbnksIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGFyciA9IFtdO1xuICAgICAgZGF0YS5zcGxpdCgnICcpLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGFyci5wdXNoKHBhcnNlSW50KGMsIDE2KSk7XG4gICAgICB9KTtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGRhdGEgPSBCdWZmZXIuZnJvbShhcnIpO1xuICAgIH1cblxuICAgIC8vIE9yaWdpbmFsIGltcGxlbWVudGF0aW9uIHBhc3NlZCBzZWNvbmRBcmcgdG8gZGVmaW5lIGlmIHJlc3BvbnNlIGlzIHdhaXRlZFxuICAgIHRoaXMud3JpdGVDdWUucHVzaCh7XG4gICAgICBkYXRhLFxuICAgICAgc2Vjb25kQXJnOiB0cnVlLFxuICAgICAgY2FsbGJhY2ssXG4gICAgfSk7XG5cbiAgICB0aGlzLndyaXRlRnJvbUN1ZSgpO1xuICB9XG5cbiAgd3JpdGVGcm9tQ3VlKCkge1xuICAgIGlmICh0aGlzLndyaXRlQ3VlLmxlbmd0aCA9PT0gMCB8fCB0aGlzLmlzV3JpdGluZykgcmV0dXJuO1xuXG4gICAgY29uc3QgZWw6IGFueSA9IHRoaXMud3JpdGVDdWUuc2hpZnQoKTtcbiAgICB0aGlzLmxvZ0RlYnVnKCdXcml0aW5nIHRvIGRldmljZScsIGVsKTtcbiAgICB0aGlzLmlzV3JpdGluZyA9IHRydWU7XG4gICAgdGhpcy5ibHVldG9vdGhcbiAgICAgIC53cml0ZVZhbHVlKGVsLmRhdGEpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuaXNXcml0aW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0eXBlb2YgZWwuY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGVsLmNhbGxiYWNrKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIHRoaXMuaXNXcml0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9nKGBFcnJvciB3aGlsZSB3cml0aW5nOiAke2VsLmRhdGF9IC0gRXJyb3IgJHtlcnIudG9TdHJpbmcoKX1gKTtcbiAgICAgICAgLy8gVE9ETzogTm90aWZ5IG9mIGZhaWx1cmVcbiAgICAgIH0pXG4gICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIHRoaXMud3JpdGVGcm9tQ3VlKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGVuY29kZU1vdG9yVGltZU11bHRpKHBvcnQ6IG51bWJlciwgc2Vjb25kczogbnVtYmVyLCBkdXR5Q3ljbGVBID0gMTAwLCBkdXR5Q3ljbGVCID0gLTEwMCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBidWYgPSBCdWZmZXIuZnJvbShbMHgwZCwgMHgwMCwgMHg4MSwgcG9ydCwgMHgxMSwgMHgwYSwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg2NCwgMHg3ZiwgMHgwM10pO1xuICAgIGJ1Zi53cml0ZVVJbnQxNkxFKHNlY29uZHMgKiAxMDAwLCA2KTtcbiAgICBidWYud3JpdGVJbnQ4KGR1dHlDeWNsZUEsIDgpO1xuICAgIGJ1Zi53cml0ZUludDgoZHV0eUN5Y2xlQiwgOSk7XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuXG4gIGVuY29kZU1vdG9yVGltZShwb3J0OiBudW1iZXIsIHNlY29uZHM6IG51bWJlciwgZHV0eUN5Y2xlID0gMTAwKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5mcm9tKFsweDBjLCAweDAwLCAweDgxLCBwb3J0LCAweDExLCAweDA5LCAweDAwLCAweDAwLCAweDAwLCAweDY0LCAweDdmLCAweDAzXSk7XG4gICAgYnVmLndyaXRlVUludDE2TEUoc2Vjb25kcyAqIDEwMDAsIDYpO1xuICAgIGJ1Zi53cml0ZUludDgoZHV0eUN5Y2xlLCA4KTtcbiAgICByZXR1cm4gYnVmO1xuICB9XG5cbiAgZW5jb2RlTW90b3JBbmdsZU11bHRpKHBvcnQ6IG51bWJlciwgYW5nbGU6IG51bWJlciwgZHV0eUN5Y2xlQSA9IDEwMCwgZHV0eUN5Y2xlQiA9IC0xMDApIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20oWzB4MGYsIDB4MDAsIDB4ODEsIHBvcnQsIDB4MTEsIDB4MGMsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4NjQsIDB4N2YsIDB4MDNdKTtcbiAgICBidWYud3JpdGVVSW50MzJMRShhbmdsZSwgNik7XG4gICAgYnVmLndyaXRlSW50OChkdXR5Q3ljbGVBLCAxMCk7XG4gICAgYnVmLndyaXRlSW50OChkdXR5Q3ljbGVCLCAxMSk7XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuXG4gIGVuY29kZU1vdG9yQW5nbGUocG9ydDogbnVtYmVyLCBhbmdsZTogbnVtYmVyLCBkdXR5Q3ljbGUgPSAxMDApIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20oWzB4MGUsIDB4MDAsIDB4ODEsIHBvcnQsIDB4MTEsIDB4MGIsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4NjQsIDB4N2YsIDB4MDNdKTtcbiAgICBidWYud3JpdGVVSW50MzJMRShhbmdsZSwgNik7XG4gICAgYnVmLndyaXRlSW50OChkdXR5Q3ljbGUsIDEwKTtcbiAgICByZXR1cm4gYnVmO1xuICB9XG5cbiAgZW5jb2RlTGVkKGNvbG9yOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuKSB7XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBjb2xvciA9IGNvbG9yID8gJ3doaXRlJyA6ICdvZmYnO1xuICAgIH1cbiAgICBjb25zdCBjb2xvck51bSA9IHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycgPyB0aGlzLmxlZENvbG9ycy5pbmRleE9mKGNvbG9yIGFzIExlZENvbG9yKSA6IGNvbG9yO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oWzB4MDgsIDB4MDAsIDB4ODEsIDB4MzIsIDB4MTEsIDB4NTEsIDB4MDAsIGNvbG9yTnVtXSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEh1YiB9IGZyb20gJy4vaHViJztcbmltcG9ydCB7IE1vdG9yIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmNvbnN0IENBTExCQUNLX1RJTUVPVVRfTVMgPSAxMDAwIC8gMztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ09ORklHID0ge1xuICBNRVRSSUNfTU9ESUZJRVI6IDI4LjUsXG4gIFRVUk5fTU9ESUZJRVI6IDIuNTYsXG4gIERSSVZFX1NQRUVEOiAyNSxcbiAgVFVSTl9TUEVFRDogMjAsXG4gIERFRkFVTFRfU1RPUF9ESVNUQU5DRTogMTA1LFxuICBERUZBVUxUX0NMRUFSX0RJU1RBTkNFOiAxMjAsXG4gIExFRlRfTU9UT1I6ICdBJyBhcyBNb3RvcixcbiAgUklHSFRfTU9UT1I6ICdCJyBhcyBNb3RvcixcbiAgVkFMSURfTU9UT1JTOiBbJ0EnIGFzIE1vdG9yLCAnQicgYXMgTW90b3JdLFxufTtcblxuY29uc3QgdmFsaWRhdGVDb25maWd1cmF0aW9uID0gKGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbikgPT4ge1xuICBjb25maWd1cmF0aW9uLmxlZnRNb3RvciA9IGNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yIHx8IERFRkFVTFRfQ09ORklHLkxFRlRfTU9UT1I7XG4gIGNvbmZpZ3VyYXRpb24ucmlnaHRNb3RvciA9IGNvbmZpZ3VyYXRpb24ucmlnaHRNb3RvciB8fCBERUZBVUxUX0NPTkZJRy5SSUdIVF9NT1RPUjtcblxuICAvLyBAdHMtaWdub3JlXG4gIGlmICghREVGQVVMVF9DT05GSUcuVkFMSURfTU9UT1JTLmluY2x1ZGVzKGNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yKSkgdGhyb3cgRXJyb3IoJ0RlZmluZSBsZWZ0IHBvcnQgcG9ydCBjb3JyZWN0bHknKTtcblxuICAvLyBAdHMtaWdub3JlXG4gIGlmICghREVGQVVMVF9DT05GSUcuVkFMSURfTU9UT1JTLmluY2x1ZGVzKGNvbmZpZ3VyYXRpb24ucmlnaHRNb3RvcikpIHRocm93IEVycm9yKCdEZWZpbmUgcmlnaHQgcG9ydCBwb3J0IGNvcnJlY3RseScpO1xuXG4gIGlmIChjb25maWd1cmF0aW9uLmxlZnRNb3RvciA9PT0gY29uZmlndXJhdGlvbi5yaWdodE1vdG9yKSB0aHJvdyBFcnJvcignTGVmdCBhbmQgcmlnaHQgbW90b3IgY2FuIG5vdCBiZSBzYW1lJyk7XG5cbiAgY29uZmlndXJhdGlvbi5kaXN0YW5jZU1vZGlmaWVyID0gY29uZmlndXJhdGlvbi5kaXN0YW5jZU1vZGlmaWVyIHx8IERFRkFVTFRfQ09ORklHLk1FVFJJQ19NT0RJRklFUjtcbiAgY29uZmlndXJhdGlvbi50dXJuTW9kaWZpZXIgPSBjb25maWd1cmF0aW9uLnR1cm5Nb2RpZmllciB8fCBERUZBVUxUX0NPTkZJRy5UVVJOX01PRElGSUVSO1xuICBjb25maWd1cmF0aW9uLmRyaXZlU3BlZWQgPSBjb25maWd1cmF0aW9uLmRyaXZlU3BlZWQgfHwgREVGQVVMVF9DT05GSUcuRFJJVkVfU1BFRUQ7XG4gIGNvbmZpZ3VyYXRpb24udHVyblNwZWVkID0gY29uZmlndXJhdGlvbi50dXJuU3BlZWQgfHwgREVGQVVMVF9DT05GSUcuVFVSTl9TUEVFRDtcbiAgY29uZmlndXJhdGlvbi5kZWZhdWx0U3RvcERpc3RhbmNlID0gY29uZmlndXJhdGlvbi5kZWZhdWx0U3RvcERpc3RhbmNlIHx8IERFRkFVTFRfQ09ORklHLkRFRkFVTFRfU1RPUF9ESVNUQU5DRTtcbiAgY29uZmlndXJhdGlvbi5kZWZhdWx0Q2xlYXJEaXN0YW5jZSA9IGNvbmZpZ3VyYXRpb24uZGVmYXVsdENsZWFyRGlzdGFuY2UgfHwgREVGQVVMVF9DT05GSUcuREVGQVVMVF9DTEVBUl9ESVNUQU5DRTtcbn07XG5cbmNvbnN0IHdhaXRGb3JWYWx1ZVRvU2V0ID0gZnVuY3Rpb24oXG4gIHZhbHVlTmFtZSxcbiAgY29tcGFyZUZ1bmMgPSB2YWx1ZU5hbWVUb0NvbXBhcmUgPT4gdGhpc1t2YWx1ZU5hbWVUb0NvbXBhcmVdLFxuICB0aW1lb3V0TXMgPSAwXG4pIHtcbiAgaWYgKGNvbXBhcmVGdW5jLmJpbmQodGhpcykodmFsdWVOYW1lKSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzW3ZhbHVlTmFtZV0pO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgc2V0VGltZW91dChcbiAgICAgIGFzeW5jICgpID0+IHJlc29sdmUoYXdhaXQgd2FpdEZvclZhbHVlVG9TZXQuYmluZCh0aGlzKSh2YWx1ZU5hbWUsIGNvbXBhcmVGdW5jLCB0aW1lb3V0TXMpKSxcbiAgICAgIHRpbWVvdXRNcyArIDEwMFxuICAgICk7XG4gIH0pO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBCb29zdENvbmZpZ3VyYXRpb24ge1xuICBkaXN0YW5jZU1vZGlmaWVyPzogYW55O1xuICB0dXJuTW9kaWZpZXI/OiBhbnk7XG4gIGRlZmF1bHRDbGVhckRpc3RhbmNlPzogYW55O1xuICBkZWZhdWx0U3RvcERpc3RhbmNlPzogYW55O1xuICBsZWZ0TW90b3I/OiBNb3RvcjtcbiAgcmlnaHRNb3Rvcj86IE1vdG9yO1xuICBkcml2ZVNwZWVkPzogbnVtYmVyO1xuICB0dXJuU3BlZWQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBIdWJBc3luYyBleHRlbmRzIEh1YiB7XG4gIGh1YkRpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgY29uZmlndXJhdGlvbjogQm9vc3RDb25maWd1cmF0aW9uO1xuICBwb3J0RGF0YTogYW55O1xuICB1c2VNZXRyaWM6IGJvb2xlYW47XG4gIG1vZGlmaWVyOiBudW1iZXI7XG4gIGRpc3RhbmNlOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoYmx1ZXRvb3RoOiBCbHVldG9vdGhSZW1vdGVHQVRUQ2hhcmFjdGVyaXN0aWMsIGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbikge1xuICAgIHN1cGVyKGJsdWV0b290aCk7XG4gICAgdmFsaWRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb24pO1xuICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gIH1cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3QgSHViXG4gICAqIEBtZXRob2QgSHViI2Rpc2Nvbm5lY3RBc3luY1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn0gZGlzY29ubmVjdGlvbiBzdWNjZXNzZnVsXG4gICAqL1xuICBkaXNjb25uZWN0QXN5bmMoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhpcy5zZXREaXNjb25uZWN0ZWQoKTtcbiAgICByZXR1cm4gd2FpdEZvclZhbHVlVG9TZXQuYmluZCh0aGlzKSgnaHViRGlzY29ubmVjdGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSB0aGlzIG1ldGhvZCBhZnRlciBuZXcgaW5zdGFuY2Ugb2YgSHViIGlzIGNyZWF0ZWRcbiAgICogQG1ldGhvZCBIdWIjYWZ0ZXJJbml0aWFsaXphdGlvblxuICAgKi9cbiAgYWZ0ZXJJbml0aWFsaXphdGlvbigpIHtcbiAgICB0aGlzLmh1YkRpc2Nvbm5lY3RlZCA9IG51bGw7XG4gICAgdGhpcy5wb3J0RGF0YSA9IHtcbiAgICAgIEE6IHsgYW5nbGU6IDAgfSxcbiAgICAgIEI6IHsgYW5nbGU6IDAgfSxcbiAgICAgIEFCOiB7IGFuZ2xlOiAwIH0sXG4gICAgICBDOiB7IGFuZ2xlOiAwIH0sXG4gICAgICBEOiB7IGFuZ2xlOiAwIH0sXG4gICAgICBMRUQ6IHsgYW5nbGU6IDAgfSxcbiAgICB9O1xuICAgIHRoaXMudXNlTWV0cmljID0gdHJ1ZTtcbiAgICB0aGlzLm1vZGlmaWVyID0gMTtcblxuICAgIHRoaXMuZW1pdHRlci5vbigncm90YXRpb24nLCByb3RhdGlvbiA9PiAodGhpcy5wb3J0RGF0YVtyb3RhdGlvbi5wb3J0XS5hbmdsZSA9IHJvdGF0aW9uLmFuZ2xlKSk7XG4gICAgdGhpcy5lbWl0dGVyLm9uKCdkaXNjb25uZWN0JywgKCkgPT4gKHRoaXMuaHViRGlzY29ubmVjdGVkID0gdHJ1ZSkpO1xuICAgIHRoaXMuZW1pdHRlci5vbignZGlzdGFuY2UnLCBkaXN0YW5jZSA9PiAodGhpcy5kaXN0YW5jZSA9IGRpc3RhbmNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgTEVEIG9uIHRoZSBNb3ZlIEh1YlxuICAgKiBAbWV0aG9kIEh1YiNsZWRBc3luY1xuICAgKiBAcGFyYW0ge2Jvb2xlYW58bnVtYmVyfHN0cmluZ30gY29sb3JcbiAgICogSWYgc2V0IHRvIGJvb2xlYW4gYGZhbHNlYCB0aGUgTEVEIGlzIHN3aXRjaGVkIG9mZiwgaWYgc2V0IHRvIGB0cnVlYCB0aGUgTEVEIHdpbGwgYmUgd2hpdGUuXG4gICAqIFBvc3NpYmxlIHN0cmluZyB2YWx1ZXM6IGBvZmZgLCBgcGlua2AsIGBwdXJwbGVgLCBgYmx1ZWAsIGBsaWdodGJsdWVgLCBgY3lhbmAsIGBncmVlbmAsIGB5ZWxsb3dgLCBgb3JhbmdlYCwgYHJlZGAsXG4gICAqIGB3aGl0ZWBcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBsZWRBc3luYyhjb2xvcjogYm9vbGVhbiB8IG51bWJlciB8IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMubGVkKGNvbG9yLCAoKSA9PiB7XG4gICAgICAgIC8vIENhbGxiYWNrIGlzIGV4ZWN1dGVkIHdoZW4gY29tbWFuZCBpcyBzZW50IGFuZCBpdCB3aWxsIHRha2Ugc29tZSB0aW1lIGJlZm9yZSBNb3ZlSHViIGV4ZWN1dGVzIHRoZSBjb21tYW5kXG4gICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgQ0FMTEJBQ0tfVElNRU9VVF9NUyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBtb3RvciBmb3Igc3BlY2lmaWMgdGltZVxuICAgKiBAbWV0aG9kIEh1YiNtb3RvclRpbWVBc3luY1xuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHBvcnQgcG9zc2libGUgc3RyaW5nIHZhbHVlczogYEFgLCBgQmAsIGBBQmAsIGBDYCwgYERgLlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRzYWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuIHJvdGF0aW9uXG4gICAqIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvclRpbWUgcnVuIHRpbWUgaGFzIGVsYXBzZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBtb3RvclRpbWVBc3luYyhwb3J0OiBzdHJpbmcgfCBudW1iZXIsIHNlY29uZHM6IG51bWJlciwgZHV0eUN5Y2xlOiBudW1iZXIgPSAxMDAsIHdhaXQ6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfKSA9PiB7XG4gICAgICB0aGlzLm1vdG9yVGltZShwb3J0LCBzZWNvbmRzLCBkdXR5Q3ljbGUsICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCB3YWl0ID8gQ0FMTEJBQ0tfVElNRU9VVF9NUyArIHNlY29uZHMgKiAxMDAwIDogQ0FMTEJBQ0tfVElNRU9VVF9NUyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYm90aCBtb3RvcnMgKEEgYW5kIEIpIGZvciBzcGVjaWZpYyB0aW1lXG4gICAqIEBtZXRob2QgSHViI21vdG9yVGltZU11bHRpQXN5bmNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlY29uZHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGVBPTEwMF0gbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlbiByb3RhdGlvblxuICAgKiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZUI9MTAwXSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuIHJvdGF0aW9uXG4gICAqIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvclRpbWUgcnVuIHRpbWUgaGFzIGVsYXBzZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBtb3RvclRpbWVNdWx0aUFzeW5jKHNlY29uZHM6IG51bWJlciwgZHV0eUN5Y2xlQTogbnVtYmVyID0gMTAwLCBkdXR5Q3ljbGVCOiBudW1iZXIgPSAxMDAsIHdhaXQ6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfKSA9PiB7XG4gICAgICB0aGlzLm1vdG9yVGltZU11bHRpKHNlY29uZHMsIGR1dHlDeWNsZUEsIGR1dHlDeWNsZUIsICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCB3YWl0ID8gQ0FMTEJBQ0tfVElNRU9VVF9NUyArIHNlY29uZHMgKiAxMDAwIDogQ0FMTEJBQ0tfVElNRU9VVF9NUyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIGEgbW90b3IgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQG1ldGhvZCBIdWIjbW90b3JBbmdsZUFzeW5jXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gcG9ydCBwb3NzaWJsZSBzdHJpbmcgdmFsdWVzOiBgQWAsIGBCYCwgYEFCYCwgYENgLCBgRGAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIGRlZ3JlZXMgdG8gdHVybiBmcm9tIGAwYCB0byBgMjE0NzQ4MzY0N2BcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGU9MTAwXSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuXG4gICAqIHJvdGF0aW9uIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvckFuZ2xlIGhhcyB0dXJuZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBtb3RvckFuZ2xlQXN5bmMocG9ydDogc3RyaW5nIHwgbnVtYmVyLCBhbmdsZTogbnVtYmVyLCBkdXR5Q3ljbGU6IG51bWJlciA9IDEwMCwgd2FpdDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIF8pID0+IHtcbiAgICAgIHRoaXMubW90b3JBbmdsZShwb3J0LCBhbmdsZSwgZHV0eUN5Y2xlLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh3YWl0KSB7XG4gICAgICAgICAgbGV0IGJlZm9yZVR1cm47XG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgYmVmb3JlVHVybiA9IHRoaXMucG9ydERhdGFbcG9ydF0uYW5nbGU7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXMgPT4gc2V0VGltZW91dChyZXMsIENBTExCQUNLX1RJTUVPVVRfTVMpKTtcbiAgICAgICAgICB9IHdoaWxlICh0aGlzLnBvcnREYXRhW3BvcnRdLmFuZ2xlICE9PSBiZWZvcmVUdXJuKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCBDQUxMQkFDS19USU1FT1VUX01TKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVHVybiBib3RoIG1vdG9ycyAoQSBhbmQgQikgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQG1ldGhvZCBIdWIjbW90b3JBbmdsZU11bHRpQXN5bmNcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIGRlZ3JlZXMgdG8gdHVybiBmcm9tIGAwYCB0byBgMjE0NzQ4MzY0N2BcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGVBPTEwMF0gbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlblxuICAgKiByb3RhdGlvbiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZUI9MTAwXSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuXG4gICAqIHJvdGF0aW9uIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvckFuZ2xlIGhhcyB0dXJuZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBtb3RvckFuZ2xlTXVsdGlBc3luYyhhbmdsZTogbnVtYmVyLCBkdXR5Q3ljbGVBOiBudW1iZXIgPSAxMDAsIGR1dHlDeWNsZUI6IG51bWJlciA9IDEwMCwgd2FpdDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIF8pID0+IHtcbiAgICAgIHRoaXMubW90b3JBbmdsZU11bHRpKGFuZ2xlLCBkdXR5Q3ljbGVBLCBkdXR5Q3ljbGVCLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh3YWl0KSB7XG4gICAgICAgICAgbGV0IGJlZm9yZVR1cm47XG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgYmVmb3JlVHVybiA9IHRoaXMucG9ydERhdGFbJ0FCJ10uYW5nbGU7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXMgPT4gc2V0VGltZW91dChyZXMsIENBTExCQUNLX1RJTUVPVVRfTVMpKTtcbiAgICAgICAgICB9IHdoaWxlICh0aGlzLnBvcnREYXRhWydBQiddLmFuZ2xlICE9PSBiZWZvcmVUdXJuKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCBDQUxMQkFDS19USU1FT1VUX01TKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIG1ldHJpYyB1bml0cyAoZGVmYXVsdClcbiAgICogQG1ldGhvZCBIdWIjdXNlTWV0cmljVW5pdHNcbiAgICovXG4gIHVzZU1ldHJpY1VuaXRzKCkge1xuICAgIHRoaXMudXNlTWV0cmljID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgaW1wZXJpYWwgdW5pdHNcbiAgICogQG1ldGhvZCBIdWIjdXNlSW1wZXJpYWxVbml0c1xuICAgKi9cbiAgdXNlSW1wZXJpYWxVbml0cygpIHtcbiAgICB0aGlzLnVzZU1ldHJpYyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBmcmljdGlvbiBtb2RpZmllclxuICAgKiBAbWV0aG9kIEh1YiNzZXRGcmljdGlvbk1vZGlmaWVyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtb2RpZmllciBmcmljdGlvbiBtb2RpZmllclxuICAgKi9cbiAgc2V0RnJpY3Rpb25Nb2RpZmllcihtb2RpZmllcjogbnVtYmVyKSB7XG4gICAgdGhpcy5tb2RpZmllciA9IG1vZGlmaWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIERyaXZlIHNwZWNpZmllZCBkaXN0YW5jZVxuICAgKiBAbWV0aG9kIEh1YiNkcml2ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gZGlzdGFuY2UgZGlzdGFuY2UgaW4gY2VudGltZXRlcnMgKGRlZmF1bHQpIG9yIGluY2hlcy4gUG9zaXRpdmUgaXMgZm9yd2FyZCBhbmQgbmVnYXRpdmUgaXMgYmFja3dhcmQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9dHJ1ZV0gd2lsbCBwcm9taXNlIHdhaXQgdW50aWxsIHRoZSBkcml2ZSBoYXMgY29tcGxldGVkLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRyaXZlKGRpc3RhbmNlOiBudW1iZXIsIHdhaXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBhbmdsZSA9XG4gICAgICBNYXRoLmFicyhkaXN0YW5jZSkgKlxuICAgICAgKCh0aGlzLnVzZU1ldHJpYyA/IHRoaXMuY29uZmlndXJhdGlvbi5kaXN0YW5jZU1vZGlmaWVyIDogdGhpcy5jb25maWd1cmF0aW9uLmRpc3RhbmNlTW9kaWZpZXIgLyA0KSAqXG4gICAgICAgIHRoaXMubW9kaWZpZXIpO1xuICAgIGNvbnN0IGR1dHlDeWNsZUEgPVxuICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmRyaXZlU3BlZWQgKiAoZGlzdGFuY2UgPiAwID8gMSA6IC0xKSAqICh0aGlzLmNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yID09PSAnQScgPyAxIDogLTEpO1xuICAgIGNvbnN0IGR1dHlDeWNsZUIgPVxuICAgICAgdGhpcy5jb25maWd1cmF0aW9uLmRyaXZlU3BlZWQgKiAoZGlzdGFuY2UgPiAwID8gMSA6IC0xKSAqICh0aGlzLmNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yID09PSAnQScgPyAxIDogLTEpO1xuICAgIHJldHVybiB0aGlzLm1vdG9yQW5nbGVNdWx0aUFzeW5jKGFuZ2xlLCBkdXR5Q3ljbGVBLCBkdXR5Q3ljbGVCLCB3YWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHJvYm90IHNwZWNpZmllZCBkZWdyZWVzXG4gICAqIEBtZXRob2QgSHViI3R1cm5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlZ3JlZXMgZGVncmVlcyB0byB0dXJuLiBOZWdhdGl2ZSBpcyB0byB0aGUgbGVmdCBhbmQgcG9zaXRpdmUgdG8gdGhlIHJpZ2h0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFt3YWl0PXRydWVdIHdpbGwgcHJvbWlzZSB3YWl0IHVudGlsbCB0aGUgdHVybiBoYXMgY29tcGxldGVkLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHR1cm4oZGVncmVlczogbnVtYmVyLCB3YWl0OiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgYW5nbGUgPSBNYXRoLmFicyhkZWdyZWVzKSAqIHRoaXMuY29uZmlndXJhdGlvbi50dXJuTW9kaWZpZXI7XG4gICAgY29uc3QgdHVybk1vdG9yTW9kaWZpZXIgPSB0aGlzLmNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yID09PSAnQScgPyAxIDogLTE7XG4gICAgY29uc3QgbGVmdFR1cm4gPSB0aGlzLmNvbmZpZ3VyYXRpb24udHVyblNwZWVkICogKGRlZ3JlZXMgPiAwID8gMSA6IC0xKSAqIHR1cm5Nb3Rvck1vZGlmaWVyO1xuICAgIGNvbnN0IHJpZ2h0VHVybiA9IHRoaXMuY29uZmlndXJhdGlvbi50dXJuU3BlZWQgKiAoZGVncmVlcyA+IDAgPyAtMSA6IDEpICogdHVybk1vdG9yTW9kaWZpZXI7XG4gICAgY29uc3QgZHV0eUN5Y2xlQSA9IHRoaXMuY29uZmlndXJhdGlvbi5sZWZ0TW90b3IgPT09ICdBJyA/IGxlZnRUdXJuIDogcmlnaHRUdXJuO1xuICAgIGNvbnN0IGR1dHlDeWNsZUIgPSB0aGlzLmNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yID09PSAnQScgPyByaWdodFR1cm4gOiBsZWZ0VHVybjtcbiAgICByZXR1cm4gdGhpcy5tb3RvckFuZ2xlTXVsdGlBc3luYyhhbmdsZSwgZHV0eUN5Y2xlQSwgZHV0eUN5Y2xlQiwgd2FpdCk7XG4gIH1cblxuICAvKipcbiAgICogRHJpdmUgdW50aWxsIHNlbnNvciBzaG93cyBvYmplY3QgaW4gZGVmaW5lZCBkaXN0YW5jZVxuICAgKiBAbWV0aG9kIEh1YiNkcml2ZVVudGlsXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZGlzdGFuY2U9MF0gZGlzdGFuY2UgaW4gY2VudGltZXRlcnMgKGRlZmF1bHQpIG9yIGluY2hlcyB3aGVuIHRvIHN0b3AuIERpc3RhbmNlIHNlbnNvciBpcyBub3QgdmVyeSBzZW5zaXRpdmUgb3IgYWNjdXJhdGUuXG4gICAqIEJ5IGRlZmF1bHQgd2lsbCBzdG9wIHdoZW4gc2Vuc29yIG5vdGljZXMgd2FsbCBmb3IgdGhlIGZpcnN0IHRpbWUuIFNlbnNvciBkaXN0YW5jZSB2YWx1ZXMgYXJlIHVzdWFseSBiZXR3ZWVuIDExMC01MC5cbiAgICogQHBhcmFtIHtib29sZWFufSBbd2FpdD10cnVlXSB3aWxsIHByb21pc2Ugd2FpdCB1bnRpbGwgdGhlIGJvdCB3aWxsIHN0b3AuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYXN5bmMgZHJpdmVVbnRpbChkaXN0YW5jZTogbnVtYmVyID0gMCwgd2FpdDogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGRpc3RhbmNlQ2hlY2sgPVxuICAgICAgZGlzdGFuY2UgIT09IDAgPyAodGhpcy51c2VNZXRyaWMgPyBkaXN0YW5jZSA6IGRpc3RhbmNlICogMi41NCkgOiB0aGlzLmNvbmZpZ3VyYXRpb24uZGVmYXVsdFN0b3BEaXN0YW5jZTtcbiAgICBjb25zdCBkaXJlY3Rpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb24ubGVmdE1vdG9yID09PSAnQScgPyAxIDogLTE7XG4gICAgY29uc3QgY29tcGFyZUZ1bmMgPSBkaXJlY3Rpb24gPT09IDEgPyAoKSA9PiBkaXN0YW5jZUNoZWNrID49IHRoaXMuZGlzdGFuY2UgOiAoKSA9PiBkaXN0YW5jZUNoZWNrIDw9IHRoaXMuZGlzdGFuY2U7XG4gICAgdGhpcy5tb3RvclRpbWVNdWx0aSg2MCwgdGhpcy5jb25maWd1cmF0aW9uLmRyaXZlU3BlZWQgKiBkaXJlY3Rpb24sIHRoaXMuY29uZmlndXJhdGlvbi5kcml2ZVNwZWVkICogZGlyZWN0aW9uKTtcbiAgICBpZiAod2FpdCkge1xuICAgICAgYXdhaXQgd2FpdEZvclZhbHVlVG9TZXQuYmluZCh0aGlzKSgnZGlzdGFuY2UnLCBjb21wYXJlRnVuYyk7XG4gICAgICBhd2FpdCB0aGlzLm1vdG9yQW5nbGVNdWx0aUFzeW5jKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gd2FpdEZvclZhbHVlVG9TZXRcbiAgICAgICAgLmJpbmQodGhpcykoJ2Rpc3RhbmNlJywgY29tcGFyZUZ1bmMpXG4gICAgICAgIC50aGVuKF8gPT4gdGhpcy5tb3RvckFuZ2xlTXVsdGkoMCwgMCwgMCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHVudGlsIHRoZXJlIGlzIG5vIG9iamVjdCBpbiBzZW5zb3JzIHNpZ2h0XG4gICAqIEBtZXRob2QgSHViI3R1cm5VbnRpbFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RpcmVjdGlvbj0xXSBkaXJlY3Rpb24gdG8gdHVybiB0by4gMSAob3IgYW55IHBvc2l0aXZlKSBpcyB0byB0aGUgcmlnaHQgYW5kIDAgKG9yIGFueSBuZWdhdGl2ZSkgaXMgdG8gdGhlIGxlZnQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9dHJ1ZV0gd2lsbCBwcm9taXNlIHdhaXQgdW50aWxsIHRoZSBib3Qgd2lsbCBzdG9wLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIHR1cm5VbnRpbChkaXJlY3Rpb246IG51bWJlciA9IDEsIHdhaXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBkaXJlY3Rpb25Nb2RpZmllciA9IGRpcmVjdGlvbiA+IDAgPyAxIDogLTE7XG4gICAgdGhpcy50dXJuKDM2MCAqIGRpcmVjdGlvbk1vZGlmaWVyLCBmYWxzZSk7XG4gICAgaWYgKHdhaXQpIHtcbiAgICAgIGF3YWl0IHdhaXRGb3JWYWx1ZVRvU2V0LmJpbmQodGhpcykoJ2Rpc3RhbmNlJywgKCkgPT4gdGhpcy5kaXN0YW5jZSA+PSB0aGlzLmNvbmZpZ3VyYXRpb24uZGVmYXVsdENsZWFyRGlzdGFuY2UpO1xuICAgICAgYXdhaXQgdGhpcy50dXJuKDAsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHdhaXRGb3JWYWx1ZVRvU2V0XG4gICAgICAgIC5iaW5kKHRoaXMpKCdkaXN0YW5jZScsICgpID0+IHRoaXMuZGlzdGFuY2UgPj0gdGhpcy5jb25maWd1cmF0aW9uLmRlZmF1bHRDbGVhckRpc3RhbmNlKVxuICAgICAgICAudGhlbihfID0+IHRoaXMudHVybigwLCBmYWxzZSkpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZUNvbmZpZ3VyYXRpb24oY29uZmlndXJhdGlvbjogQm9vc3RDb25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgdmFsaWRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb24pO1xuICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG4gIH1cbn1cbiIsImltcG9ydCB7IEJvb3N0Q29ubmVjdG9yIH0gZnJvbSAnLi9ib29zdENvbm5lY3Rvcic7XG5pbXBvcnQgeyBIdWJBc3luYywgQm9vc3RDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9odWIvaHViQXN5bmMnO1xuaW1wb3J0IHsgSHViQ29udHJvbCB9IGZyb20gJy4vYWkvaHViLWNvbnRyb2wnO1xuaW1wb3J0IHsgRGV2aWNlSW5mbywgQ29udHJvbERhdGEsIFJhd0RhdGEgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGVnb0Jvb3N0IHtcbiAgcHJpdmF0ZSBodWI6IEh1YkFzeW5jO1xuICBwcml2YXRlIGh1YkNvbnRyb2w6IEh1YkNvbnRyb2w7XG4gIHByaXZhdGUgY29sb3I6IHN0cmluZztcbiAgcHJpdmF0ZSB1cGRhdGVUaW1lcjogYW55O1xuICBwcml2YXRlIGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbjtcblxuICBwcml2YXRlIGxvZ0RlYnVnOiAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiB2b2lkID0gcyA9PiB7fTtcblxuICAvKipcbiAgICogSW5mb3JtYXRpb24gZnJvbSBMZWdvIEJvb3N0IG1vdG9ycyBhbmQgc2Vuc29yc1xuICAgKiBAcHJvcGVydHkgTGVnb0Jvb3N0I2RldmljZUluZm9cbiAgICovXG4gIHB1YmxpYyBkZXZpY2VJbmZvOiBEZXZpY2VJbmZvID0ge1xuICAgIHBvcnRzOiB7XG4gICAgICBBOiB7IGFjdGlvbjogJycsIGFuZ2xlOiAwIH0sXG4gICAgICBCOiB7IGFjdGlvbjogJycsIGFuZ2xlOiAwIH0sXG4gICAgICBBQjogeyBhY3Rpb246ICcnLCBhbmdsZTogMCB9LFxuICAgICAgQzogeyBhY3Rpb246ICcnLCBhbmdsZTogMCB9LFxuICAgICAgRDogeyBhY3Rpb246ICcnLCBhbmdsZTogMCB9LFxuICAgICAgTEVEOiB7IGFjdGlvbjogJycsIGFuZ2xlOiAwIH0sXG4gICAgfSxcbiAgICB0aWx0OiB7IHJvbGw6IDAsIHBpdGNoOiAwIH0sXG4gICAgZGlzdGFuY2U6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgIHJzc2k6IDAsXG4gICAgY29sb3I6ICcnLFxuICAgIGVycm9yOiAnJyxcbiAgICBjb25uZWN0ZWQ6IGZhbHNlLFxuICB9O1xuXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIHRvIHVzZWQgb24gbWFudWFsIGFuZCBBSSBjb250cm9sXG4gICAqIEBwcm9wZXJ0eSBMZWdvQm9vc3QjY29udHJvbERhdGFcbiAgICovXG4gIHB1YmxpYyBjb250cm9sRGF0YTogQ29udHJvbERhdGEgPSB7XG4gICAgaW5wdXQ6IG51bGwsXG4gICAgc3BlZWQ6IDAsXG4gICAgdHVybkFuZ2xlOiAwLFxuICAgIHRpbHQ6IHsgcm9sbDogMCwgcGl0Y2g6IDAgfSxcbiAgICBmb3JjZVN0YXRlOiBudWxsLFxuICAgIHVwZGF0ZUlucHV0TW9kZTogbnVsbCxcbiAgICBjb250cm9sVXBkYXRlVGltZTogdW5kZWZpbmVkLFxuICAgIHN0YXRlOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgLyoqXG4gICAqIERyaXZlIGZvcndhcmQgdW50aWwgd2FsbCBpcyByZWFjZWQgb3IgZHJpdmUgYmFja3dhcmRzIDEwMG1ldGVyc1xuICAgKiBAbWV0aG9kIExlZ29Cb29zdCNjb25uZWN0XG4gICAqIEBwYXJhbSB7Qm9vc3RDb25maWd1cmF0aW9ufSBbY29uZmlndXJhdGlvbj17fV0gTGVnbyBib29zdCBtb3RvciBhbmQgY29udHJvbCBjb25maWd1cmF0aW9uXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYXN5bmMgY29ubmVjdChjb25maWd1cmF0aW9uOiBCb29zdENvbmZpZ3VyYXRpb24gPSB7fSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uO1xuICAgICAgY29uc3QgYmx1ZXRvb3RoID0gYXdhaXQgQm9vc3RDb25uZWN0b3IuY29ubmVjdCh0aGlzLmhhbmRsZUdhdHREaXNjb25uZWN0LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5pbml0SHViKGJsdWV0b290aCwgdGhpcy5jb25maWd1cmF0aW9uKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3IgZnJvbSBjb25uZWN0OiAnICsgZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0SHViKGJsdWV0b290aDogQmx1ZXRvb3RoUmVtb3RlR0FUVENoYXJhY3RlcmlzdGljLCBjb25maWd1cmF0aW9uOiBCb29zdENvbmZpZ3VyYXRpb24pIHtcbiAgICB0aGlzLmh1YiA9IG5ldyBIdWJBc3luYyhibHVldG9vdGgsIGNvbmZpZ3VyYXRpb24pO1xuICAgIHRoaXMuaHViLmxvZ0RlYnVnID0gdGhpcy5sb2dEZWJ1ZztcblxuICAgIHRoaXMuaHViLmVtaXR0ZXIub24oJ2Rpc2Nvbm5lY3QnLCBhc3luYyBldnQgPT4ge1xuICAgICAgLy8gVE9ETzogVGhpcyBpcyBuZXZlciBsYXVuY2hlZCBhcyBldmVudCBjb21lcyBmcm9tIEJvb3N0Q29ubmVjdG9yXG4gICAgICAvLyBhd2FpdCBCb29zdENvbm5lY3Rvci5yZWNvbm5lY3QoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuaHViLmVtaXR0ZXIub24oJ2Nvbm5lY3QnLCBhc3luYyBldnQgPT4ge1xuICAgICAgdGhpcy5odWIuYWZ0ZXJJbml0aWFsaXphdGlvbigpO1xuICAgICAgYXdhaXQgdGhpcy5odWIubGVkQXN5bmMoJ3doaXRlJyk7XG4gICAgICB0aGlzLmxvZ0RlYnVnKCdDb25uZWN0ZWQnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuaHViQ29udHJvbCA9IG5ldyBIdWJDb250cm9sKHRoaXMuZGV2aWNlSW5mbywgdGhpcy5jb250cm9sRGF0YSwgY29uZmlndXJhdGlvbik7XG4gICAgYXdhaXQgdGhpcy5odWJDb250cm9sLnN0YXJ0KHRoaXMuaHViKTtcblxuICAgIHRoaXMudXBkYXRlVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLmh1YkNvbnRyb2wudXBkYXRlKCk7XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlR2F0dERpc2Nvbm5lY3QoKSB7XG4gICAgdGhpcy5sb2dEZWJ1ZygnaGFuZGxlR2F0dERpc2Nvbm5lY3QnKTtcblxuICAgIGlmICh0aGlzLmRldmljZUluZm8uY29ubmVjdGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgdGhpcy5odWIuc2V0RGlzY29ubmVjdGVkKCk7XG4gICAgdGhpcy5kZXZpY2VJbmZvLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy51cGRhdGVUaW1lcik7XG4gICAgdGhpcy5sb2dEZWJ1ZygnRGlzY29ubmVjdGVkJyk7XG5cbiAgICAvLyBUT0RPOiBDYW4ndCBnZXQgYXV0b3JlY29ubmVjdCB0byB3b3JrXG4gICAgLy8gaWYgKHRoaXMuaHViLm5vUmVjb25uZWN0KSB7XG4gICAgLy8gICB0aGlzLmh1Yi5zZXREaXNjb25uZWN0ZWQoKTtcbiAgICAvLyAgIHRoaXMuZGV2aWNlSW5mby5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgdGhpcy5odWIuc2V0RGlzY29ubmVjdGVkKCk7XG4gICAgLy8gICB0aGlzLmRldmljZUluZm8uY29ubmVjdGVkID0gZmFsc2U7XG4gICAgLy8gICBjb25zdCByZWNvbm5lY3Rpb24gPSBhd2FpdCBCb29zdENvbm5lY3Rvci5yZWNvbm5lY3QoKTtcbiAgICAvLyAgIGlmIChyZWNvbm5lY3Rpb25bMF0pIHtcbiAgICAvLyAgICAgYXdhaXQgdGhpcy5pbml0SHViKHJlY29ubmVjdGlvblsxXSwgdGhpcy5jb25maWd1cmF0aW9uKTtcbiAgICAvLyAgIH0gZWxzZSB7XG4gICAgLy8gICAgIHRoaXMubG9nRGVidWcoJ1JlY29ubmVjdGlvbiBmYWlsZWQnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBjb2xvciBvZiB0aGUgbGVkIGJldHdlZW4gcGluayBhbmQgb3JhbmdlXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I2NoYW5nZUxlZFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIGNoYW5nZUxlZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuaHViIHx8IHRoaXMuaHViLmNvbm5lY3RlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICB0aGlzLmNvbG9yID0gdGhpcy5jb2xvciA9PT0gJ3BpbmsnID8gJ29yYW5nZScgOiAncGluayc7XG4gICAgYXdhaXQgdGhpcy5odWIubGVkQXN5bmModGhpcy5jb2xvcik7XG4gIH1cblxuICAvKipcbiAgICogRHJpdmUgZm9yd2FyZCB1bnRpbCB3YWxsIGlzIHJlYWNlZCBvciBkcml2ZSBiYWNrd2FyZHMgMTAwbWV0ZXJzXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I2RyaXZlVG9EaXJlY3Rpb25cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkaXJlY3Rpb249MV0gRGlyZWN0aW9uIHRvIGRyaXZlLiAxIG9yIHBvc2l0aXZlIGlzIGZvcndhcmQsIDAgb3IgbmVnYXRpdmUgaXMgYmFja3dhcmRzLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIGRyaXZlVG9EaXJlY3Rpb24oZGlyZWN0aW9uID0gMSk6IFByb21pc2U8e30+IHtcbiAgICBpZiAoIXRoaXMucHJlQ2hlY2soKSkgcmV0dXJuO1xuICAgIGlmIChkaXJlY3Rpb24gPiAwKSByZXR1cm4gYXdhaXQgdGhpcy5odWIuZHJpdmVVbnRpbCgpO1xuICAgIGVsc2UgcmV0dXJuIGF3YWl0IHRoaXMuaHViLmRyaXZlKC0xMDAwMCk7XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBMZWdvIEJvb3N0XG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I2Rpc2Nvbm5lY3RcbiAgICogQHJldHVybnMge2Jvb2xlYW58dW5kZWZpbmVkfVxuICAgKi9cbiAgZGlzY29ubmVjdCgpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuaHViIHx8IHRoaXMuaHViLmNvbm5lY3RlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICB0aGlzLmh1Yi5zZXREaXNjb25uZWN0ZWQoKTtcbiAgICBjb25zdCBzdWNjZXNzID0gQm9vc3RDb25uZWN0b3IuZGlzY29ubmVjdCgpO1xuICAgIHJldHVybiBzdWNjZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IEFJIG1vZGVcbiAgICogQG1ldGhvZCBMZWdvQm9vc3QjYWlcbiAgICovXG4gIGFpKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5odWIgfHwgdGhpcy5odWIuY29ubmVjdGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIHRoaXMuaHViQ29udHJvbC5zZXROZXh0U3RhdGUoJ0RyaXZlJyk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBlbmdpbmVzIEEgYW5kIEJcbiAgICogQG1ldGhvZCBMZWdvQm9vc3Qjc3RvcFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx7fT4ge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgdGhpcy5jb250cm9sRGF0YS5zcGVlZCA9IDA7XG4gICAgdGhpcy5jb250cm9sRGF0YS50dXJuQW5nbGUgPSAwO1xuICAgIC8vIGNvbnRyb2wgZGF0YXMgdmFsdWVzIG1pZ2h0IGhhdmUgYWx3YXlzIGJlZW4gMCwgZXhlY3V0ZSBmb3JjZSBzdG9wXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaHViLm1vdG9yVGltZU11bHRpQXN5bmMoMSwgMCwgMCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIEJvb3N0IG1vdG9yIGFuZCBjb250cm9sIGNvbmZpZ3VyYXRpb25cbiAgICogQG1ldGhvZCBMZWdvQm9vc3QjdXBkYXRlQ29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0ge0Jvb3N0Q29uZmlndXJhdGlvbn0gY29uZmlndXJhdGlvbiBCb29zdCBtb3RvciBhbmQgY29udHJvbCBjb25maWd1cmF0aW9uXG4gICAqL1xuICB1cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb246IEJvb3N0Q29uZmlndXJhdGlvbik6IHZvaWQge1xuICAgIGlmICghdGhpcy5odWIpIHJldHVybjtcbiAgICB0aGlzLmh1Yi51cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb24pO1xuICAgIHRoaXMuaHViQ29udHJvbC51cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb24pO1xuICB9XG5cbiAgLy8gTWV0aG9kcyBmcm9tIEh1YlxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBMRUQgb24gdGhlIE1vdmUgSHViXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I2xlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW58bnVtYmVyfHN0cmluZ30gY29sb3JcbiAgICogSWYgc2V0IHRvIGJvb2xlYW4gYGZhbHNlYCB0aGUgTEVEIGlzIHN3aXRjaGVkIG9mZiwgaWYgc2V0IHRvIGB0cnVlYCB0aGUgTEVEIHdpbGwgYmUgd2hpdGUuXG4gICAqIFBvc3NpYmxlIHN0cmluZyB2YWx1ZXM6IGBvZmZgLCBgcGlua2AsIGBwdXJwbGVgLCBgYmx1ZWAsIGBsaWdodGJsdWVgLCBgY3lhbmAsIGBncmVlbmAsIGB5ZWxsb3dgLCBgb3JhbmdlYCwgYHJlZGAsXG4gICAqIGB3aGl0ZWBcbiAgICovXG4gIGxlZChjb2xvcjogYm9vbGVhbiB8IG51bWJlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgdGhpcy5odWIubGVkKGNvbG9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBMRUQgb24gdGhlIE1vdmUgSHViXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I2xlZEFzeW5jXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxudW1iZXJ8c3RyaW5nfSBjb2xvclxuICAgKiBJZiBzZXQgdG8gYm9vbGVhbiBgZmFsc2VgIHRoZSBMRUQgaXMgc3dpdGNoZWQgb2ZmLCBpZiBzZXQgdG8gYHRydWVgIHRoZSBMRUQgd2lsbCBiZSB3aGl0ZS5cbiAgICogUG9zc2libGUgc3RyaW5nIHZhbHVlczogYG9mZmAsIGBwaW5rYCwgYHB1cnBsZWAsIGBibHVlYCwgYGxpZ2h0Ymx1ZWAsIGBjeWFuYCwgYGdyZWVuYCwgYHllbGxvd2AsIGBvcmFuZ2VgLCBgcmVkYCxcbiAgICogYHdoaXRlYFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIGxlZEFzeW5jKGNvbG9yOiBib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nKTogUHJvbWlzZTx7fT4ge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaHViLmxlZEFzeW5jKGNvbG9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBtb3RvciBmb3Igc3BlY2lmaWMgdGltZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHBvcnQgcG9zc2libGUgc3RyaW5nIHZhbHVlczogYEFgLCBgQmAsIGBBQmAsIGBDYCwgYERgLlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW4gcm90YXRpb25cbiAgICogaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICovXG4gIG1vdG9yVGltZShwb3J0OiBzdHJpbmcgfCBudW1iZXIsIHNlY29uZHM6IG51bWJlciwgZHV0eUN5Y2xlID0gMTAwKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICB0aGlzLmh1Yi5tb3RvclRpbWUocG9ydCwgc2Vjb25kcywgZHV0eUN5Y2xlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBtb3RvciBmb3Igc3BlY2lmaWMgdGltZVxuICAgKiBAbWV0aG9kIExlZ29Cb29zdCNtb3RvclRpbWVBc3luY1xuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHBvcnQgcG9zc2libGUgc3RyaW5nIHZhbHVlczogYEFgLCBgQmAsIGBBQmAsIGBDYCwgYERgLlxuICAgKiBAcGFyYW0ge251bWJlcn0gc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW4gcm90YXRpb25cbiAgICogaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICogQHBhcmFtIHtib29sZWFufSBbd2FpdD1mYWxzZV0gd2lsbCBwcm9taXNlIHdhaXQgdW5pdGxsIG1vdG9yVGltZSBydW4gdGltZSBoYXMgZWxhcHNlZFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIG1vdG9yVGltZUFzeW5jKFxuICAgIHBvcnQ6IHN0cmluZyB8IG51bWJlcixcbiAgICBzZWNvbmRzOiBudW1iZXIsXG4gICAgZHV0eUN5Y2xlOiBudW1iZXIgPSAxMDAsXG4gICAgd2FpdDogYm9vbGVhbiA9IHRydWVcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLmh1Yi5tb3RvclRpbWVBc3luYyhwb3J0LCBzZWNvbmRzLCBkdXR5Q3ljbGUsIHdhaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBib3RoIG1vdG9ycyAoQSBhbmQgQikgZm9yIHNwZWNpZmljIHRpbWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlY29uZHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1dHlDeWNsZUEgbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlbiByb3RhdGlvblxuICAgKiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gZHV0eUN5Y2xlQiBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuIHJvdGF0aW9uXG4gICAqIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBtb3RvclRpbWVNdWx0aShzZWNvbmRzOiBudW1iZXIsIGR1dHlDeWNsZUE6IG51bWJlciA9IDEwMCwgZHV0eUN5Y2xlQjogbnVtYmVyID0gMTAwKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICB0aGlzLmh1Yi5tb3RvclRpbWVNdWx0aShzZWNvbmRzLCBkdXR5Q3ljbGVBLCBkdXR5Q3ljbGVCKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYm90aCBtb3RvcnMgKEEgYW5kIEIpIGZvciBzcGVjaWZpYyB0aW1lXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I21vdG9yVGltZU11bHRpQXN5bmNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNlY29uZHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGVBPTEwMF0gbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlbiByb3RhdGlvblxuICAgKiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZUI9MTAwXSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuIHJvdGF0aW9uXG4gICAqIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvclRpbWUgcnVuIHRpbWUgaGFzIGVsYXBzZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBhc3luYyBtb3RvclRpbWVNdWx0aUFzeW5jKFxuICAgIHNlY29uZHM6IG51bWJlcixcbiAgICBkdXR5Q3ljbGVBOiBudW1iZXIgPSAxMDAsXG4gICAgZHV0eUN5Y2xlQjogbnVtYmVyID0gMTAwLFxuICAgIHdhaXQ6IGJvb2xlYW4gPSB0cnVlXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy5odWIubW90b3JUaW1lTXVsdGlBc3luYyhzZWNvbmRzLCBkdXR5Q3ljbGVBLCBkdXR5Q3ljbGVCLCB3YWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIGEgbW90b3IgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBwb3J0IHBvc3NpYmxlIHN0cmluZyB2YWx1ZXM6IGBBYCwgYEJgLCBgQUJgLCBgQ2AsIGBEYC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gZGVncmVlcyB0byB0dXJuIGZyb20gYDBgIHRvIGAyMTQ3NDgzNjQ3YFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2R1dHlDeWNsZT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW5cbiAgICogcm90YXRpb24gaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICovXG4gIG1vdG9yQW5nbGUocG9ydDogc3RyaW5nIHwgbnVtYmVyLCBhbmdsZTogbnVtYmVyLCBkdXR5Q3ljbGU6IG51bWJlciA9IDEwMCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgdGhpcy5odWIubW90b3JBbmdsZShwb3J0LCBhbmdsZSwgZHV0eUN5Y2xlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIGEgbW90b3IgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQG1ldGhvZCBMZWdvQm9vc3QjbW90b3JBbmdsZUFzeW5jXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gcG9ydCBwb3NzaWJsZSBzdHJpbmcgdmFsdWVzOiBgQWAsIGBCYCwgYEFCYCwgYENgLCBgRGAuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIGRlZ3JlZXMgdG8gdHVybiBmcm9tIGAwYCB0byBgMjE0NzQ4MzY0N2BcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGU9MTAwXSBtb3RvciBwb3dlciBwZXJjZW50YWdlIGZyb20gYC0xMDBgIHRvIGAxMDBgLiBJZiBhIG5lZ2F0aXZlIHZhbHVlIGlzIGdpdmVuXG4gICAqIHJvdGF0aW9uIGlzIGNvdW50ZXJjbG9ja3dpc2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9ZmFsc2VdIHdpbGwgcHJvbWlzZSB3YWl0IHVuaXRsbCBtb3RvckFuZ2xlIGhhcyB0dXJuZWRcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBhc3luYyBtb3RvckFuZ2xlQXN5bmMoXG4gICAgcG9ydDogc3RyaW5nIHwgbnVtYmVyLFxuICAgIGFuZ2xlOiBudW1iZXIsXG4gICAgZHV0eUN5Y2xlOiBudW1iZXIgPSAxMDAsXG4gICAgd2FpdDogYm9vbGVhbiA9IHRydWVcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLmh1Yi5tb3RvckFuZ2xlQXN5bmMocG9ydCwgYW5nbGUsIGR1dHlDeWNsZSwgd2FpdCk7XG4gIH1cblxuICAvKipcbiAgICogVHVybiBib3RoIG1vdG9ycyAoQSBhbmQgQikgYnkgc3BlY2lmaWMgYW5nbGVcbiAgICogQG1ldGhvZCBMZWdvQm9vc3QjbW90b3JBbmdsZU11bHRpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSBkZWdyZWVzIHRvIHR1cm4gZnJvbSBgMGAgdG8gYDIxNDc0ODM2NDdgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkdXR5Q3ljbGVBIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW5cbiAgICogcm90YXRpb24gaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1dHlDeWNsZUIgbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlblxuICAgKiByb3RhdGlvbiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKi9cbiAgbW90b3JBbmdsZU11bHRpKGFuZ2xlOiBudW1iZXIsIGR1dHlDeWNsZUE6IG51bWJlciA9IDEwMCwgZHV0eUN5Y2xlQjogbnVtYmVyID0gMTAwKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICB0aGlzLmh1Yi5tb3RvckFuZ2xlTXVsdGkoYW5nbGUsIGR1dHlDeWNsZUEsIGR1dHlDeWNsZUIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm4gYm90aCBtb3RvcnMgKEEgYW5kIEIpIGJ5IHNwZWNpZmljIGFuZ2xlXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I21vdG9yQW5nbGVNdWx0aUFzeW5jXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSBkZWdyZWVzIHRvIHR1cm4gZnJvbSBgMGAgdG8gYDIxNDc0ODM2NDdgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZHV0eUN5Y2xlQT0xMDBdIG1vdG9yIHBvd2VyIHBlcmNlbnRhZ2UgZnJvbSBgLTEwMGAgdG8gYDEwMGAuIElmIGEgbmVnYXRpdmUgdmFsdWUgaXMgZ2l2ZW5cbiAgICogcm90YXRpb24gaXMgY291bnRlcmNsb2Nrd2lzZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkdXR5Q3ljbGVCPTEwMF0gbW90b3IgcG93ZXIgcGVyY2VudGFnZSBmcm9tIGAtMTAwYCB0byBgMTAwYC4gSWYgYSBuZWdhdGl2ZSB2YWx1ZSBpcyBnaXZlblxuICAgKiByb3RhdGlvbiBpcyBjb3VudGVyY2xvY2t3aXNlLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFt3YWl0PWZhbHNlXSB3aWxsIHByb21pc2Ugd2FpdCB1bml0bGwgbW90b3JBbmdsZSBoYXMgdHVybmVkXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYXN5bmMgbW90b3JBbmdsZU11bHRpQXN5bmMoXG4gICAgYW5nbGU6IG51bWJlcixcbiAgICBkdXR5Q3ljbGVBOiBudW1iZXIgPSAxMDAsXG4gICAgZHV0eUN5Y2xlQjogbnVtYmVyID0gMTAwLFxuICAgIHdhaXQ6IGJvb2xlYW4gPSB0cnVlXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy5odWIubW90b3JBbmdsZU11bHRpQXN5bmMoYW5nbGUsIGR1dHlDeWNsZUEsIGR1dHlDeWNsZUIsIHdhaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyaXZlIHNwZWNpZmllZCBkaXN0YW5jZVxuICAgKiBAbWV0aG9kIExlZ29Cb29zdCNkcml2ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gZGlzdGFuY2UgZGlzdGFuY2UgaW4gY2VudGltZXRlcnMgKGRlZmF1bHQpIG9yIGluY2hlcy4gUG9zaXRpdmUgaXMgZm9yd2FyZCBhbmQgbmVnYXRpdmUgaXMgYmFja3dhcmQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9dHJ1ZV0gd2lsbCBwcm9taXNlIHdhaXQgdW50aWxsIHRoZSBkcml2ZSBoYXMgY29tcGxldGVkLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIGRyaXZlKGRpc3RhbmNlOiBudW1iZXIsIHdhaXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTx7fT4ge1xuICAgIGlmICghdGhpcy5wcmVDaGVjaygpKSByZXR1cm47XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaHViLmRyaXZlKGRpc3RhbmNlLCB3YWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHJvYm90IHNwZWNpZmllZCBkZWdyZWVzXG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I3R1cm5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlZ3JlZXMgZGVncmVlcyB0byB0dXJuLiBOZWdhdGl2ZSBpcyB0byB0aGUgbGVmdCBhbmQgcG9zaXRpdmUgdG8gdGhlIHJpZ2h0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFt3YWl0PXRydWVdIHdpbGwgcHJvbWlzZSB3YWl0IHVudGlsbCB0aGUgdHVybiBoYXMgY29tcGxldGVkLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIHR1cm4oZGVncmVlczogbnVtYmVyLCB3YWl0OiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8e30+IHtcbiAgICBpZiAoIXRoaXMucHJlQ2hlY2soKSkgcmV0dXJuO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmh1Yi50dXJuKGRlZ3JlZXMsIHdhaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyaXZlIHVudGlsbCBzZW5zb3Igc2hvd3Mgb2JqZWN0IGluIGRlZmluZWQgZGlzdGFuY2VcbiAgICogQG1ldGhvZCBMZWdvQm9vc3QjZHJpdmVVbnRpbFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2Rpc3RhbmNlPTBdIGRpc3RhbmNlIGluIGNlbnRpbWV0ZXJzIChkZWZhdWx0KSBvciBpbmNoZXMgd2hlbiB0byBzdG9wLiBEaXN0YW5jZSBzZW5zb3IgaXMgbm90IHZlcnkgc2Vuc2l0aXZlIG9yIGFjY3VyYXRlLlxuICAgKiBCeSBkZWZhdWx0IHdpbGwgc3RvcCB3aGVuIHNlbnNvciBub3RpY2VzIHdhbGwgZm9yIHRoZSBmaXJzdCB0aW1lLiBTZW5zb3IgZGlzdGFuY2UgdmFsdWVzIGFyZSB1c3VhbHkgYmV0d2VlbiAxMTAtNTAuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9dHJ1ZV0gd2lsbCBwcm9taXNlIHdhaXQgdW50aWxsIHRoZSBib3Qgd2lsbCBzdG9wLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIGRyaXZlVW50aWwoZGlzdGFuY2U6IG51bWJlciA9IDAsIHdhaXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAoIXRoaXMucHJlQ2hlY2soKSkgcmV0dXJuO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmh1Yi5kcml2ZVVudGlsKGRpc3RhbmNlLCB3YWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIHVudGlsIHRoZXJlIGlzIG5vIG9iamVjdCBpbiBzZW5zb3JzIHNpZ2h0XG4gICAqIEBtZXRob2QgTGVnb0Jvb3N0I3R1cm5VbnRpbFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2RpcmVjdGlvbj0xXSBkaXJlY3Rpb24gdG8gdHVybiB0by4gMSAob3IgYW55IHBvc2l0aXZlKSBpcyB0byB0aGUgcmlnaHQgYW5kIDAgKG9yIGFueSBuZWdhdGl2ZSkgaXMgdG8gdGhlIGxlZnQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3dhaXQ9dHJ1ZV0gd2lsbCBwcm9taXNlIHdhaXQgdW50aWxsIHRoZSBib3Qgd2lsbCBzdG9wLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGFzeW5jIHR1cm5VbnRpbChkaXJlY3Rpb246IG51bWJlciA9IDEsIHdhaXQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAoIXRoaXMucHJlQ2hlY2soKSkgcmV0dXJuO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmh1Yi50dXJuVW50aWwoZGlyZWN0aW9uLCB3YWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHJhdyBkYXRhXG4gICAqIEBwYXJhbSB7b2JqZWN0fSByYXcgcmF3IGRhdGFcbiAgICovXG4gIHJhd0NvbW1hbmQocmF3OiBSYXdEYXRhKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnByZUNoZWNrKCkpIHJldHVybjtcbiAgICByZXR1cm4gdGhpcy5odWIucmF3Q29tbWFuZChyYXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmVDaGVjaygpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuaHViIHx8IHRoaXMuaHViLmNvbm5lY3RlZCA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcbiAgICB0aGlzLmh1YkNvbnRyb2wuc2V0TmV4dFN0YXRlKCdNYW51YWwnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIl19
