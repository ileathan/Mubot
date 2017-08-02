// Description:
//   Saves redis to disk
//
// Commands:
//   mubot save - Saves db to ./brain.json.
//
// Author:
//   leathan
//
module.exports = function(robot) {
  robot.respond(/save$/i, function(msg) {
    robot.brain.save()
    msg.send("Database saved to disk.")
  })
}



