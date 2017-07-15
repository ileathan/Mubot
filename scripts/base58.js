// Description:
//   Base58 encoding and decoding
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot base58 encode|decode <query> - Base58 encode or decode <query>
//
// Author:
//   jimeh

(function() {
  var Base58, Base58Builder;

  module.exports = function(robot) {
    robot.respond(/base58 encode( me)? (.*)/i, function(msg) {
      var e;
      try {
        return msg.send(Base58.encode(msg.match[2]));
      } catch (error) {
        e = error;
        if (e.message !== 'Value passed is not an integer.') {
          throw e;
        }
        return msg.send("Base58 encoding only works with Integer values.");
      }
    });
    return robot.respond(/base58 decode( me)? (.*)/i, function(msg) {
      var e;
      try {
        return msg.send(Base58.decode(msg.match[2]));
      } catch (error) {
        e = error;
        if (e.message !== 'Value passed is not a valid Base58 string.') {
          throw e;
        }
        return msg.send("Not a valid base58 encoded string.");
      }
    });
  };

  Base58Builder = (function() {
    function Base58Builder() {
      this.alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
      this.base = this.alphabet.length;
    }

    Base58Builder.prototype.encode = function(num) {
      var mod, str;
      if (!/^\d+$/.test(num)) {
        throw new Error('Value passed is not an integer.');
      }
      if (typeof num !== 'number') {
        num = parseInt(num);
      }
      str = '';
      while (num >= this.base) {
        mod = num % this.base;
        str = this.alphabet[mod] + str;
        num = (num - mod) / this.base;
      }
      return this.alphabet[num] + str;
    };

    Base58Builder.prototype.decode = function(str) {
      var char, char_index, i, index, len, num, ref;
      num = 0;
      ref = str.split("").reverse();
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        char = ref[index];
        if ((char_index = this.alphabet.indexOf(char)) === -1) {
          throw new Error('Value passed is not a valid Base58 string.');
        }
        num += char_index * Math.pow(this.base, index);
      }
      return num;
    };

    return Base58Builder;

  })();

  Base58 = new Base58Builder();

}).call(this);
