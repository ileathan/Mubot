// Description: 
//   Kill your mubot on command.
//
// Commands:
//   mubot die - kills your mubot
//
// Author:
//   leathan
//
(function() {
  module.exports = bot => {
    bot.respond(/die$/i, { id: 'create.die' }, function(msg) {
      msg.send("You humans are so cruel.. very well then, ill die now.");
       setTimeout(()=>process.exit(0), 100)
    });
  };
}).call(this);
