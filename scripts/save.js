
// Description:
//   Saves redis to disk

module.exports = function(robot) {
  robot.respond(/save$/i, function(msg) {
    robot.brain.save()
    msg.send("Database saved to disk.")
  })
}



