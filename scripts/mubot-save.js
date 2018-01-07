// Description:
//   Saves brain to disk and removes its auto save and writes to disk on save event.
//
// Commands:
//   mubot save brain - Dumps brain to ./brain.json.
//   mubot write data - Overwrites dumpfile with data (data can be very relaxed json))
//
// Author:
//   leathan
//
;(function() {
  //const circularJSON = require('circular-json');
  const fs = require('fs'), Path = require('path');
  const path = Path.join(__dirname, '/../brain.json');
  const rjson = require("relaxed-json");

  const l = {};

  l.imports = {fs, path, rjson};

  l.exports = bot => {
    bot.respond(/save brain$/i, l.save);
    bot.respond(/(set|write) brain (.+)/i, l.easyWrite);
 
    bot.brain.on('save', l.write);
    bot.brain.on('close', l.write);
    bot.brain.on('shutdown', l.write);
  }
  ;

  l.write = (res = {send: _=>_}) => {
    let data = res.data || res;
    if(!data) {
      return res.send("No write data provided.")
    }
    try {
      fs.writeFile(path, rjson.stringify(data), 'utf8', _=>0);
    } catch(e) {
      bot.logger.debug("Mubot-save: Error: Saving brain.")
    }
    ;
  }
  ;
  l.save = (res = {send: _=>_}) => {
    l.write(bot.brain.data);
    return res.send("Saving brain data.")
  }
  ;
  l.load = (res = {send: _=>_}) => {
   res.path || (res.path = Path.join(__dirname, '/../brain.json'));
   try {
     let data = fs.readFileSync(res.path, 'utf-8');
     bot.brain.mergeData(JSON.parse(data));
     bot.brain.emit('loaded');
    } catch(err) {
      bot.logger.debug("Mubot-save: Error: Loading brain.");
    }
  }
  ;
  l.easyWrite = (res = {send: _=>_}) => {
    let data = rjson.parse((res.match||"")[1]);
    if(!data) {
      return res.send("No write data provided.");
    }
    if(data[0] !== "{") {
      data = "{" + data + "}";
    }
    l.write(rjson.parse(data))
  }
  ;
  Object.defineProperties(l, {
    imports: {enumberable: false},
    exports: {enumberable: false}
  })
  ;
  module.exports = l.exports
  ;
}).call(this);
