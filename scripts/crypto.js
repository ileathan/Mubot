// Description:
//   Cryptographic currency information
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   swap|crypto|c [amount] <coin> [coin2] [depth] a coin - Returns information about the coin(s).
//
// Author:
//   leathan

(function() {
  var CompatibleBook, Get, Loop;

  module.exports = function(robot) {
    var cR;
    cR = {};
    robot.on('CryptoReply', function(r, mode, msg) {
      var cRs, key;
      key = Object.keys(r)[0];
      if (r[key]) {
        cR[key] = r[key];
      }
      if (mode === "all" && Object.keys(cR).length === 3) {
        if (msg.header != null) {
          msg.send(cR);
          return cR = {};
        } else {
          msg.send(Object.keys(cR.bids)[0] + " price is " + cR.price + ".\n" + "People are buying " + cR.bids[Object.keys(cR.bids)[0]] + " " + Object.keys(cR.bids)[0] + ".  (worth " + cR.bids.BTC + " BTC)\n" + "People are selling " + cR.asks[Object.keys(cR.asks)[0]] + " " + Object.keys(cR.asks)[0] + ".  (worth " + cR.asks.BTC + " BTC)");
          return cR = {};
        }
      } else if (mode === "depth" && Object.keys(cR).length === 2) {
        if (msg.header != null) {
          msg.send(cR);
          return cR = {};
        } else {
          msg.send("Total " + Object.keys(cR.asks)[0] + " being sold at that depth is " + cR.asks[Object.keys(cR.asks)[0]] + ". (worth " + cR.asks.BTC + " BTC)\n" + "Total " + Object.keys(cR.bids)[0] + " being bought at that depth is " + cR.bids[Object.keys(cR.bids)[0]] + ". (worth " + cR.bids.BTC + " BTC)");
          return cR = {};
        }
      } else if (mode === "swap") {
        if (msg.header != null) {
          cRs = {};
          cRs[cR.data.target] = cR.data.amount;
          msg.send(cRs);
          return cR = {};
        } else {
          msg.send(cR.data.base_amount + " " + cR.data.base + " at current books gives you " + cR.data.amount + " " + cR.data.target + ".");
          return cR = {};
        }
      } else if (mode === "amount" && Object.keys(cR).length === 2) {
        if (msg.header != null) {
          msg.send(cR);
          return cR = {};
        } else {
          msg.send("Buying " + cR.asks[Object.keys(cR.asks)[0]] + " " + Object.keys(cR.asks)[0] + " at current books gives you " + cR.asks.BTC + " BTC.\n" + "Selling " + cR.bids[Object.keys(cR.bids)[0]] + " " + Object.keys(cR.bids)[0] + " at current books gives you " + cR.bids.BTC + " BTC.");
          return cR = {};
        }
      }
    });
    robot.on('CryptoRequest', function(r, msg) {
      var ref;
      if (r.market === "" || !r.market) {
        r.market = 'p';
      }
      r.mode = "all";
      if (r.depth) {
        r.mode = "depth";
      }
      if (r.ticker2) {
        r.mode = "swap";
      }
      if (r.amount && !r.ticker2) {
        r.mode = "amount";
      }
      r.ticker = (ref = r.ticker) != null ? ref.toUpperCase() : void 0;
      r.ticker2 = r.ticker2 && r.ticker2 !== 'false' ? r.ticker2.toUpperCase() : false;
      r.amount = r.amount ? r.amount : 0;
      r.depth = r.depth;
      if (r.amount || !r.depth) {
        r.depth = 999999;
      }
      return Get(r.ticker, r.depth, r.market, msg, robot, function(orderBook) {
        var price;
        if (orderBook.error) {
          return;
        }
        price = parseFloat((+orderBook.asks[0][0] + +orderBook.bids[0][0]) / 2).toFixed(8);
        if (r.mode === "all") {
          robot.emit('CryptoReply', {
            price: price
          }, r.mode, msg);
        }
        return Loop(orderBook, r, msg, robot);
      });
    });
    return robot.respond(/(?:c|crypto|swap) (?:-(b?p?|p?b?) )?(\d+\.?\d{0,8})? ?(\w{2,5}) ?(?:for)? ?(\d{1,6}|\w{2,5})? ?(.+)?/i, function(msg) {
  console.log(1)
      var depth, ticker2;
      if (/^\d{1,6}$/.test(msg.match[4])) {
        depth = msg.match[4];
      }
      if (!/^\d{1,6}$/.test(msg.match[4])) {
        ticker2 = msg.match[4];
      }
      return robot.emit('CryptoRequest', {
        market: msg.match[1],
        ticker: msg.match[3],
        ticker2: ticker2,
        amount: msg.match[2],
        depth: depth
      }, msg);
    });
  };

  Get = function(ticker, depth, market, msg, robot, cb) {
    var marketLink;
    if (market === "b") {
      marketLink = "https://bittrex.com/api/v1.1/public/getorderbook?market=BTC-" + ticker + "&type=both&depth=" + depth;
    }
    if (market === "p") {
      marketLink = "https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_" + ticker + "&depth=" + depth;
    }
    return robot.http(marketLink).get()(function(err, resp, body) {
      var orderBook;
      if (err) {
        msg.send(err);
      }
      if (market === "b") {
        orderBook = JSON.parse(body).result;
        if (orderBook === null) {
          msg.send("Error, probably invalid ticker(s).");
          return;
        }
        return CompatibleBook(orderBook, function(orderBook) {
          return cb(orderBook);
        });
      } else {
        orderBook = JSON.parse(body);
        if (orderBook.error) {
          msg.send(orderBook.error);
          return;
        }
        return cb(orderBook);
      }
    });
  };

  CompatibleBook = function(orderBook, cb) {
    var compatibleBook, compatibleKey, i, j, key;
    compatibleBook = {};
    i = 0;
    while (i < Object.keys(orderBook).length) {
      key = Object.keys(orderBook)[i];
      if (key === 'buy') {
        compatibleKey = 'bids';
      } else {
        compatibleKey = 'asks';
      }
      j = 0;
      compatibleBook[compatibleKey] = [];
      while (j < orderBook[key].length) {
        compatibleBook[compatibleKey].push([orderBook[key][j].Rate, orderBook[key][j].Quantity]);
        j++;
      }
      i++;
    }
    return cb(compatibleBook);
  };

  Loop = function(orderBook, r, msg, robot) {
    var amountInBtc, c, k, key, l, len, len1, ref, ref1, reply, results, totalBtc, totalTicker;
    ref = Object.keys(orderBook);
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      key = ref[k];
      if (!(key !== 'seq' && key !== 'isFrozen')) {
        continue;
      }
      amountInBtc = 0;
      totalBtc = 0;
      totalTicker = 0;
      ref1 = orderBook[key];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        c = ref1[l];
        if (+totalTicker > +r.amount && r.amount !== 0) {
          break;
        }
        totalTicker = parseFloat(+totalTicker + c[1]).toFixed(8);
        totalBtc = parseFloat(+totalBtc + c[0] * c[1]).toFixed(8);
        if (+totalTicker >= +r.amount && r.amount !== 0) {
          amountInBtc = parseFloat(totalBtc - (totalTicker - r.amount) * c[0]).toFixed(8);
          if (r.ticker2 && key === 'bids') {
            Get(r.ticker2, r.depth, r.market, msg, robot, function(orderBook) {
              var amountTicker2, len2, m, ref2, results1, totalTicker2;
              if (orderBook.error) {
                return;
              }
              totalBtc = 0;
              totalTicker2 = 0;
              amountTicker2 = 0;
              ref2 = orderBook.asks;
              results1 = [];
              for (m = 0, len2 = ref2.length; m < len2; m++) {
                c = ref2[m];
                if (+totalBtc > +amountInBtc) {
                  break;
                }
                totalTicker2 = parseFloat(+totalTicker2 + c[1]).toFixed(8);
                totalBtc = parseFloat(+totalBtc + c[0] * c[1]).toFixed(8);
                if (+totalBtc >= +amountInBtc) {
                  results1.push(robot.emit('CryptoReply', {
                    data: {
                      base: r.ticker,
                      base_amount: r.amount,
                      target: r.ticker2,
                      amount: parseFloat(totalTicker2 - ((totalBtc - amountInBtc) / c[0])).toFixed(8)
                    }
                  }, r.mode, msg));
                } else {
                  results1.push(void 0);
                }
              }
              return results1;
            });
          }
        }
      }
      if (r.amount && !r.ticker2) {
        reply = {};
        reply[key] = {};
        reply[key][r.ticker] = r.amount;
        reply[key]['BTC'] = amountInBtc;
        results.push(robot.emit('CryptoReply', reply, r.mode, msg));
      } else if (!r.ticker2) {
        if (r.depth === 999999) {
          reply = {};
          reply[key] = {};
          reply[key][r.ticker] = totalTicker;
          reply[key]['BTC'] = totalBtc;
          results.push(robot.emit('CryptoReply', reply, r.mode, msg));
        } else {
          reply = {};
          reply[key] = {};
          reply[key][r.ticker] = totalTicker;
          reply[key]['BTC'] = totalBtc;
          results.push(robot.emit('CryptoReply', reply, r.mode, msg));
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

}).call(this);
