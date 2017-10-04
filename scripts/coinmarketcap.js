// Commands:
//   percent - returns information about coin percent changes
//   mc [startAt] [continueFor] - returns market cap information
//   vol [startAt] [continueFor] - returns volume information
//
(function(){
  const request = require('request');
  const numeral = require('numeral');
  module.exports = bot => {
    bot.hear(/^(vol|mc) ?(\d+)? ?(\d+)?$/, res => {
      request("https://api.coinmarketcap.com/v1/ticker", function (err, req, data)  {
        var startAt, finishAt;
        var total = 0;
        data = JSON.parse(data);
        var type = res.match[1] === "vol" ? "24h_volume_usd" : "market_cap_usd";
        if(typeof res.match[2] === 'undefined') {
          startAt = 1;
          finishAt = data.length
        }
        else if(typeof res.match[3] === 'undefined') {
          startAt = res.match[2];
          finishAt = data.length
        } else {
          startAt = res.match[2];
          finishAt = +res.match[3] + +res.match[2]
        }
        for(let i = startAt-1; i < finishAt; ++i) total += +data[i][type];
        type = res.match[1] === "vol" ? "volume" : "market cap";
        total = numeral(total).format('(0.00a)').toUpperCase();
        if(typeof res.match[2] === 'undefined')
          res.send("Total " + type + " is " + total + ".");
        else if(typeof res.match[3] === 'undefined')
          res.send("Total " + type + " starting at rank " + res.match[2]  + " is " + total + ".");
        else
          res.send("Total " + type + " starting at rank " + res.match[2] + " up through rank " + (+res.match[3] + +res.match[2]) + " is " + total + ".")
      })
    });
    bot.hear(/^(per|percent)$/, res => {
      request("https://api.coinmarketcap.com/v1/ticker", (err, req, data) => {
        // p represents the lowest and heighest percent changes.
        var p = {};
        // lv are the lowest, hv are the highest.
        p.lv1h = p.lv24h = p.lv7d = 0;
        p.hv1h = p.hv24h = p.hv7d = 0;
        data = JSON.parse(data);
        for(let i = 0, l = data.length; i < l; ++i) {
          if(+data[i].market_cap_usd < 1000000 || +data[i]["24h_volume_usd"] < 1000) break
          if(+data[i].percent_change_1h > p.hv1h) {
            p.hv1h = +data[i].percent_change_1h;
            p.hv1hMsg = data[i].symbol + " has the highest 1h change of " + data[i].percent_change_1h + "%."
          }
          if(+data[i].percent_change_24h > p.hv24h) {
            p.hv24h = +data[i].percent_change_24h;
            p.hv24hMsg = data[i].symbol + " has the highest 24h change of " + data[i].percent_change_24h + "%."
          }
          if(+data[i].percent_change_7d > p.hv7d) {
            p.hv7d = +data[i].percent_change_7d;
            p.hv7dMsg = data[i].symbol + " has the highest 7d change of " + data[i].percent_change_7d + "%."
          }
          if(+data[i].percent_change_1h < p.lv1h) {
            p.lv1h = +data[i].percent_change_1h;
            p.lv1hMsg = data[i].symbol + " has the lowest 1h change of " + data[i].percent_change_1h  + "%."
          }
          if(+data[i].percent_change_24h < p.lv24h) {
            p.lv24h = +data[i].percent_change_24h;
            p.lv24hMsg = data[i].symbol + " has the lowest 24h change of " + data[i].percent_change_24h  + "%."
          }
          if(+data[i].percent_change_7d < p.lv7d) {
            p.lv7d = +data[i].percent_change_7d;
            p.lv7dMsg = data[i].symbol + " has the lowest 7d change of " + data[i].percent_change_7d  + "%."
          }
        }
        res.send(p.hv1hMsg + "\n" + p.hv24hMsg + "\n" + p.hv7dMsg + "\n" + p.lv1hMsg + "\n" + p.lv24hMsg + "\n" + p.lv7dMsg)
      })
    })
  }
}).call(this);
