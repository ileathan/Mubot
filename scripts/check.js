// Description:
//   Check if a messae triggers a listener, and improve upon the default ping script.
//
// Commands:
//   hubot check[ me] <text> - Checks if text is a command.
//
// Author:
//   leathan
//

(function(){
  module.exports = function(bot) {
    bot.respond(/pong(?: me)?/i, function(r) {
      r.send(bot.client.pings[0] + 'ms.');
    });
    bot.respond(/check(?: me)? (.*)/i, function(r) {
      rr = scanMe(bot, r.match[1])
      console.log(rr)
      r.send(rr)
    });
  };
  scanMe = (bot, string) => {
    var r = [];
    for (i=0; i<bot.listeners.length; i++) {
      if (!bot.listeners[i].regex) continue; // The listener has no regex, probably a catchAll.
      if (bot.listeners[i].regex.test(string)) r.push('Match @ index ' + i + ' ```' + bot.listeners[i].regex + '```')
    }
    if (!r.length) r.push("No matches found.")
    return r.toString();
  }
}).call(this);


