// Descriptions:
//  Yet another mubot crypto package
//
// Commands:
//   !coins [byname|byprice|byticker|byrank|byvolume]
//
(function(){
  // Exports
  module.exports = bot => {
//     bot.brain.on('all loaded', () => {
//       // Export module.
//       bot.mubot.coins = l;
//     });
    bot.mubot.coins = l;
    l.refresh({bot});
    bot.hear(/^!coins( (load|build|ref(resh)?))? build$/, _=>l.refresh(_))
    ;
  }
  ;
  const l = {};
  l.asObj = {};
  l.asArray = [];
  l.utils = {};

  l.api_endpoint = "https://api.coinmarketcap.com/v1/ticker?limit=0";
  const http = require('request');
  l.utils.returnMode = {json: 1, raw: 1, raw: 1, r: 1, name: 2, view: 2, list: 2, names: 2, n: 2};

  l.utils.stringToCmdRe = string => {
    for(let cmd of l.commands) {
      if(RegExp(l.utils.cmdToStringArray(cmd).join('|'), 'i').test(string))
        return '(' + l.utils.cmdToStringArray(cmd).join('|') + ')'
      ;
    }
  }
  ;
  l.utils.stringToCmd = string => {
    for(let cmd of l.commands) {
      if(RegExp('^('+l.utils.cmdToStringArray(cmd).join('|')+')$', 'i').test(string))
        return cmd
      ;
    }
  }
  ;
  l.utils.cmdToStringArray = cmd => {
    switch(cmd) {
      case 'name':
        return ['byname', 'bn', 'name', 'n']
        break;
      case '24h_volume_usd':
        return ['byvol', 'byvolume', 'volume', 'vol', '24h_volume_usd', 'by24h_volume_usd']
        break;
      case 'market_cap_usd':
        return ['bycap', 'cap', 'marketcap', 'bymarketcap', 'market_cap_usd', 'bymarket_cap_usd']
        break;
      case 'available_supply':
        return ['byavailable', 'available', 'available_supply', 'byavailable_supply']
        break;
      case 'total_supply':
        return ['bysupply', 'supply', 'total_supply', 'bytotal_supply']
        break;
      case 'max_supply':
        return ['bymax', 'max', 'max_supply', 'bymax_supply']
        break;
      case 'percent_change_1h':
        return ['1h', 'by1h', 'bychange 1h', 'change 1h', 'percent_change_1h', 'bypercent_change_1h']
        break;
      case 'percent_change_24h':
        return ['1d', 'by1d', 'bychange 1d', 'change 1d', 'percent_change_24h', 'bypercent_change_24h', 'percent_change_1d', 'bypercent_change_1d']
        break;
      case 'percent_change_7d':
        return ['7d', 'by7d', 'bychange 7d', 'change 7d', 'percent_change_7d', 'bypercent_change_7d', 'percent', 'bypercent', 'change', 'bychange']
        break;
      case 'symbol':
        return ['bysymbol', 's', 'byticker', 'bt', 'ticker', 't']
        break;
      case 'rank':
        return ['byrank', 'br', 'rank', 'r']
        break;
      case 'id':
        return ['id', 'byid']
        break;
      case 'last_updated':
        return ['updated', 'byupdated', 'last_updated', 'bylast_updated']
        break;
      case 'price_usd':
        return ['byprice', 'price', 'price_usd']
        break;
      case 'price_btc':
        return ['bybtc', 'price_btc']
        break;
      default: return null;
    }
  }
  ;

  l.utils.buildRes = (matches, mode) =>
    mode === 0 ?
      matches.length + " matches."
    :
      mode === 2 ?
        matches.reduce((a,_)=>a.push(_.symbol) && a,[]).join(', ')
      :
        JSON.stringify(matches, null, 2)
      //
    //
  ;
  // const search = (coins, value) => coins.filter(_=>RegExp('^' + value + '$', 'i').test(_[cmdToKey[value]])
  l.getMatches = res => {

    let mode = l.utils.returnMode[res.match[1]] || 0,
        key = l.utils.stringToCmd(res.match[2]),
        // Transform `\`Hello, World!\`` -> `Hello World`
        reStr = res.match[3].replace(/`((?:\\.|[^`])+)`/, '$1') || res.match[3],
        matches = [], re = {}
    ;
    if(reStr[0] === '/') {
      // Transform '/foo/var/flags' -> 'flags'
      re.flags = reStr.replace(/.*[/](.*?)$/, "$1");
      re.source = reStr.slice(1, -re.flags.length - 1);
    } else {
      re.flags = 'i';
      re.source = '^(' + reStr.trim().split(/[\W]/).join('|') + ')$';
    }
    matches = l.asArray.filter(_=> {
      
      return RegExp(re.source, re.flags).test(_[key])
    })
    ;
    res.send(l.utils.buildRes(matches, mode))
    ;
  }
  ;
  l.refresh = res => http(l.api_endpoint, (_, __, data) => {
    l.asArray = JSON.parse(data)
    ;
    if(!res.send) {
      l.commands = Object.keys(l.asArray[0]);
      ;
      for(let cmd of l.commands)
        res.bot.hear(l.utils.buildRegex(cmd), _=>l.getMatches(_))
      ;
    }
    res.send && res.send(l.asArray.length + " processed.")
    ;
    for(let coin of l.asArray) {
      let keys = Object.keys(coin)
      ;
      for(let key of keys)
        l.asObj[key] ? l.asObj[key].push(coin) : l.asObj[key] = [coin]
      ;
    }
    ;
    return "refreshed"
  })
  ;
  l.utils.buildRegex = cmd =>
    RegExp('^!coins (?:-?('+Object.keys(l.utils.returnMode).join('|')+') )?-?('+l.utils.cmdToStringArray(cmd).join('|')+') (.+)$', 'i')
  ;
}).call(this)
;
