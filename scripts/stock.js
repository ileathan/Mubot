// Description:
//   Get a stock price
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot stock [info|quote|price] [for|me] <ticker> [1d|5d|2w|1mon|1y] - Get a stock price
//
// Author:
//   eliperkins
//   maddox
//   johnwyles

(function() {
  module.exports = function(robot) {
    return robot.respond(/stock (?:info|price|quote)?\s?(?:for|me)?\s?@?([A-Za-z0-9.-_]+)\s?(\d+\w+)?/i, function(msg) {
      var ticker, time;
      ticker = escape(msg.match[1]);
      time = msg.match[2] || '1d';
      return msg.http('http://finance.google.com/finance/info?client=ig&q=' + ticker).get()(function(err, res, body) {
        var result;
        result = JSON.parse(body.replace(/\/\/ /, ''));
        return msg.send(result[0].l_cur + ("(" + result[0].c + ")"));
      });
    });
  };

}).call(this);
