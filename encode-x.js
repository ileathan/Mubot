(function(){
function Converter() {
  // Allows different alphabets for incoming and outgoing encoding.
  this.outAlphabet = this.incAlpabet = null;
}
// Precomputed bases to help out, specifically base58 for bitcoin and base64 for blobs.
const BASES = {
  BASE_2: "01",
  BASE_8: "01234567",
  BASE_11: "0123456789a",
  BASE_16: "0123456789abcdef",
  BASE_32: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
  BASE_36: "0123456789abcdefghijklmnopqrstuvwxyz",
  BASE_58: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvqxyz",
  BASE_62: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  BASE_64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  BASE_66: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~",
  BASE_95: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/~!@#$%^&*()_`<>,.?'\";:[{]}\\|=- ",
  FALL_BACK: function(max_i){
    let res = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/~!@#$%^&*()_`<>,.?'\";:[{]}\\|=- ";
    if(max_i > res.length) return res.slice(0, max_i);
    // If the precomputations didnt help pump them up by looping through unicode.
    // Not getting any results over ~66000 so just going to hard code that for version 1.
    for(let i = 0; i < 67777 && res.length < max_i; ++i) {
      let char = String.fromCharCode(i);
      if(res.includes(char) // Throw away included chars.
        || /^[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]*$/.test(char) // throw away some unicode spaces.
        || !/^[\u0020-\u007e\u00a0-\uffff]*$/.test(char) // Throw away 'unprintables'
        || /^[\u0fd9-\u0fff]*$/.test(char) // Throw away more unicode white spaces.
        || /\s/.test(char) // Throw away whitespaces.
      ) continue;
      res += char;
    }
    return res.slice(0, max_i)
  }
}
// Retrieve the proper alphabet for use in conversiosn.
const alphabet = a => {
  if(typeof a === 'string') {
    if(a.split("").sort().join("").match(/(.)\1/g)) // Check for duplicates.
      throw new Error("Your alphabet must contain all unique charachters.")
    return a;
  }
  else if(BASES['BASE_' + a]) return BASES['BASE_' + a];
  // hard coded for version 1, can be avoided via the API (custom alphabets).
  else if(a > 65411) throw new Error("You need to specify a custom alphabet via `setGlobalAlphabet` for a base over 65411.");
  else {
    return BASES.FALL_BACK(a);
  }
}
// Our own add function to circumvent javascripts 64bit floating cap.
const add = (num1, num2, base) => {
  // Our core buffer.
  var res = new Uint32Array(num1.length + num2.length), carry = 0, i = 0;
  while(i < num1.length || i < num2.length || carry) {
    let total = carry + (num1[i]||0) + (num2[i]||0);
    // Modulous devision to swap bases. newNum = remainder concatinated with the remainders remainder and so on.
    res[i++] = total % base;
    carry = (total - total % base) / base
    // grow buffer if we are carrying for next remainder check.
    if(carry && i >= res.length) {
      let copy = new Uint32Array(num1.length + num2.length + res.length)
      copy.set(res);
      res = copy;
    }
  }
  return res.slice(0, i); // Give back only whats needed.
}
// Extend the addition function to introduce multiplications.
const multiply = (num, exponent, base) => {
  if(num <= 0) return num === 0 ? [] : null;
  var result = new Uint32Array();
  while(true) {
    // Bit shit to the right and keep doubling the exponent
    num & 1 && (result = add(result, exponent, base)); // First iteration will be 1.
    num = num >> 1;
    if(num === 0) break;
    exponent = add(exponent, exponent, base) // double.
  }
  return result
}
// Swap out to buffers to avoid memory limits.
const parseStrToNumberArray = (str, baseAlphabet) => {
  var digits = str.split('');
  var res = new Uint32Array(digits.length);
  var j = 0;
  for(let i = digits.length - 1; i >= 0; i--) {
    var n = baseAlphabet.indexOf(digits[i]);
    if(n < 0) throw new Error("Your data is not found in your alphabet.");
    res[j++] = n;
  }
  return res
}
// Conversion begins here.
const convertBase = (str, fromAlphabet, toAlphabet) => {
  var fromBase = fromAlphabet.length,
  toBase = toAlphabet.length,
  digits = parseStrToNumberArray(str.toString(), fromAlphabet); // coerce numbers to string
  if(digits === null) return null;
  var resNumbers = new Uint32Array(), exp = [1];
  for(let i = 0; i < digits.length; ++i) {
    resNumbers = add(resNumbers, multiply(digits[i], exp, toBase), toBase);
    exp = multiply(fromBase, exp, toBase)
  }
  // And ends here.
  var res = '';
  if(!resNumbers.length) {
  let i = str.length;
  while(i--)
    res += toAlphabet[0]
  } else {
    let i = resNumbers.length;
    while(i--)
 		res += toAlphabet[resNumbers[i]]
  }
  return res
}

function converter(ia = null, oa = null) { 
console.log(oa)
return new Proxy(Object.assign(new Converter, {
  // Our API.
  incAlphabet: ia,
  outAlphabet: oa,
  fromXXXToYYY: "Functions to encode and decode.",
  setGlobalAlphabet: "Set global alphabet.",
  setFromAlphabet: "Set from alphabet.",
  setToAlphabet: "Set to alphabet.",
}), {
  get(t, name) { // t is our target
    try { if(!(name + "")) return } catch(e) { return } // Hack to drop loading errors.
    // Regex parse for configuration requests.
    if(/^SetGlobalAlphabet$/i.test(name)) return function(globalAlphabet) {
      t.incAlphabet = t.outAlphabet = alphabet(globalAlphabet)
      return "setGlobalAlphabet done. " + t.incAlphabet.length + " " + t.outAlphabet.length
    }
    if(/^SetFromAlphabet$/i.test(name)) return function(fromAlphabet) {
      t.incAlphabet = alphabet(fromAlphabet);
      return "setFromAlphabet done. " + t.incAlphabet.length
    }
    if(/^SeTtoAlphabet$/i.test(name)) return function(toAlphabet) {
      t.outAlphabet = alphabet(toAlphabet);
      return "setToAlphabet done. " + t.outAlphabet.length
    }
    // Regex parse for request to encode/decode.
    var outIsData = srcIsData = false;
    let matches = name.match(/^from(\d+)to(\d+)$/i);
    if(!matches) {
      matches = name.match(/^from((?:str(?:ing)?)|text|utf8|data)to(\d+)$/i);
      if(!matches) {
        matches = name.match(/^from(\d+)to((?:str(?:ing)?)|text|utf8|data)$/i);
        if(!matches) return;
        outIsData = true
      } else {
        srcIsData = true
      }
    }
    // Our only 'public' facing function.
    return function(src) {
      // Begin alphabet configuration.
      if(srcIsData) {
        // Our source is not a number, so represent it as one.
        src = Buffer.from(src).toString('hex');
        a1 = alphabet(16);
        a2 = t.outAlphabet ? t.outAlphabet.slice(0, matches[2]) : alphabet(+matches[2]);
      } else if(outIsData) {
        a1 = t.incAlphabet ? t.incAlphabet.slice(0, matches[1]) : alphabet(+matches[1]);
        a2 = alphabet(16);
      } else {
        a1 = t.incAlphabet ? t.incAlphabet.slice(0, matches[1]) : alphabet(+matches[1]);
        a2 = t.outAlphabet ? t.outAlphabet.slice(0, matches[2]) : alphabet(+matches[2]);
        if(matches[1] > a1.length || matches[2] > a2.length) {
          throw new Error("Alphabet not long enough, consider manually setting a larger one via `setGlobalAlphabet`.")
        }
      }
      // If our output is not to be a number, assume its text/utf8..
      return outIsData ? Buffer.from(convertBase(src, a1, a2), 'hex').toString('utf8') : convertBase(src, a1, a2);
    }
  }
})
}
// Try to ensure compatibility accross browsers and node.
try { module.exports = converter } catch(e) { window.convert = converter };
}).apply(this, arguments);
