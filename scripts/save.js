// Description:
//   Saves brain to disk and removes its auto save and writes to disk on save event.
//
// Commands:
//   mubot save - Dumps brain to ./brain.json.
//
// Author:
//   leathan
//
(function() {
  const circularJSON = require('circular-json');
  const fs = require('fs'), Path = require('path');
  const path = Path.join(__dirname, '/../brain.json');
  const write = data => {
    try {
      fs.writeFile(path, circularJSON.parse(data), 'utf-8', _=>0)
    } catch(e) {
      //debugger;
    }
    ;
  }
  module.exports = bot => {
    bot.respond(/save$/i, res => {
      bot.brain.save();
      res.send("Database saved to disk.")
    })
    bot.brain.setAutoSave && bot.brain.setAutoSave(false);
    //bot.brain.on("connected", ()=> {
      try {
        var data = fs.readFileSync(path, 'utf-8');
        data && bot.brain.mergeData(JSON.parse(data));
        bot.brain.emit('loaded');
      } catch(err) {
        if(err.code !== 'ENOENT') console.log(err)
      }
    //});
    bot.brain.on('save', write);
    bot.brain.on('close', write);
    bot.brain.on('shutdown', write);
  }
}).call(this);