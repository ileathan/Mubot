// Description: 
//   Kill your imubot on command.
//
// Commands:
//   imubot die - kills your imubot
//
// Author:
//   leathan
//

(function() {
  module.exports = function(bot) {
    return bot.respond(/die$/i, { id: 'create.die' }, function(msg) {
      msg.send("You humans are so cruel.. very well then, ill die now.");
      return setTimeout(function(){process.exit(0)},100)
    });
  };

}).call(this);
