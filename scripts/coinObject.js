// Descriptions:
//  Yet another mubot crypto package
//
// Commands:
//   !coins [byname|byprice|byticker|byrank|byvolume]
//

(function(){
  const API = "https://api.coinmarketcap.com/v1/ticker?limit=0";
  const request = require('request');
  const returnMode = {json: 1, raw: 1, raw: 1, r: 1, name: 2, view: 2, list: 2, names: 2, n: 2};
  const modes = Object.keys(returnMode);
  const cmdToCoinKey = {
    id: 'id',
    name: 'name',
    ticker: 'symbol',
    rank: 'rank',
    price: 'price_usd',
    price_btc: 'price_btc',
    volume: '24h_volume_usd',
    'market cap': 'market_cap_usd',
    supply: 'available_supply',
    'total supply': 'total_supply',
    'max supply': 'max_supply',
    'percent 1h': 'percent_change_1h',
    'percent 1d': 'percent_change_24h',
    percent: 'percent_change_7d',
    'max supply': 'max_supply',
    percent_change_1h: 'percent_change_1h',
    percent_change_1d: 'percent_change_24h',
    percent_change_7d: 'percent_change_7d',
    'last updated': 'last_updated'
  };

  const commands = Object.keys(cmdToCoinKey);
  //
  const stringToCmdRe = string => {
    for(let cmd of commands) {
      if(RegExp(cmdToStringArray(cmd).join('|'), 'i').test(string))
        return '(' + cmdToStringArray(cmd).join('|') + ')'
      ;
    }
  }
  ;
  const stringToCmd = string => {
    for(let cmd of commands) {
      if(RegExp('^('+cmdToStringArray(cmd).join('|')+')$', 'i').test(string))
        return cmd
      ;
    }
  }
  ;
  const cmdToStringArray = cmd => {
		switch(cmd) {
      case 'name':
     		return ['byname', 'bn', 'name', 'n']
     		break;
      case 'ticker':
     		return ['bysymbol', 's', 'byticker', 'bt', 'ticker', 't']
     		break;
      case 'rank':
     		return ['byrank', 'br', 'rank', 'r']
     		break;
      case 'price':
     		return ['byprice', 'price']
     		break;
      case 'percent':
     		return ['percent', '%', 'per']
     		break;
      case 'supply':
     		return ['supply', 'sup']
     		break;
      case 'price':
     		return ['byprice', 'price']
     		break;
    	default: return [cmd];
		}
  }
  ;
  var Coins = {};
  var CoinsArray = [];
  module.exports = bot => {
    buildCoins();
    bot.hear(/^!coins build$/, buildCoins)
    ;
    for(let cmd of commands)
      bot.hear(buildRegex(cmd), getMatches)
    ;
  }
  ;
  const buildRes = (matches, mode) =>
      mode === 0 ?
        matches.length + " matches."
      :
        mode === 2 ?
          matches.reduce((a,_)=>a.push(_.symbol) && a,[]).join(', ')
        :
          JSON.stringify(matches, null, 2)
  ;
  // const search = (coins, value) => coins.filter(_=>RegExp('^' + value + '$', 'i').test(_[cmdToKey[value]])
  const getMatches = msg => {
    var mode = returnMode[msg.match[1]] || 0,
        cmd = stringToCmd(msg.match[2]),
        search = msg.match[3].replace(/(?:`((?:\\.|[^`])+)`)/, '$1') || msg.match[3],
        matches = []
    ;
    var re = {};
    if(search[0] === '/') {
      re.options = search.split(/\//).pop() || "";
      re.source = search.slice(1, -re.options.length - 1);
    } else {
      re.options = 'i';
      re.source = '^(' + search.trim().split(/[\W]/).join('|') + ')$';
    }
    matches = CoinsArray.filter(_=>
      RegExp(re.source, re.options).test(_[cmdToCoinKey[cmd]])
    )
    ;
    msg.send(buildRes(matches, mode))
    ;
  }
  ;
  const buildCoins = msg => request(API, (_, __, data) => {
    var coins = JSON.parse(data)
    ;
    CoinsArray = coins
    ;
    msg && msg.send(CoinsArray.length + " processed.")
    ;
    for(let coin of CoinsArray) {
      let keys = Object.keys(coin)
      ;
      for(let key of keys)
        Coins[key] ? Coins[key].push(coin) : Coins[key] = [coin]
      ;
    }
    ;
    // For debugging.
  })
  ;
  const buildRegex = cmd => {
    return new RegExp('^!coins (?:-?(' + modes.join('|') + ') )?-?(' + cmdToStringArray(cmd).join('|') + ') (.+)$', 'i')
    ;
  }
}).call(this)
;
