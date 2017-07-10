# Description:
#   Cryptographic currency information
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   swap|crypto|c [amount] <coin> [coin2] [depth] a coin - Returns information about the coin(s).
#   
# Author:
#   leathan

module.exports = (robot) ->

  robot.on "test", (msg) ->
    msg.send "Hi"

  cR = {}
  # This was to address a bug due to how reload.coffee was reloading scripts, I fixed it there directly.
  #if typeof robot.events._events.CryptoReply is 'undefined'
  robot.on 'CryptoReply', (r, mode, msg) ->
    key = Object.keys(r)[0]
    cR[key] = r[key] if r[key]
    if mode is "all" and Object.keys(cR).length == 3
      if msg.header?
        msg.send cR; cR = {}
      else
        msg.send Object.keys(cR.bids)[0] + " price is " + cR.price + ".\n" +
        "People are buying " + cR.bids[Object.keys(cR.bids)[0]] +  " " + Object.keys(cR.bids)[0] + ".  (worth " + cR.bids.BTC + " BTC)\n" +
        "People are selling " + cR.asks[Object.keys(cR.asks)[0]] +  " " + Object.keys(cR.asks)[0] + ".  (worth " + cR.asks.BTC + " BTC)"
        cR = {}
    else if mode is "depth" and Object.keys(cR).length == 2
      if msg.header?
        msg.send cR; cR = {}
      else
        msg.send "Total " + Object.keys(cR.asks)[0] + " being sold at that depth is " + cR.asks[Object.keys(cR.asks)[0]] + ". (worth " + cR.asks.BTC + " BTC)\n" +
        "Total " + Object.keys(cR.bids)[0] + " being bought at that depth is " + cR.bids[Object.keys(cR.bids)[0]] + ". (worth " + cR.bids.BTC + " BTC)"
        cR = {}    
    else if mode is "swap"
      if msg.header?
        cRs ={}; cRs[cR.data.target] = cR.data.amount 
        msg.send cRs; cR = {}
      else 
       msg.send cR.data.base_amount + " " + cR.data.base + " at current books gives you " + cR.data.amount + " " + cR.data.target + "."
       cR = {}
    else if mode is "amount" and Object.keys(cR).length == 2
      if msg.header?
        msg.send cR; cR = {}
      else
        msg.send "Buying " + cR.asks[Object.keys(cR.asks)[0]] + " " + Object.keys(cR.asks)[0] + " at current books gives you " + cR.asks.BTC  + " BTC.\n" +
        "Selling " + cR.bids[Object.keys(cR.bids)[0]] + " " + Object.keys(cR.bids)[0] + " at current books gives you " + cR.bids.BTC  + " BTC."
        cR = {}
  #if typeof robot.events._events.CryptoRequest is 'undefined'
  robot.on 'CryptoRequest', (r, msg) ->
    r.market = 'p' if r.market is "" or not r.market 
    r.mode = "all"; r.mode = "depth" if r.depth; r.mode = "swap" if r.ticker2; r.mode = "amount" if r.amount and not r.ticker2
    r.ticker  = r.ticker?.toUpperCase()
    r.ticker2 = if r.ticker2 and r.ticker2 != 'false' then r.ticker2.toUpperCase() else false
    r.amount  = if r.amount then r.amount else 0
    r.depth   = r.depth
    r.depth = 999999 if r.amount or not r.depth
    Get r.ticker, r.depth, r.market, msg, robot, (orderBook) ->
      return if orderBook.error
      price = parseFloat((+orderBook.asks[0][0] + +orderBook.bids[0][0]) / 2).toFixed(8)
      if r.mode is "all" then robot.emit 'CryptoReply', { price: price }, r.mode,  msg
      Loop orderBook, r, msg, robot

  robot.hear /^(?:c|crypto|swap) (?:-(b?p?|p?b?) )?(\d+\.?\d{0,8})? ?(\w{2,5}) ?(?:for)? ?(\d{1,6}|\w{2,5})? ?(.+)?/i, (msg) ->
