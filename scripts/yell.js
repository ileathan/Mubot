// Description:
//   Make hubot yell whatever you'd life.
//
// Commands:
//   hubot yell <text> - Yells the text.

(function() {
  module.exports = function(robot) {
    return robot.respond(/YELL (.*)$/i, function(msg) {
      return msg.send(msg.match[1].toUpperCase());
    });
  };

}).call(this);
