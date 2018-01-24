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
  const circularJSON = require('circular-json');
  const fs = require('fs'), Path = require('path');
  const path = Path.join(__dirname, '/../brain.json');
  const rjson = require("relaxed-json");

  const l = {};
  let bot;

  l.imports = {fs, path, rjson};

  l.exports = _bot => {
    bot = _bot;
    bot.respond(/save brain$/i, _=>l.save());
    bot.respond(/(set|write) brain (.+)/i, _=>l.easyWrite(_));
 
    bot.brain.on('save', _=>l.save());
    bot.brain.on('close', _=>l.save());
    bot.brain.on('shutdown', _=>l.save());
    l.load();
    bot.mubot.save = l;
  }
  ;
  l.save = data => {
    if(!data) {
      data = Object.assign({}, bot.brain.data, {users: {}})
    }
    try {
      fs.writeFile(path, JSON.stringify(data), 'utf8', _=>0);
    } catch(e) {
      bot.logger.debug("Mubot-save: Error: Saving brain.")
    }
    ;
  }
  ;
  l.load = (res = {send: _=>_}) => {
    res.path || (res.path = Path.join(__dirname, '/../brain.json'));
    let data;
    try {
      data = fs.readFileSync(res.path, 'utf-8')
    } catch(e) {
      data = "{}";
      bot.logger.debug("Mubot-save: Error: Reading brain file.");
    }
    try {
      bot.brain.mergeData(JSON.parse(data));
      bot.brain.emit('all loaded');
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
