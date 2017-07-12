// Description: 
//   Kill your hubot on command.
//
// Commands:
//   hubot die - kills your hubot
//
// Author:
//   leathan
//

(function() {
  module.exports = function(robot) {
    return robot.respond(/die$/i, function(msg) {
      msg.send("You humans are so cruel.. very well then, ill die now.");
      return setTimeout(function(){process.exit(0)},100)
    });
  };

}).call(this);