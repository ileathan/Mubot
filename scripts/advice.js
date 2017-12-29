// Description:
//   Get free advice from http://adviceslip.com/
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot what should I do about (.\*)
//   hubot what do you think about (.\*)
//   hubot how do you handle (.\*)
//   hubot I need some advice
//
// Author:
//   pengwynn
//

(function() {
  var getAdvice, randomAdvice;

  getAdvice = function(msg, query) {
    return msg.http("http://api.adviceslip.com/advice/search/" + query).get()(function(err, res, body) {
      var results;
      results = JSON.parse(body);
      if (results.message != null) {
        return randomAdvice(msg);
      } else {
        return msg.send(msg.random(results.slips).advice);
      }
    });
  };

  randomAdvice = function(msg) {
    return msg.http("http://api.adviceslip.com/advice").get()(function(err, res, body) {
      var advice, results;
      results = JSON.parse(body);
      advice = err ? "You're on your own, bud" : results.slip.advice;
      return msg.send(advice);
    });
  };

  module.exports = function(bot) {
    bot.respond(/what (do you|should I) do (when|about) (.*)/i, function(msg) {
      return getAdvice(msg, msg.match[3]);
    });
    bot.respond(/how do you handle (.*)/i, function(msg) {
      return getAdvice(msg, msg.match[1]);
    });
    bot.respond(/is (.*)\?$/i, function(msg) {
      return getAdvice(msg, msg.match[1]);
    });
    return bot.respond(/(.*) some advice about (.*)/i, function(msg) {
      return getAdvice(msg, msg.match[2]);
    });
  };

}).call(this);
