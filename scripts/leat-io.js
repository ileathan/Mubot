// Description:
//  Mines for your leat.io user account.
//
// Commands:
//   Mubot mine me [coin] - Just monero and soon just Bitmark, donate for others.
//

// this module. export it if needed outside of hubot. `module.exports = l`
const l = {}
;
module.exports = bot => {
  bot.brain.on('connected', ()=> l.loadVerified(bot));
  bot.respond(/mine(?: me)?(?: (.*))?/i, l.mine);
}
;
// API
l.loadVerified = bot => {
  l.verified = bot.brain.data.verified || (bot.brain.data.verified = {});
}
;
l.loadVerifiedById = () => {
  l.verifiedById = {};
  for(let name in l.verified) {
    Object.assign(l.verifiedById, l.verified[name].ids);
  }
}
;
l.mine = res => {
  global.bot = res.robot;
  let bot = res.robot,
      id  = l.msgToUserId(res),
      verified = l.verifiedById[id],
      server = res.robot.adapterName
  ;
  l.verified[id] ?
    void 0 // start hashing...
  :
    res.send("Can only mine for verified users, on leat.io type: ```/verify " + server + " " + id + "```")
  ;
}
;
l.msgToUserId = res => {
  return res.username ?
    // Discord.
    res.username.id
  :
    // Slack.
    res.message.user.id
  ;
}
;
