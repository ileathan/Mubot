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
  bot.respond(/save$/i, res => {
    bot.brain.save();
    res.send("Database saved to disk.")
  })
}



