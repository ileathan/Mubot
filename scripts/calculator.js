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
//   imubot calculate|math <expression> - Calculate the given math expression.
//   imubot convert <expression> in <units> - Convert expression to given units.
//
// Author:
//   leathan
//   canadianveggie

(function() {
  const mathjs = require("mathjs");

  module.exports = bot => {
    bot.respond(/(?:calc|calculate|calculator|convert|math|maths)(?: me)? (.*)/i, res => {
      var result;
      try {
        result = mathjs.eval(res.match[1]);
        result = mathjs.format(result, { notation: 'fixed', precision: 14 });
        result = (result * 1).toString();
        res.send(result)
      } catch(e) {
        res.send(e.message || 'Could not compute.')
      }
    })
  }
}).call(this);
