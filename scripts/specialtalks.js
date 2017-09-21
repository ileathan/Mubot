// Description:
//   Make hubot yell, spam, or use leetspeak.
//
// Commands:
//   hubot yell <text> - Yells the text.
//   hubot leet[ me] <text> - returns text in leetspeak.
//
// Author:
//   leathan
//

(function() {
  module.exports = bot => {
    bot.respond(/yell(?: me)? (.*)$/i, res => res.send(res.match[1].toUpperCase()));
    bot.respond(/leet(?: me)? (.*)/i, res => res.send(require('1337')(res.match[1])));
    bot.respond(/spam(?: me)? (\d{1,3})? ?(.*)$/i, res => {
      var spamAmount = res.match[1] || 5;
      if(spamAmount > 25) return res.send("Sorry the most I can span is 25 lines.");
      for(; spamAmount; --spamAmount) res.send(res.match[2])
    })
  }
}).call(this);
