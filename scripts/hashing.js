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
//   hubot md5|sha|sha1|sha256|sha512|rmd160 me <string> - Generate hash of <string>
//
// Author:
//   jimeh


(function() {
  var crypto, hexDigest;

  crypto = require('crypto');

  module.exports = function(robot) {
    robot.respond(/md5( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'md5'));
    });
    robot.respond(/SHA( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha'));
    });
    robot.respond(/SHA1( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha1'));
    });
    robot.respond(/SHA256( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha256'));
    });
    robot.respond(/SHA512( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'sha512'));
    });
    return robot.respond(/RMD160( me)? (.*)/i, function(msg) {
      return msg.send(hexDigest(msg.match[2], 'rmd160'));
    });
  };

  hexDigest = function(str, algo) {
    return crypto.createHash(algo).update(str, 'utf8').digest('hex');
  };

}).call(this);
