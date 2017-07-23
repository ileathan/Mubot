// Description:
//   Coin alerts.
//
request = require('request');
var quit = false;
var allRequests = [];
module.exports = bot => {
  bot.respond(/stop scanner(?:s| alerts)/i, res => {
    res.send("Stopping alert scanner.")
    quit = true;
  })
  bot.respond(/start scanner(?:s| alerts) ?(\d+)?/i, res => {
    if(quit) return;
    time = res.match[1] || 60
    res.send("Starting alert scanner every " + time + " seconds.")
    alertMe(parseFloat(time * 1000))
  })
  bot.respond(/alert (?:me )?(.*)/i, res => {
    if(res.match[1].toLowerCase() === 'me') return res.send("Specify a price.")
    allRequests.push((new Request(res, res.match[1])))
    alertMe(30000); quit = false;
    res.send("Alert(s) created.")
  })
}
alertMe = (delay, coinObj) => {
  if(quit) { quit = false; return; }
  if(coinObj) {
    for(let i=0; i<allRequests.length; i++) {
      if(allRequests[i].alerts.length == 0) { allRequests.splice(i, 1); continue }
      var areTrue = allRequests[i].areTrue(coinObj);
      if(areTrue.length > 0) allRequests[i].res.reply("Alert(s) triggered -> [" + areTrue.join("][ ") + "].")
    }
  }
  scanTimer = setTimeout(()=> {
    if(allRequests.length < 1) { clearInterval(scanTimer); quit = true }
    r('https://poloniex.com/public?command=returnTicker', (e,r,b) => alertMe(delay, JSON.parse(b)) )
  }, delay)
}
function Request(res, alerts) {
  this.alerts = alerts.split(/,\s*/)
  this.res = res
}
Request.prototype.compact = function() {
  var index = 0
  const result = []
  for (let value of this.alerts) if (value) result[index++] = value
  this.alerts = result
}
Request.prototype.areTrue = function(compareObj) {
  var results = [];
  for(let i=0; i<this.alerts.length; i++) {
    let [match, coin, condition, price] = this.alerts[i].match(/([^ ]*) (<|>) ([^ ]*)/)
    if(condition === '>') {
      if(parseFloat(compareObj['BTC_'+coin.toUpperCase()].last) > parseFloat(price)) {
        results.push(match)
        delete this.alerts[i]
      }
    }
    if(condition === '<') {
      if(parseFloat(compareObj['BTC_'+coin.toUpperCase()].last) < parseFloat(price)) {
        results.push(match)
        delete this.alerts[i]
      }
    }
  }
  this.compact()
  return results;
}
