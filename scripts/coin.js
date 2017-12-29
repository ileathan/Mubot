// Description:
//   Help decide between two things
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot throw a coin - Gives you heads or tails
//

(function() {
  var thecoin;

  thecoin = ["heads", "tails"];

  module.exports = function(bot) {
    return bot.respond(/(throw|flip|toss) a coin/i, function(msg) {
      return msg.reply(msg.random(thecoin));
    });
  };

}).call(this);
