// Commands:
//   percent - returns information about coin percent changes
//   mc [startAt] [continueFor] - returns market cap information
//   vol [startAt] [continueFor] - returns volume information

r = require('request');
n = require('numeral');

module.exports = function (bot) {
    bot.hear (/^(vol|mc) ?(\d+)? ?(\d+)?$/, function (m) {
        r ( "https://api.coinmarketcap.com/v1/ticker", function (e, r, h)  {
            total = 0; type = ""; h = JSON.parse(h)
            if (m.match[1] == "vol") { type = "24h_volume_usd" } else { type = "market_cap_usd" }
            if (typeof m.match[2] == 'undefined' && typeof m.match[3] == 'undefined') { startAt = 1; finishAt = h.length }
            else if (typeof m.match[3] == 'undefined') { startAt = m.match[2]; finishAt = h.length }
            else { startAt = m.match[2]; finishAt = +m.match[3] + +m.match[2] }
            for (i=startAt-1; i<finishAt; i++) total += +h[i][type]
            if (m.match[1] == "vol") { type = "volume" } else { type = "market cap" }
            var total = n(total).format('(0.00a)').toUpperCase();
            if (typeof m.match[2] == 'undefined' && typeof m.match[3] == 'undefined') { m.send("Total " + type + " is " + total + ".") }
            else if (typeof m.match[3] == 'undefined') m.send("Total " + type + " starting at rank " + m.match[2]  + " is " + total + ".")
            else m.send("Total " + type + " starting at rank " + m.match[2] + " up through rank " + (+m.match[3] + +m.match[2]) + " is " + total + ".")
        })
    })
    bot.hear (/^(per|percent)$/, function (m) {
        p = {}; p.nv1 = p.nv2 = p.nv3 = p.v1 = p.v2 = p.v3 = 0; 
        r("https://api.coinmarketcap.com/v1/ticker", function (e,r,h) { 
            h = JSON.parse(h);
            for (i=0; i<h.length; i++) { 
                if (+h[i].market_cap_usd < 1000000 || +h[i]["24h_volume_usd"] < 1000) break
                if (+h[i].percent_change_1h > p.v1) { 
                    p.v1 = +h[i].percent_change_1h;
                    p.v1m = h[i].symbol + " has the highest 1h change of " + h[i].percent_change_1h + "%."
                } 
                if (+h[i].percent_change_24h > p.v2) { 
                    p.v2 = +h[i].percent_change_24h;
                    p.v2m = h[i].symbol + " has the highest 24h change of " + h[i].percent_change_24h + "%."
                } 
                if (+h[i].percent_change_7d > p.v3) {
                    p.v3 = +h[i].percent_change_7d; 
                    p.v3m = h[i].symbol + " has the highest 7d change of " + h[i].percent_change_7d + "%."
                } 
                if (+h[i].percent_change_1h < p.nv1) { 
                    p.nv1 = +h[i].percent_change_1h; 
                    p.nv1m = h[i].symbol + " has the lowest 1h change of " + h[i].percent_change_1h  + "%."
                }
                if (+h[i].percent_change_24h < p.nv2) { 
                    p.nv2 = +h[i].percent_change_24h;
                    p.nv2m = h[i].symbol + " has the lowest 24h change of " + h[i].percent_change_24h  + "%."
                }
                if (+h[i].percent_change_7d < p.nv3) { 
                    p.nv3 = +h[i].percent_change_7d; 
                    p.nv3m = h[i].symbol + " has the lowest 7d change of " + h[i].percent_change_7d  + "%."
                }
            } 
            m.send(p.v1m + "\n" + p.v2m + "\n" + p.v3m + "\n" + p.nv1m + "\n" + p.nv2m + "\n" + p.nv3m) 
        })
    })
}
