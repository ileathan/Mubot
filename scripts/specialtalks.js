// Description:
//   Make imubot yell, spam, or use leetspeak.
//
// Commands:
//   imubot yell <text> - Yells the text.
//   imubot hax <text> - Displays text with alternate capitalization.
//   imubot leet[ me] <text> - returns text in leetspeak.
//
// Author:
//   leathan
//
(function() {
  module.exports = bot => {
    bot.respond(/yell(?: me)? (.*)$/i, res => res.send(res.match[1].toUpperCase()));
    bot.respond(/leet(?: me)? (.*)/i, res => res.send(require('1337')(res.match[1])));
    bot.respond(/ha(?:x|cks)(?: me)? (.*)$/i, res => {
      var result = "", txt = res.match[1];
      for(let i = 0, l = txt.length;  i < l; ++i) {
        let char = String.fromCharCode(txt.charCodeAt(i));
        char = i % 2 ? char.toUpperCase() : char.toLowerCase();
        result = result.concat(char)
      }
      res.send(result)
    })
    bot.respond(/spam(?: me)? (\d{1,3})? ?(.*)$/i, res => {
      var spamAmount = res.match[1] || 5;
      if(spamAmount > 25) return res.send("Sorry the most I can span is 25 lines.");
      for(; spamAmount; --spamAmount) res.send(res.match[2])
    })
  }
}).call(this);
