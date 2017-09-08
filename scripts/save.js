// Description:
//   Saves redis to disk
//
// Commands:
//   mubot save - Saves db to ./brain.json.
//
// Author:
//   leathan
//
module.exports = bot => {
  robot.respond(/save$/i, res => {
    robot.brain.save();
    res.send("Database saved to disk.")
  })
}



