// Description:
//  Mines for your leat.io user account.
//
// Commands:
//   Mubot mine me [coin] - Just monero and soon just Bitmark, donate for others.
//

// this module. export it if needed outside of hubot. `module.exports = l`
module.exports = bot => {
  bot.on("leat.io loaded", l.load);
  bot.respond(/mine(?: me)?(?: (.*))?/i, l.mine);
}
;
// API
const l = {}
;
l.load = bot => {
  Object.assign(l, bot.keat);
}
;
l.mine = res => {
  let id  = res.message.user.id,
      server = l.bot.adapterName
  ;
  l.verifiedById[id] ?
    void 0 // start hashing...
  :
    res.send("Can only mine for verified users, on leat.io type: ```/" + server + " " + id + "```")
  ;
}
;
