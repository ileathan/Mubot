// Description:
//   Returns information about crypto coins
//
// Commands:
//   Mubot compare <coin1> <coin2> - returns price/change of coin2 relative to coin1
//   Mubot stats <coin> - returns information about coin
//   Mubot price <coin> - returns the strike price of coin
//
// Author:
//   leathan

(function() {
  const api_endpoint = "https://api.coinmarketcap.com/v1/ticker?limit=0";
  module.exports = bot => {
    bot.respond(/stats (\w+)$/i, res => {
      bot.http(api_endpoint, (err, res2, body) => {
        body = JSON.parse(body.replace(/\n/g, ''))
        for(let i = 0, l = body.length; i < l; ++i) {
          if(body[i].symbol === res.match[1].toUpperCase()) {
            return res.send(JSON.stringify(body[i], null, 2).slice(1,-1))
          }
        }
        res.send(res.match[1] + " is not listed.")
      })
    });
    bot.respond(/price (\w+)$/i, res => {
      bot.http(api_endpoint, (err, res2, body) => {
        body = JSON.parse(body.replace(/\n/g, ''))
        for(let i = 0, l = body.length; i < l; ++i) {
          if(body[i].symbol === res.match[1].toUpperCase()) {
            return res.send(res.match[1] + " strike price is " + body[i].price_usd + "$.")
          }
        }
        res.send(res.match[1] + " is not listed.")
      })
    });
    bot.respond(/compare (\w+) (\w+)$/i, res => {
      bot.http("https://api.cryptonator.com/api/ticker/" + res.match[1] + "-" + res.match[2], (err, response, body) => {
        body = JSON.parse(body);
        if(!body.ticker) return res.send("Error comparing those two via cryptonator's API.");
        res.send("One " + body.ticker.base + " gives you " + body.ticker.price + " " + body.ticker.target + ". [24h Change: " + body.ticker.change + "%]")
      })
    })
  }
}).call(this);
