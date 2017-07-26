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
  module.exports = function(bot) {
    bot.respond(/leet(?: me)? (.*)/i, function(r) {
      r.send(leet(r.match[1]));
    });
  };
}).call(this);
