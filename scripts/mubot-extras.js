// Description:
//   Random extra mubot utilities
//
const l = {}
;
let bot
;
l.exports = _bot => {
  bot = _bot;
  bot.respond(/.*view brain(?: (.+))?i/, l.viewBrain);
  bot.respond(/.*ping(?: me)?/i, l.ping);
  bot.respond(/.*time(?: me)?/i, l.time);
  bot.respond(/.*date(?: me)?/i, l.date);
  bot.respond(/.*command count(?: me)?/i, l.commandCount);
  bot.respond(/adapter$/i, l.adapter);
  bot.respond(/echo ((?:\n|.)*)$/i, l.echo);
  bot.respond(/set alarm (\d+)(?: (.*))?/i, l.setAlarm);
  // Export
  Object.assign(bot.mubot, {extras: l});
}
;
l.setAlarm = res=> {
  let [, delay, msg = "Alarm triggered!!!"] = res.match;

  res.send("Alarm set for " + delay);
  setTimeout(()=>res.reply(msg), delay*1000);
}
;
l.echo = res => {
  if(res) { 
    if(!res.match) { res.send = _=>_; res.match = [, res]}
  }
  res.send(res.match[1])
}
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
  res.send(res.bot.client.pings[0] + 'ms.');
;
l.time = (res = {send: _=>_}) =>
  "Server time is: " + new Date().toLocaleTimeString()
;
l.date = (res = {send: _=>_}) =>
  "Server date is: " + new Date().toLocaleDateString()
;
module.exports = l.exports;
