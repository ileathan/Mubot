// Description:
//   Random extra mubot utilities
//
const l = {}
;
l.exports = bot => {
  bot.brain.on('loaded', () => Object.assign(bot.mubot, {extras: l}));
  bot.respond(/.*view brain(?: (.+))?i/, l.viewBrain);
  bot.respond(/.*ping(?: me)?/i, l.ping);
  bot.respond(/.*time(?: me)?/i, l.time);
  bot.respond(/.*date(?: me)?/i, l.date);
  bot.respond(/.*command count(?: me)?/i, l.commandCount);
}
;
l.viewBrain = (res = {send: _=>_}) =>
  bot.mubot.inspect.run(bot.brain.data, msg.match[1])
;
l.commandCount =  (res = {send: _=>_}) =>
  res.send("I am aware of " + res.bot.commands.length + " commands.")
;
l.ping =  (res = {send: _=>_}) =>
  res.send(res.bot.client.pings[0] + 'ms.');
;
l.time = (res = {send: _=>_}) =>
  new Date().toLocaleTimeString()
;
l.date = (res = {send: _=>_}) =>
  new Date().toLocaleDateString()
;
module.exports = l.exports;
