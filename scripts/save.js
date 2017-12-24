// Description:
//   Saves redis to disk and  removes auto save from brain, and writes to disk on save event.
//
// Commands:
//   mubot save - Saves db to ./brain.json.
//
// Configureation:
//   set setAutoSave(false) to true, for more writes.
//   currently its set to save just when user balances change.
//
// Author:
//   leathan
//
(function() {
  const fs = require('fs'), Path = require('path');
  const path = Path.join(__dirname, '/../brain.json');
  const write = data => fs.writeFile(path, JSON.stringify(data), 'utf-8', ()=>{});
  module.exports = bot => {
    bot.respond(/save$/i, res => {
      bot.brain.save();
      res.send("Database saved to disk.")
    })
    bot.brain.setAutoSave(false);
    try {
      var data = fs.readFileSync(path, 'utf-8');
      data && bot.brain.mergeData(JSON.parse(data));
      bot.brain.emit('loaded');
    } catch(err) {
      if(err.code !== 'ENOENT') console.log(err)
    }
    bot.brain.on('save', write);
    bot.brain.on('close', write);
    bot.brain.on('shutdown', write)
  }
}).call(this);



