// Description:
//   Random extra mubot utilities
//
const l = {}
;
module.exports = bot => {
  bot.brain.on('loaded', () => {
    // Export
    Object.assign(bot.mubot, {extras: l});
  });
  bot.respond(/.*ping(?: me)?/i, l.ping)
  bot.respond(/.*command count(?: me)?/i, l.commandCount)
}
;
l.commandCount = res =>
  res.send("I am aware of " + res.bot.commands.length + " commands.")
;
l.ping = res =>
  res.send(res.bot.client.pings[0] + 'ms.');
;
