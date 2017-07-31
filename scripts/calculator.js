// Description:
//   Allows Hubot to do mathematics.
//
// Dependencies:
//   "mathjs": ">= 0.16.0"
//
// Configuration:
//   None
//
// Commands:
//   calculate|math <expression> - Calculate the given math expression.
//   convert <expression> in <units> - Convert expression to given units.
//
// Author:
//   canadianveggie

(function() {
  const mathjs = require("mathjs");

  module.exports = function(bot) {
    return bot.respond(/(calc|calculate|calculator|convert|math|maths)( me)? (.*)/i, function(res) {
      var result;
      try {
        result = mathjs["eval"](res.match[3]);
        result = mathjs.format(result, {
          notation: 'fixed',
          precision: 14
        });
        result = (result * 1).toString();
        return res.send("" + result);
      } catch (error) {
        return res.send(error.message || 'Could not compute.');
      }
    });
  };

}).call(this);
