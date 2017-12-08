# encode-x
Infinite base encoder/decoder. Can handle bases up to full 64 bit floating points _Enough to represent the entire bitcoin private key space with at most 3 characters!_

```javascript
const C = require('encode-x')();  // Without the trailing () you would do c(fromAlphabet, toAlphabet).fromXXXToYYY(data)

C.from10To16("16");                        // 'f'
C.from16To64("16");                        // 'P'
C.from10to64("63");                        // '/'
C.from10to65000("125");                    // '¿'
C.fromUTF8To666("The devil says, SICK!");  // '½Ǥɰ:ɧźaM)ûȭǉĎʍ9ĿƢȷ'
C.from666ToUTF8('½Ǥɰ:ɧźaM)ûȭǉĎʍ9ĿƢȷ');    // 'The devil says, SICK!'

// fromDataToXXX and fromTextToXXX are synonyms for fromUTF8ToXXX
// likewise one can do fromXXXtoData, and fromXXXtoText.
```

In case you come to need the default alphabet(if unspecified, and no precomputed base matches), its mapped with a simple unicode loop.

```javascript
[...Array(AMOUNT_DESIRED+=48).keys()].slice(48).map(_=>String.fromCharCode(_))
```
As you can tell, the module works for all bases and uses a Proxy to capture the methods, they are not actually all defined on the prototype.

The core algorithm uses modular division and bitshifting exponentiation logic applied directly to buffer streams. It is from my experience
the only working full base conversion module that is both practical and scales to a high degree. For the most part, the code is original.

For full documentation see the [encode-x full docs](https://ileathan.github.io/encode-x).

# Features

**1.)** In built alphabets, up to base **1 million** plus by default.

**2.)** `setGlobalAlphabet`, `setFromAlphabet`, `setToAlphabet`, and `resetAlphabets` API for ease.

**3.)** Ability to parse text data to and from.

**4.)** Ability to encode and decode streems of pure 0's. (usually lost data in encodings).

**5.)** Ability to encode/decode from/to using a base different than the incoming/outgoing base.

**6.)** For example using the above feature we can swap from alphabet 1 to 2 using `from10To10`.

**7.)** A `dumpAlphabets` command to conveniently store your favorite, or needed alphabets.

You may also require and call the object directly (like bellow), or even link to it from a browser. 

```javascript
reply = require('encode-x')(/* [from alphabet], [to alphabet] */).fromXXXtoXXX(data) 
     
      /* OR */

C = require('encode-x')()
C.setToAlphabet = C.setFromAlphabet = "1234567890abcdefgahiklm"
C.from10to999(data) // Error is thrown because the alphabet it to small for base999.

      /* OR */

require('encode-x').setGlobalAlphabet("1234567890abcde").dumpAlphabets().from64To100(/*...*/);
```

# Instalation

```npm install encode-x```

# Dependencies

None.

<p>

# THE BELLOW CODE IS NOT PART OF ENCODE-X
__It is what inspired me to go past the memory limits__


## Example using this modules core logic to parse rgb[a] data into hex..

```javascript
/* Unless the regular expressions are modified accordingly...
* data should be of the format "rgba(213, 11, 0, 70)" or "rgb(113, 81, 70)"
* returns "#d50b0046" and "#4286f4" respectively. */

function cssRGBToHex(cssRGB) {
  var digits = cssRGB.match(/^rgba?\((\d{0,3}), ?(\d{0,3}), ?(\d{0,3})(?:, ?(\d{0,3})\))?\)?$/).slice(1);
  var alphabet = "0123456789abcdef";
  var base = alphabet.length;

  // Pop off the rgb ALPHA slot if its not present.
  digits.slice(-1)[0] === undefined && digits.pop();
  var final = [];
  for(let i = 0, l = digits.length; i < l; ++i) {
    let digit = digits[i], res = []; 

    do {
      res.push(digit % base);
      digit = Math.floor(digit / base)|0  // |0 for NaN
    } while(digit);
  
    // Create padding if the rgba # was under 0x10
    res.push("0".repeat(res.length % 2));
    final += res.map(_=>alphabet[_]).join('');
    res = []
  }
  return '#' + final
} 
```

The above gist has been battle tested, the bellow is purely me typing into the README as an example.
Extended a much less than the module, but enough for the curious mind.

```javascript
function Convert(data, raw) { // Assume "255"
  if(raw) return {this} = raw;
  this._raw = Buffer.from(new Uint8Array(data.length)) || null;

  // Our character map (up to base ~65411).
  this.alphabet = null;
  this._alphabet = new function() { 
    return s => 
      [...Array(s+=48).keys()].slice(48).map(_=>String.fromCharCode(_))
  }
}
Convert.prototype.encode(data, base) {
  var alphabet = this.alphabet || (this.alphabet = this._alphabet(base||16));
  var digits = this._raw || null;
  var base = base || this.alphabet.length;

  if(digits) {
    try { digits = Buffer.from(new Uint8Array(data.length) }
    catch(e) { this.FLAG_UTF8 = true; digits = Buffer.from(data) }
  }
  // digits.slice(-1)[0] === undefined && digits.pop(); -- Example to pop off useless 'decoding' data (like base64 ='s).
  // Strips the [A] of the RGB[A] color data.  

  digits.forEach(digit => { 
    var carry, res = [];
    do {
      res.push(carry % base);
      carry = digit = Math.floor(digit / base)|0;  // |0 for NaN
    } while(carry)
  
    // res.push("0".repeat(res.length % 2)) -- an example to pad RGB[A] colors into proper hex format. (base 64 is similar)
    final += res.map(_=>alphabet[_]).join('') + " ";
    res = []; carry = 0;
  })
  console.log(final)
} 

```
