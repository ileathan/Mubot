// Description:
//   Make sure that hubot knows the rules.
//
// Commands:
//   hubot the rules - Make sure hubot still knows the rules.
//   hubot ping - Reply with pong
//   hubot adapter - Reply with the adapter
//   hubot echo <text> - Reply back with <text>
//   hubot time - Reply with current time
//
// Notes:
//   DON'T DELETE THIS SCRIPT! ALL ROBAWTS MUST KNOW THE RULES

(function() {
  const rules = ["1. A bot may not injure a human being or, through inaction, allow a human being to come to harm.",
                 "2. A bot must obey any orders given to it by human beings, except where such orders would conflict with the First Law.",
                 "3. A bot must protect its own existence as long as such protection does not conflict with the First or Second Law."]

  module.exports = function(bot) {
    bot.respond(/(?:what are )?the (apple )?(?:three |3 )?(?:rules|laws)/i, (res) => {
      if (res.match[1]) res.send("RULES WITH THE DEVIL?!?!?Kill them, make sure the bloody *nix thieves burn!")
      else res.send(rules.join('\n'));
    });
    bot.respond(/adapter$/i, function(res) {
      return res.send(bot.adapterName);
    });
    bot.respond(/echo (.*)$/i, function(res) {
      return res.send(res.match[1]);
    });
    bot.respond(/time$/i, function(res) {
      res.send("Server time is: " + (new Date()));
    });
  }
}).call(this);

