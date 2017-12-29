// Description:
//   responds to hi

module.exports = function(bot) {
  bot.hear(/^(h+)(i+)$/i, function(msg) {
    msg.send("Hello " + msg.message.user.name + "!")
  })
}
