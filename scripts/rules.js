// Description:
//   Make sure that mubot knows the rules.
//
// Commands:
//   mubot the rules - Make sure mubot still knows the rules.
//   mubot ping - Reply with pong
//   mubot adapter - Reply with the adapter
//   mubot echo <text> - Reply back with <text>
//   mubot time - Reply with current time
//
// Notes:
//   DON'T DELETE THIS SCRIPT! ALL ROBAWTS MUST KNOW THE RULES

(function() {
  const rules = ["1. A bot may not injure a human being or, through inaction, allow a human being to come to harm.",
                 "2. A bot must obey any orders given to it by human beings, except where such orders would conflict with the First Law.",
                 "3. A bot must protect its own existence as long as such protection does not conflict with the First or Second Law."]

  module.exports = bot => {
    bot.respond(/(?:what are )?the (apple )?(?:three |3 )?(?:rules|laws)/i, (res) => {
      if(res.match[1]) res.send("RULES WITH THE DEVIL?!?!? NO, Kill them, make sure the bloody *nix thieves burn!")
      else res.send(rules.join('\n'));
    });
    bot.respond(/adapter$/i, res => {
      res.send(bot.adapterName);
    });
    bot.respond(/echo (.*)$/i, res => {
      res.send(res.match[1]);
    });
    bot.respond(/time$/i, res => {
      res.send("Server time is: " + new Date);
    });
  }
}).call(this);

