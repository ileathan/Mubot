// Commands:
//   percent [startAt] [endAt] - returns information about coin percent changes
//   mc [startAt] [endAt] - returns market cap information
//   vol [startAt] [endAt] - returns volume information
//
(function(){
  const API_URL = "https://api.coinmarketcap.com/v1/ticker?limit=0"
  const request = require('request');
  const numeral = require('numeral');
  module.exports = bot => {
    bot.hear(/^(vol|mc)(?: (i|!i|ignore))?(?: (\d+))?(?:(?: |-| - )(\d+))?$/, res => {
      var [, type, ignore, startAt, endAt] = res.match;
      request(API_URL, function (err, req, data)  {
        var total = 0;
        data = JSON.parse(data);
        startAt = startAt ? (startAt -= 1): 0;
        endAt = endAt ? endAt : data.length;
        if(startAt > data.length || endAt > data.length || startAt > endAt || startAt === -1)
          return res.send("Your startAt and endAt parameters are invalid!")
        ;
        ignore ? data.splice(startAt, endAt) : data = data.slice(startAt, endAt);
        type = type === "vol" ? "24h_volume_usd" : "market_cap_usd";
        for(let i = 0, l = data.length; i < l; ++i)
          total += +data[i][type]
        ;
        type = type === "24h_volume_usd" ? "volume" : "market cap";
        total = numeral(total).format('(0.00a)').toUpperCase();
        res.send((ignore ? "Ignoreing ranks " : "Including ranks ") + (++startAt || 0) + " - " + (endAt || data.length) + "\n" + "Total " + type + " is " + total + ".")
      })
    });
    bot.hear(/^(?:per|percent)(?: (!i|i|ignore))?(?: (\d+))?(?:(?: |-| - )(\d+))?$/, res => {
      request(API_URL, (err, req, data) => {
        // p represents the lowest and heighest percent changes.
        var p = {};
        // lv are the lowest, hv are the highest.
        p.lv1h = p.lv24h = p.lv7d = 0;
        p.hv1h = p.hv24h = p.hv7d = 0;
        data = JSON.parse(data);
        var [, ignore, startAt, endAt] = res.match;
        startAt = startAt ? (startAt -= 1) : 0;
        endAt = endAt ? endAt : data.length;
        if(endAt > data.length || startAt > data.length || startAt > endAt || startAt === -1) {
          return res.send("Your startAt and endAt parameters are invalid!")
        }
        ignore ? data.splice(startAt, endAt) : data = data.slice(startAt, endAt);
        res.send((ignore ? "Ignoreing ranks " : "Including ranks ") + (++startAt || 0) + " - " + (endAt || data.length))
        for(let i = 0, l = data.length; i < l; ++i) {
          if(+data[i].market_cap_usd < 1000000 || +data[i]["24h_volume_usd"] < 1000) break
          if(+data[i].percent_change_1h > p.hv1h || !p.hv1h) {
            p.hv1h = +data[i].percent_change_1h;
            p.hv1hMsg = data[i].symbol + " has the highest 1h change of " + data[i].percent_change_1h + "%."
          }
          if(+data[i].percent_change_24h > p.hv24h || !p.hv24h) {
            p.hv24h = +data[i].percent_change_24h;
            p.hv24hMsg = data[i].symbol + " has the highest 24h change of " + data[i].percent_change_24h + "%."
          }
          if(+data[i].percent_change_7d > p.hv7d || !p.hv7d) {
            p.hv7d = +data[i].percent_change_7d;
            p.hv7dMsg = data[i].symbol + " has the highest 7d change of " + data[i].percent_change_7d + "%."
          }
          if(+data[i].percent_change_1h < p.lv1h || !p.lv1h) {
            p.lv1h = +data[i].percent_change_1h;
            p.lv1hMsg = data[i].symbol + " has the lowest 1h change of " + data[i].percent_change_1h  + "%."
          }
          if(+data[i].percent_change_24h < p.lv24h || !p.lv24h) {
            p.lv24h = +data[i].percent_change_24h;
            p.lv24hMsg = data[i].symbol + " has the lowest 24h change of " + data[i].percent_change_24h  + "%."
          }
          if(+data[i].percent_change_7d < p.lv7d || !p.lv7d) {
            p.lv7d = +data[i].percent_change_7d;
            p.lv7dMsg = data[i].symbol + " has the lowest 7d change of " + data[i].percent_change_7d  + "%."
          }
        }
        res.send(p.hv1hMsg + "\n" + p.hv24hMsg + "\n" + p.hv7dMsg + "\n" + p.lv1hMsg + "\n" + p.lv24hMsg + "\n" + p.lv7dMsg)
      })
    })
  }
}).call(this);
