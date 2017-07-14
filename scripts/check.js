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
      r.send(scanMe(r.match[1]));
    });
  };
  scanMe = (string) => {
    var res = [];
    for (i=0; i<robot.listeners.length; i++) {
      if (!robot.listeners[i].regex) continue;
      if (robot.listeners[i].regex.test(string)) res.push(`Match @ index ${i} \`\`\`${robot.listeners[i].regex}\`\`\``)
    }
    if (!res.length) res.push("No matches found.")
    return res;
  }
}).call(this);


