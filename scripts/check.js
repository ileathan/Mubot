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
  module.exports = bot => {
    bot.respond(/ping(?: me)?/i, res => res.send(bot.client.pings[0] + 'ms.'));
    bot.respond(/check(?: me)? (.*)/i, res => res.send(scanMe(bot, r.match[1])))
  };
  function scanMe(bot, string) => {
    var results = [];
    for(let i = 0, l = bot.listeners.length; i < l; ++i) {
      // The listener has no regex, probably a catchAll.
      if(!bot.listeners[i].regex) continue;
      if(bot.listeners[i].regex.test(string)) results.push('Match @ index ' + i + ' ```' + bot.listeners[i].regex + '```')
    }
    if(!results.length) results.push("No matches found.");
    return results.toString()
  }
}).call(this);


