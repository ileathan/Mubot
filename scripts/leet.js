// Description:
//   Make hubot talk in leetspeak.
//
// Commands:
//   hubot leet[ me] <text> - returns text in leetspeak.
//
// Author:
//   leathan
//
(function(){
  const leet = require('1337');
  module.exports = bot => {
    bot.respond(/leet(?: me)? (.*)/i, res => {
      res.send(leet(res.match[1]))
    })
  }
}).call(this);
