# encode-x
Infinite base encoder/decoder. Can handle bases up to full 64 bit floating points.

```javascript
const C = require('encode-x')();

C.from10To16("16")                        // 'f'
C.from16To64("16")                        // 'P'
C.from10to64("63")                        // '/'
C.from10to65000("125")                    // '¿'
C.fromUTF8To666("The devil says, SICK!")  // '½Ǥɰ:ɧźaM)ûȭǉĎʍ9ĿƢȷ'
C.from666ToUTF8('½Ǥɰ:ɧźaM)ûȭǉĎʍ9ĿƢȷ')     // 'The devil says, SICK!'
```

As you can tell, the module works for all bases and uses a Proxy to capture the methods, they are not actually all defined on the prototype.

The core algorithm uses modular division and bitshifting exponentiation logic applied directly to buffer streams. It is from my experience
the only working full base conversion module that actually works and scales. Also, for the most part, the code is completely original.

For full documentation see the [encode-x full docs](https://ileathan.github.io/encode-x).

# Features

**1.)** In built alphabets, up to base 65411 by default.

**2.)** `setGlobalAlphabet`, `setFromAlphabet`, `setToAlphabet`, and `resetAlphabets` API for ease.

**3.)** Ability to parse text data to and from.

**4.)** Ability to encode and decode streems of pure 0's. (usually lost data in encodings).

**5.)** Ability to encode to an alphabet differant than the incomings base alphabet.

**6.)** For example using the above feature we can swap from alphabet 1 to 2 using `from10To10`.

**7.)** A `dumpAlphabets` command to conveniently store your favorite, or needed alphabets.

You may also require and call the object directly (like bellow), or even link to it from a browser. 

```javascript
C = require('./encode-x')(/* [from alphabet], [to alphabet] */).fromXXXtoXXX(data) 
     
      /* OR */

C = require('./encode-x')
C.setToAlphabet = C.setFromAlphabet = "1234567890abcdefgahiklm"
C.from10to999(data) // Error is thrown because the alphabet it to small for base999.
```

# Instalation

```npm install encode-x```

# Dependencies

None.
