// Description:
//   Returns the URL of the first bing hit for a query
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   mubot bing me <query> - Queries Bing and returns first link
//
// Author:
//   leathan

(function() {
  module.exports = bot => {
    bot.respond(/bing(?: me)? (.*)/i, msg => {
      bingMe(msg, msg.match[1])
    })
  };
  function bingMe(msg, query) {
    msg.http('http://www.bing.com/search').query({
      q: query
    }).get()((err, res, body) => {
      msg.send((body = body.match(/<li class="b_algo"><h2><a href="([^"]*)"/)) ? body[1] : "Sorry, Bing had zero results for '" + query + "'")
    })
  }
}).call(this);
