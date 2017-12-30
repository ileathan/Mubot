// Description:
//   Various hashing algorithms.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   imubot md5|sha|sha1|sha256|sha512|rmd160 me <string> - Generate hash of <string>
//
// Author:
//   jimeh


(function() {
  var crypto, hexDigest;

  crypto = require('crypto');

  module.exports = function(bot) {
    bot.respond(/md5( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'md5'));
    });
    bot.respond(/SHA( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha'));
    });
    bot.respond(/SHA1( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha1'));
    });
    bot.respond(/SHA256( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha256'));
    });
    bot.respond(/SHA512( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha512'));
    });
    return bot.respond(/RMD160( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'rmd160'));
    });
  };

  hexDigest = function(str, algo) {
    return crypto.createHash(algo).update(str, 'utf8').digest('hex');
  };

}).call(this);
