// Description:
//   Coin alerts.
//
// Commands:
//   Mubot start|stop scanner alert - manually start/stops the scanners useful for custom delays.
//   Mubot alert me <coin> <condition> <price> - creates an alert, you may create as many as you'd like.
// . Mubot alerts [raw] - display the current alerts.
;(function(){
  const http = require("request");
  const l = {};

  l.delay = 120000 // 2 mins
  ;
  l.coinsObj = {}
  ;
  l.coinsArray = []
  ;
  l.allRequests = []
  ;
  l.imports = {http}
  ;
  l.exports = bot => {
    l.start();
    bot.respond(/stop scanner(?:s| alerts)/i, l.stop);
    bot.respond(/alert (?:me )?(.*)/i, l.create); 
    bot.respond(/start scanner(?:s| alerts) ?(\d+)?/i, l.start);
    bot.respond(/alerts$/i, l.length);
    bot.respond(/alerts view/i, l.view);
    bot.mubot.coinalert = l;
  }
  ;
  Object.defineProperties(l, {
    imports: {enumerable: false},
    exports: {enumerable: false}
  })
  ;
  l.stop = (res = {send: _=>_}) => {
    res.send("Stopping alert scanner.");
    clearInterval(l.interval);
    delete a.interval;
  }
  ;
  l.start = (res = {send: _=>_}) => {
    if(!l.allRequests.length)
      return res.send("No alerts created.")
    ;
    if(l.interval)
      return res.send("Already started.")
    ;
    let time = (res.match||"")[1] || 240;
    l.delay = parseInt(time * 1000);
    return res.send("Starting alert scanner every " + time + " seconds.")

    l.interval = setInterval(()=>l.makeCoins(l.check), l.delay)
  }
  l.create = res => {
    var request = res.match[1];
    if(/me /i.test(request))
      return res.send("Specify a price.")
    ;
    l.allRequests.push(new l.Request(res, request))
    l.interval || l.start(); // Every 2 mins.
    res.send("Alert(s) created.")
  }
  l.length = res => {
    res.send("There are " + l.allRequests.length + " alerts.")
  }
  ;
  l.view = (res = {send: _=>_}) => {
    return res.send(l.allRequests.map(req => req.res.message.user.name + ": " + req.alerts.join(', ')).join(', '))
  }
  l.check = coinsObj => {
    // store allRequests that arnt undef.
    var results = [], resIndex = 0;
    for(let i = 0, len = l.allRequests.length; i < len; ++i) {
      if(l.allRequests[i].alerts.length === 0)
        continue
      ;
      results.push(l.allRequest[i]);
      let areTrue = l.allRequests[i].areTrue(l.coinsObj);
      if(areTrue.length > 0) l.allRequests[i].res.reply("Alert(s) triggered -> [" + areTrue.join("][ ") + "].")
    }
    l.allRequests = results;
  }
  l.makeCoins = (callback = _=>_) => {
    if(allRequests.length === 0) {
      return clearInterval(l.interval);
    }
    // API Endpoint, comment out to switch.
    http('https://api.coinmarketcap.com/v1/ticker?limit=0', (err, res, body) => {
      l.coinsArray = JSON.parse(body);
      for(let coin of l.coinsArray) {
        l.coinsObj[coin.symbol] = coin;
      }
      callback(l.coinsObj);
    })
  }
  ;
  l.Request = function(res, alerts) {
    this.alerts = alerts.split(/,\s*/);
    this.res = res
  }
  l.Request.prototype.compact = function() {
    let index = 0, result = [];
    for(let value of this.alerts) if(value) result[index++] = value;
    this.alerts = result;
  }
  l.Request.prototype.areTrue = function(coinsObj) {
    let results = [], type = 'price_';
    for(let i = 0, l = this.alerts.length; i < l; ++i) {
      let [match, coin, condition, price] = this.alerts[i].match(/([^ ]*) (<|>) ([^ ]*)/);
      coin = coin.toUpperCase() === 'BTC' ?
        type += 'usd'
      :
        type += price.slice(-1) === '$' ? 'usd' : 'btc'
      ;
      if(condition === '>') {
        if(parseFloat(l.coinsObj[coin][type]) > parseFloat(price)) {
          results.push(match);
          delete this.alerts[i];
        }
      }
      if(condition === '<') {
        if(parseFloat(l.coinsObj[coin][type]) < parseFloat(price)) {
          results.push(match);
          delete this.alerts[i];
        }
      }
    }
    this.compact();
    return results;
  }

  module.exports = l.exports;
}).call(this);
