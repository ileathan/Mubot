const convert = (() => {
  //var query = require('cli-interact').getYesNo;
  var incAlphabet, outAlphabet = false;
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
      // Not getting any results over ~66000 so just stop.
      for(let i=0; i < 67777 && res.length < max_i; ++i) {
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
  const alphabet = a => {
    if(typeof a === 'string') {
      if(a.split("").sort().join("").match(/(.)\1/g)) // Check for duplicates.
        throw new Error("Your alphabet must contain all unique charachters.")
      return a;
    }
    else if(BASES['BASE_' + a]) return BASES['BASE_' + a];
    else if(a > 65411) throw new Error("You need to specify a custom alphabet via `setGlobalAlphabet` for a base over 65411.");
    else {
      return BASES.FALL_BACK(a);
    }
  }
	const add = (x, y, base) => {
    // Our core buffer.
		var res = new Uint32Array(x.length + y.length), carry = 0, i = 0;
		while(i < x.length || i < y.length || carry) {
	  	let total = carry + (x[i]||0) + (y[i]||0);
	  	res[i++] = total % base;
      carry = (total - total % base) / base
      // grow buffer if we are carrying
      if(carry && i >= res.length) {
        let copy = new Uint32Array(x.length + y.length + res.length)
        copy.set(res);
        res = copy;
      }
		}
		return res.slice(0, i); // Give back only whats needed.
	}
	const multiply = (num, exponent, base) => {
		if(num === 0 || num < 0) return num === 0 ? [] : null;
		var result = new Uint32Array();
		while(true) {
		  if(num & 1) {
		    result = add(result, exponent, base)
  	  }
		  num = num >> 1;
      if(num === 0) break;
      exponent = add(exponent, exponent, base)
	  }
	  return result
 	}
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
		var res = '';
		for(let i = resNumbers.length - 1; i >= 0; i--) {
      if(res === '' && resNumbers[i] === 0) continue;
			res += toAlphabet[resNumbers[i]]
		}
		return res
	}
  return new Proxy({
    // Our API.
    fromXXXToYYY: "Functions to encode and decode.",
    setGlobalAlphabet: "Set global alphabet.",
    setFromAlphabet: "Set from alphabet.",
    setToAlphabet: "Set to alphabet."
   }, {
    get(target, name) {
      try { if(!(name + "")) return } catch(e) { return } // Hack to drop loading errors.
      if(/^setglobalalphabet$/i.test(name)) return function(globalAlphabet) {
        incAlphabet = outAlphabet = alphabet(globalAlphabet || INITIAL_ALPHABET)
        return target + " setGlobalAlphabet done."
      }
      if(/^setfromalphabet$/i.test(name)) return function(fromAlphabet) {
        incAlphabet = alphabet(fromAlphabet || INITIAL_ALPHABET);
        return target + " setFromAlphabet done."
      }
      if(/^settoalphabet$/i.test(name)) return function(toAlphabet) {
        outAlphabet = alphabet(toAlphabet || INITIAL_ALPHABET);
        return target + " setToAlphabet done."
      }

      var outIsData = srcIsData = false;
      let matches = name.match(/from(\d+)to(\d+)/i);
      if(!matches) {
        matches = name.match(/from(text|utf8|data)to(\d+)/i);
        if(!matches) {
          matches = name.match(/from(\d+)to(text|utf8|data)/i);
          if(!matches) return;
console.log("BEEEP 1")
          outIsData = true;
        } else {
          srcIsData = true;
        }
      }
      return function(src) {
console.log("BEEP 2")
        var a1, a2; // our alphabets.
        if(matches[1] === matches[2] || srcIsData && srcIsData === outIsData) return src;
console.log("BEEP 3")
        if(srcIsData) {
          src = Buffer.from(src).toString('hex');
          a1 = alphabet(16);
          a2 = alphabet(outAlphabet || +matches[2]).slice(0, matches[2]);
        } else if(outIsData) {
console.log("BEEP")
          a1 = alphabet(incAlphabet || +matches[1]).slice(0, matches[1]);
          a2 = alphabet(16);
        } else {
          a1 = alphabet(incAlphabet || +matches[1]).slice(0, matches[1])
          a2 = alphabet(outAlphabet || +matches[2]).slice(0, matches[2])
          if(matches[1] > a1.length || matches[2] > a2.length) {
            throw new Error("Alphabet not long enough, consider manually setting a larger one via `setGlobalAlphabet`.")
          }
        }
        return outIsData ? Buffer.from(convertBase(src, a1, a2), 'hex').toString('utf8') : convertBase(src, a1, a2);
      }
    }
  })
})();

try { module.exports = convert } catch(e) { window.convert = convert };
