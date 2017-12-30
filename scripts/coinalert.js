// Description:
//   Coin alerts.
//
// Commands:
//   imubot start|stop scanner alert - manually start/stops the scanners useful for custom delays.
//   imubot alert me <coin> <condition> <price> - creates an alert, you may create as many as you'd like.
// . imubot alerts [raw] - display the current alerts.
(function(){
  const http = require("request");
  const delay = 120000; // 2 mins.
  var allRequests = [];
  var interval;
  module.exports = bot => {
    bot.respond(/stop scanner(?:s| alerts)/i, res => {
      res.send("Stopping alert scanner.")
    })
    bot.respond(/start scanner(?:s| alerts) ?(\d+)?/i, res => {
      if(allRequests.length)
        return res.send("No alerts created.")
      ;
      var time = res.match[1] || 120;
      res.send("Starting alert scanner every " + time + " seconds.")
      delay = parseInt(time * 1000);
      startInterval();
    })
    bot.respond(/alert (?:me )?(.*)/i, res => {
      var request = res.match[1];
      if(/me /i.test(request))
        return res.send("Specify a price.")
      ;
      allRequests.push(new Request(res, request))
      interval || startInterval(); // Every 2 mins.
      res.send("Alert(s) created.")
    })
    bot.respond(/alerts$/i, res => {
      res.send("There are " + allRequests.length + " alerts.")
    })
    bot.respond(/alerts raw$/i, res => {
      // Structure is recurssive, so map it first.
      res.send(allRequests.map(req => req.res.message.user.name + ": " + req.alerts.join(', ')).join(', '))
    })
  }
  function alertMe(coinsObj) {
    // store allRequests that arnt undef.
    var result = [], resIndex = 0;
    for(let i = 0, l = allRequests.length; i < l; ++i) {
      if(allRequests[i].alerts.length === 0)
        continue
      ;
      result.push(allRequest[i]);
      let areTrue = allRequests[i].areTrue(coinsObj);
      if(areTrue.length > 0) allRequests[i].res.reply("Alert(s) triggered -> [" + areTrue.join("][ ") + "].")
    }
    allRequests = result;
  }
  function startInterval() {
    clearInterval(interval);
    interval = setInterval(()=> {
      if(allRequests.length === 0) {
        return clearInterval(interval);
      }
      // API Endpoint, comment out to switch.
      http('https://api.coinmarketcap.com/v1/ticker?limit=0', (err, res, body) => {
        const coinsObj = {};
        const coinsArray = JSON.parse(body);
        for(let coin of coinsArray) {
          coinsObj[coin.symbol] = coin;
        }
        alertMe(coinsObj);
      });
      // old API endpoint. (Poloniex).
      //http('https://poloniex.com/public?command=returnTicker', (err, ress, body) => alertMe(delay, JSON.parse(body)) )
    }, delay);
  }

  function Request(res, alerts) {
    this.alerts = alerts.split(/,\s*/);
    this.res = res
  }
  Request.prototype.compact = function() {
    var index = 0, result = [];
    for(let value of this.alerts) if(value) result[index++] = value;
    this.alerts = result;
  }
  Request.prototype.areTrue = function(compareObj) {
    const results = [];
    var type = 'price_';
    for(let i = 0, l = this.alerts.length; i < l; ++i) {
      let [match, coin, condition, price] = this.alerts[i].match(/([^ ]*) (<|>) ([^ ]*)/);
      coin = coin.toUpperCase();
      coin === 'BTC' ?
        type += 'usd'
      :
        type += price.slice(-1) === '$' ? 'usd' : 'btc'
      ;
      if(condition === '>') {
        if(parseFloat(compareObj[coin][type]) > parseFloat(price)) {
          results.push(match);
          delete this.alerts[i];
        }
      }
      if(condition === '<') {
        if(parseFloat(compareObj[coin][type]) < parseFloat(price)) {
          results.push(match);
          delete this.alerts[i];
        }
      }
    }
    this.compact();
    return results;
  }
}).call(this);
