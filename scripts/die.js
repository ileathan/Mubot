// Description:
//   Kill your mubot on command.
//
// Commands:
//   Mubot die - kills your Mubot
//
// Author:
//   leathan
//
;(function() {
  module.exports = bot => {
    bot.respond(/die$/i, { id: 'create.die' }, function(msg) {
      msg.send("You humans are so cruel.. very well then, ill die now.");
      setTimeout(()=>process.exit(0), 1777);
    });
  };
}).call(this);
