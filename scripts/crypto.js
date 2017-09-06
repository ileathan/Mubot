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

  module.exports = robot => {
    var cR = {};
    robot.on('CryptoReply', function(r, mode, msg) {
      var key;
      if(key = Object.keys(r)[0]) {
        cR[key] = r[key]
      }
      if(mode === "all" && Object.keys(cR).length === 3) {
        if(msg.header != null) {
          msg.send(cR);
          return cR = {};
        } else {
          msg.send(Object.keys(cR.bids)[0] + " price is " + cR.price + ".\n" + "People are buying " + cR.bids[Object.keys(cR.bids)[0]] + " " + Object.keys(cR.bids)[0] +
              ".  (worth " + cR.bids.BTC + " BTC)\n" + "People are selling " + cR.asks[Object.keys(cR.asks)[0]] + " " + Object.keys(cR.asks)[0] + ".  (worth " + cR.asks.BTC + " BTC)");
          return cR = {};
        }
      } else if(mode === "depth" && Object.keys(cR).length === 2) {
        if(msg.header != null) {
          msg.send(cR);
          return cR = {};
        } else {
          msg.send("Total " + Object.keys(cR.asks)[0] + " being sold at that depth is " + cR.asks[Object.keys(cR.asks)[0]] + ". (worth " + cR.asks.BTC + " BTC)\n" + "Total " +
              Object.keys(cR.bids)[0] + " being bought at that depth is " + cR.bids[Object.keys(cR.bids)[0]] + ". (worth " + cR.bids.BTC + " BTC)");
          return cR = {};
        }
      } else if(mode === "swap") {
        if(msg.header != null) {
          cRs = {};
          cRs[cR.data.target] = cR.data.amount;
          msg.send({[cR.data.target]: cR.data.amount});
          return cR = {};
        } else {
          msg.send(cR.data.base_amount + " " + cR.data.base + " at current books gives you " + cR.data.amount + " " + cR.data.target + ".");
          return cR = {};
        }
      } else if(mode === "amount" && Object.keys(cR).length === 2) {
        if(msg.header != null) {
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
      if(!r.market) {
        r.market = 'p';
      }
      r.mode = "all";
      if(r.depth) {
        r.mode = "depth";
      }
      if(r.ticker2) {
        r.mode = "swap";
      }
      if(r.amount && !r.ticker2) {
        r.mode = "amount";
      }
      r.ticker = r.ticker && r.ticker.toUpperCase();
      r.ticker2 = r.ticker2 && r.ticker2 !== 'false' && r.ticker2.toUpperCase();
      r.amount = r.amount || 0;
      r.depth = r.depth;
      // If no depth is specified, use max.
      if(r.amount || !r.depth) {
        r.depth = 999999
      }
      Get(r.ticker, r.depth, r.market, msg, robot, function(orderBook) {
        var price;
        if(orderBook.error) return;
        price = parseFloat((+orderBook.asks[0][0] + +orderBook.bids[0][0]) / 2).toFixed(8);
        if(r.mode === "all") {
          robot.emit('CryptoReply', {
            price: price
          }, r.mode, msg)
        }
        Loop(orderBook, r, msg, robot)
      })
    });
    robot.respond(/(?:c|swap) (?:-(b?p?|p?b?) )?(\d+\.?\d{0,8})? ?(\w{2,5}) ?(?:for)? ?(\d{1,6}|\w{2,5})? ?(.+)?/i, function(msg) {
      var depth, ticker2;
      if(/^\d{1,6}$/.test(msg.match[4])) {
        depth = msg.match[4]
      } else {
        ticker2 = msg.match[4]
      }
      robot.emit('CryptoRequest', {
        market: msg.match[1],
        ticker: msg.match[3],
        ticker2: ticker2,
        amount: msg.match[2],
        depth: depth
      }, msg)
    })
  };

  Get = (ticker, depth, market, msg, robot, cb) => {
    var marketLink;
    if(market === "b") marketLink = "https://bittrex.com/api/v1.1/public/getorderbook?market=BTC-" + ticker + "&type=both&depth=" + depth;
    else marketLink = "https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_" + ticker + "&depth=" + depth;
    robot.http(marketLink).get()((err, resp, body) => {
      var orderBook;
      if(err) return msg.send("Error with http call.");
      if(market === "b") {
        orderBook = JSON.parse(body).result;
        if(!orderBook) return msg.send("Error, probably invalid ticker(s).");
        CompatibleBook(orderBook, orderBook => cb(orderBook))
      } else {
        orderBook = JSON.parse(body);
        if(orderBook.error) return msg.send(orderBook.error);
        cb(orderBook)
      }
    })
  };

  CompatibleBook = (orderBook, cb) => {
    var compatibleBook, compatibleKey, i, j, key;
    compatibleBook = {};
    i = 0;
    while(i < Object.keys(orderBook).length) {
      key = Object.keys(orderBook)[i];
      if(key === 'buy') {
        compatibleKey = 'bids';
      } else {
        compatibleKey = 'asks';
      }
      j = 0;
      compatibleBook[compatibleKey] = [];
      while(j < orderBook[key].length) {
        compatibleBook[compatibleKey].push([orderBook[key][j].Rate, orderBook[key][j].Quantity]);
        ++j
      }
      ++i
    }
    cb(compatibleBook)
  };

  Loop = (orderBook, r, msg, robot) => {
    var amountInBtc, c, key, keys, value, reply, totalBtc, totalTicker;
    ref = Object.keys(orderBook);
    for(let i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      if(key === 'seq' || key === 'isFrozen') continue;
      amountInBtc = totalBtc = totalTicker = 0;
      value = orderBook[key];
      for(let i = 0, len = value.length; i < len; ++i) {
        c = value[i];
        if(+totalTicker > +r.amount && r.amount !== 0) {
          break
        }
        totalTicker = parseFloat(+totalTicker + c[1]).toFixed(8);
        totalBtc = parseFloat(+totalBtc + c[0] * c[1]).toFixed(8);
        if(+totalTicker >= +r.amount && r.amount !== 0) {
          amountInBtc = parseFloat(totalBtc - (totalTicker - r.amount) * c[0]).toFixed(8);
          if(r.ticker2 && key === 'bids') {
            Get(r.ticker2, r.depth, r.market, msg, robot, function(orderBook) {
              var amountTicker2, asks, totalTicker2;
              if(orderBook.error) return;
              totalBtc = totalTicker2 = amountTicker2 = 0;
              asks = orderBook.asks;
              for(let i = 0, len = asks.length; i < len; ++i) {
                c = asks[i];
                if(+totalBtc > +amountInBtc) break;
                totalTicker2 = parseFloat(+totalTicker2 + c[1]).toFixed(8);
                totalBtc = parseFloat(+totalBtc + c[0] * c[1]).toFixed(8);
                if(+totalBtc >= +amountInBtc) {
                  robot.emit('CryptoReply', {
                    data: {
                      base: r.ticker,
                      base_amount: r.amount,
                      target: r.ticker2,
                      amount: parseFloat(totalTicker2 - ((totalBtc - amountInBtc) / c[0])).toFixed(8)
                    }
                  }, r.mode, msg)
                }
              }
            })
          }
        }
      }
      reply = {};
      reply[key] = {};
      if(r.amount && !r.ticker2) {
        reply[key][r.ticker] = r.amount;
        reply[key]['BTC'] = amountInBtc;
        robot.emit('CryptoReply', reply, r.mode, msg)
      } else if(!r.ticker2) {
        if(r.depth === 999999) {
          reply[key][r.ticker] = totalTicker;
          reply[key]['BTC'] = totalBtc;
          robot.emit('CryptoReply', reply, r.mode, msg)
        } else {
          reply[key][r.ticker] = totalTicker;
          reply[key]['BTC'] = totalBtc;
          robot.emit('CryptoReply', reply, r.mode, msg)
        }
      }
    }
  };

}).call(this);
