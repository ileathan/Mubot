// Description:
//   responds to hi

module.exports = function(robot) {
  robot.hear(/^(h+)(i+)$/i, function(msg) {
    msg.send("Hello " + msg.message.user.name + "!")
  })
}
