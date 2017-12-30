// Description:
//   Make imubot start typing.
// Commands:
//   imubot type - Makes imubot start typing.
(function(){
  module.exports = bot => {
    bot.respond(/type$/i, res => {
      bot.client.rest.methods.sendTyping(res.message.room)
    })
  }
}).call(this);
