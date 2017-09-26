// Description:
//   Make hubot start typing.
// Commands:
//   hubot type - Makes hubot start typing.
(function(){
  module.exports = bot => {
    bot.respond(/type$/i, res => {
      bot.client.rest.methods.sendTyping(res.message.room)
    })
  }
}).call(this);