#    clone = Object.assign({}, robot.events._events);
#    delete clone.test
#    console.log("CLONE")
#    console.log(clone)
#    console.log("AND REAL")
#    console.log(robot.events._events)

    depth   = msg.match[4] if /^\d{1,6}$/.test(msg.match[4])
    ticker2 = msg.match[4] if not /^\d{1,6}$/.test(msg.match[4])
    robot.emit 'CryptoRequest', { market: msg.match[1], ticker: msg.match[3], ticker2: ticker2, amount: msg.match[2], depth: depth }, msg

Get = (ticker, depth, market, msg, robot, cb) ->
  marketLink = "https://bittrex.com/api/v1.1/public/getorderbook?market=BTC-"+ticker+"&type=both&depth="+depth if market is "b"
  marketLink = "https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_"+ticker+"&depth="+depth  if market is "p"
# marketLink.pb = marketLink.pb = [ marketLink.p, marketLink.b ] # Both markets (future arb scanner)
  robot.http(marketLink).get() (err, resp, body) ->
    msg.send err if err
    if market is "b"
      orderBook = JSON.parse(body).result 
      if orderBook is null
        msg.send "Error, probably invalid ticker(s)." 
        return
      CompatibleBook orderBook, (orderBook) ->
        cb(orderBook)
    else
      orderBook = JSON.parse(body)
      if orderBook.error
        msg.send orderBook.error 
        return
      cb(orderBook)

CompatibleBook = (orderBook, cb) ->
  compatibleBook = {}
  i = 0
  while i < Object.keys(orderBook).length
    key = Object.keys(orderBook)[i]
    if key is 'buy' then compatibleKey = 'bids' else compatibleKey = 'asks'
    j = 0
    compatibleBook[compatibleKey] = []
    while j < orderBook[key].length
      compatibleBook[compatibleKey].push [ orderBook[key][j].Rate, orderBook[key][j].Quantity ]
      j++
    i++
  cb(compatibleBook)

Loop = (orderBook, r, msg, robot) ->
  for key in Object.keys(orderBook) when key isnt 'seq' and key isnt 'isFrozen'
    amountInBtc = 0; totalBtc = 0; totalTicker = 0;

    for c in orderBook[key]
      break if +totalTicker > +r.amount and r.amount != 0
      # Amount isnt 0 so user is looking for specific amount and its been passed.
      # 
      totalTicker = parseFloat(+totalTicker + c[1]).toFixed(8); totalBtc = parseFloat(+totalBtc + c[0]*c[1]).toFixed(8)
      # total ticker amount is the amount at previous depths + the amount at current depth, and total btc is amount at current times price
      #
      if +totalTicker >= +r.amount and r.amount != 0
      # Same check that breaks us out except it just happened so make sure we remove
        amountInBtc = parseFloat(totalBtc - (totalTicker - r.amount) * c[0]).toFixed(8)
        # Remove difference between total ticker and amount to get exact bitcoin cost for ticker amount

        if r.ticker2 and key is 'bids'
          Get r.ticker2, r.depth, r.market, msg, robot, (orderBook) ->
            return if orderBook.error
            totalBtc = 0; totalTicker2 = 0; amountTicker2 = 0
            for c in orderBook.asks
              break if +totalBtc > +amountInBtc
              totalTicker2 = parseFloat(+totalTicker2 + c[1]).toFixed(8); totalBtc = parseFloat(+totalBtc + c[0]*c[1]).toFixed(8)
              robot.emit 'CryptoReply', {data:{base:r.ticker,base_amount:r.amount,target:r.ticker2,amount:parseFloat(totalTicker2-((totalBtc-amountInBtc)/c[0])).toFixed(8)}}, r.mode, msg if +totalBtc >= +amountInBtc
    if r.amount and not r.ticker2
      reply = {}; reply[key] = {}; reply[key][r.ticker] = r.amount; reply[key]['BTC'] = amountInBtc
      robot.emit 'CryptoReply', reply, r.mode, msg
    else if not r.ticker2
      if r.depth == 999999
        reply = {}; reply[key] = {}; reply[key][r.ticker] = totalTicker; reply[key]['BTC'] = totalBtc 
        robot.emit 'CryptoReply', reply, r.mode, msg
      else
        reply = {}; reply[key] = {}; reply[key][r.ticker] = totalTicker; reply[key]['BTC'] = totalBtc 
        robot.emit 'CryptoReply', reply, r.mode, msg

