// Description:
//   Random extra mubot utilities
//
const l = {}
;
module.exports = l.exports;

l.exports = bot => {
  bot.brain.on('loaded', () => Object.assign(bot.mubot, {extras: l}));
  bot.respond(/.*view brain(? (.+))?i/, l.viewBrain);
  bot.respond(/.*ping(?: me)?/i, l.ping);
  bot.respond(/.*command count(?: me)?/i, l.commandCount);
}
;
l.viewVrain = (res = {send: _=>_}) =>
  bot.mubot.inspect.run(bot.brain.data, msg.match[1])
;
l.commandCount =  (res = {send: _=>_}) =>
  res.send("I am aware of " + res.bot.commands.length + " commands.")
;
l.ping =  (res = {send: _=>_}) =>
  res.send(res.bot.client.pings[0] + 'ms.');
;