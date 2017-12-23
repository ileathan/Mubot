
// Description:
//   calling mubot dumb makes mubot mad.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   None
//
module.exports = bot => {
  bot.hear(RegExp('@?' + (bot.alias || bot.name) + '[@:,]?\\s+(very|is|so|you(?:r)?).*(stupid|moron|idiot|dumb)', 'i'), msg => {
     msg.send("FUCK YOU!")
  });
};
