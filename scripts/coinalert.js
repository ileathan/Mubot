// Description:
//   Coin alerts.
//
// Commands:
//   hubot start|stop scanner alert - manually start/stops the scanners useful for custom delays.
//   hubot alert me <coin> <condition> <price> - creates an alert, you may create as many as you'd like.

(function(){
  const request = require('request');
  var quit = false, allRequests = [];
  module.exports = bot => {
    bot.respond(/stop scanner(?:s| alerts)/i, res => {
      res.send("Stopping alert scanner.")
      quit = true;
    })
    bot.respond(/start scanner(?:s| alerts) ?(\d+)?/i, res => {
      var time;
      if(quit) return;
      time = res.match[1] || 60
      res.send("Starting alert scanner every " + time + " seconds.")
      alertMe(parseFloat(time * 1000))
    })
    bot.respond(/alert (?:me )?(.*)/i, res => {
      if(res.match[1].toLowerCase() === 'me') return res.send("Specify a price.")
      allRequests.push(new Request(res, res.match[1]))
      alertMe(30000);
      quit = false;
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
  function alertMe(delay, coinObj) {
    var scanTimer;
    if(quit) return quit = false;
    if(coinObj) {
      for(let i = 0, l = allRequests.length; i < l; ++i) {
        if(allRequests[i].alerts.length === 0) {
          allRequests.splice(i, 1);
          continue
        }
        let areTrue = allRequests[i].areTrue(coinObj);
        if(areTrue.length > 0) allRequests[i].res.reply("Alert(s) triggered -> [" + areTrue.join("][ ") + "].")
      }
    }
    scanTimer = setTimeout(()=> {
      if(allRequests.length < 1) {
        clearInterval(scanTimer);
        quit = true
      }
      request('https://poloniex.com/public?command=returnTicker', (err, ress, body) => alertMe(delay, JSON.parse(body)) )
    }, delay)
  }
  function Request(res, alerts) {
    this.alerts = alerts.split(/,\s*/);
    this.res = res
  }
  Request.prototype.compact = function() {
    var index = 0, result = [];
    for(let value of this.alerts) if(value) result[index++] = value;
    this.alerts = result
  }
  Request.prototype.areTrue = function(compareObj) {
    var results = [];
    for(let i = 0, l = this.alerts.length; i < l; ++i) {
      let [match, coin, condition, price] = this.alerts[i].match(/([^ ]*) (<|>) ([^ ]*)/);
      if(condition === '>') {
        if(parseFloat(compareObj['BTC_'+coin.toUpperCase()].last) > parseFloat(price)) {
          results.push(match);
          delete this.alerts[i]
        }
      }
      if(condition === '<') {
        if(parseFloat(compareObj['BTC_'+coin.toUpperCase()].last) < parseFloat(price)) {
          results.push(match);
          delete this.alerts[i]
        }
      }
    }
    this.compact();
    return results
  }
}).call(this);
