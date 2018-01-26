// Description:
//   Random extra mubot utilities
//
//
const l = {}
;
let bot
;
l.exports = _bot => {
  bot = _bot;
  bot.mubot.extras = l;

  bot.respond(/view brain(?: (.+))?$i/, _=>l.viewBrain(_));
  bot.respond(/ping(?: me)?$/i, _=>l.ping(_));
  bot.respond(/time(?: me)?$/i, _=>l.time(_));
  bot.respond(/date(?: me)?$/i, _=>l.date(_));
  bot.respond(/command count(?: me)?$/i, _=>l.commandCount(_));
  bot.respond(/adapter$/i, _=>l.adapter(_));
  bot.respond(/echo ((?:\n|.)*)$/i, _=>l.echo(_));
  bot.respond(/set alarm (\d+)(?: (.*))?$/i, _=>l.alarm(_));
  // Export
}
;
l.alarm = res => {
  let [, delay = 7, msg = "Alarm triggered!!!"] = res.match;

  setTimeout(()=>res.reply(msg), delay*1000);
}
;
l.echo = res =>
  res.send(res.match[1])
;
l.adapter = (res = {send: _=>_}) =>
  res.send(bot.adapterName)
;
l.viewBrain = (res = {send: _=>_}) =>
  bot.mubot.inspect.run(bot.brain.data, msg.match[1])
;
l.commandCount =  (res = {send: _=>_}) =>
  res.send("I am aware of " + res.bot.commands.length + " commands.")
;
l.ping =  (res = {send: _=>_}) =>
  bot.adapterName === 'discord' ? res.send(bot.client.pings[0] + 'ms.') : res.send("pong")
;
l.time = (res = {send: _=>_}) =>
  res.send("Server time is: " + new Date().toLocaleTimeString())
;
l.date = (res = {send: _=>_}) =>
  res.send("Server date is: " + new Date().toLocaleDateString())
;
module.exports = l.exports;
