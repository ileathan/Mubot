// Description:
//   Make hubot start typing.
// Commands:
//   hubot type - Makes hubot start typing.

module.exports = (bot) => {
  bot.respond(/type$/i, r=> {
    bot.client.rest.methods.sendTyping(r.message.room)
  })
}