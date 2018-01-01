// Description:
//   Make mubot start typing.
// Commands:
//   mubot type - Makes mubot start typing.
(function(){
  module.exports = bot => {
    bot.respond(/type$/i, res => {
      bot.client.rest.methods.sendTyping(res.message.room)
    })
  }
}).call(this);
