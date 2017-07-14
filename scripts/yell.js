// Description:
//   Make hubot yell whatever you'd life.
//
// Commands:
//   hubot yell <text> - Yells the text.

(function() {
  module.exports = function(bot) {
    return bot.respond(/yell(?: me)? (.*)$/i, function(r) {
      return r.send(r.match[1].toUpperCase());
    });
  };

}).call(this);
