// Description:
//   calling mubot dumb makes mubot mad.
//
// Author:
//   leathan
//
;(function(){
  module.exports = bot => {
    bot.hear(RegExp('@?'+(bot.alias||bot.name)+'[@:,]?\\s+(very|is|so|you(?:r)?).*(stupid|moron|idiot|dumb)', 'i'), msg => {
       msg.send("FUCK YOU!");
    });
  };
}).call(this);
