// Description:
//   Base64 encoding and decoding
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot base64 encode|decode <query> - Base64 encode or decode <string>
//
// Author:
//   jimeh
//
(function() {
  module.exports = bot => {
    bot.respond(/base64 encode(?: me)? (.*)/i, msg => {
      msg.send(new Buffer(msg.match[1]).toString('base64'))
    });
    bot.respond(/base64 decode(?: me)? (.*)/i, msg => {
      return msg.send(new Buffer(msg.match[1], 'base64').toString('utf8'))
    })
  }
}).call(this);
