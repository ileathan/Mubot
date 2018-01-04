// Description:
//   Allows Mubot to hotload code.
//
// Commands:
//   mubot reload [modes] - Reloads code without restart.
//
// Author:
//   leathan
//
;(function() {
  const Fs = require('fs'),
        Path = require('path')
  ;
  let bot = null,
      reloadMode = "all"
  ;
  module.exports = _bot => {
    bot = _bot;
    bot.respond(/reload(?: (.+))?$/i, l.reload)
    bot.respond(/set (?:reload|load)(?: modes?)?(?: me)?(?: (.+))?/i, res => {
      let modes = res.match[1]
      if(!modes) {
        return res.send(
          "Please specify atleast 1 mode, possible modes are `all|src|scripts|external|<filepath>`."
        );
      }
      res.send("Reload code set to " + reloadMode + ".");
    });
    Object.assign(bot.mubot, l)
  }
  ;
  const l = {}
  ;
  const Reload =  (res = {send: _=>_}) => {
    let modes = (res.match||"")[1] ? res.match[1].split(' ') : [].slice.call(arguments, 1)
    ;
    try {
      bot.middleware.listener.stack = [];
      bot.middleware.receive.stack = [];
      bot.middleware.response.stack = [];
      bot.commands = [];
      bot.listeners = [];
      bot._events = {};
      bot.brain._events = {};
      bot.events._events = {}
      bot.leat.io._events = {};
      bot.bitmark.io._events = {};
    } catch(e){}

    if(modes.includes("all") || !modes.length) {
       modes = null;
    }
    // modes is [filepath]
    if(modes && !modes.filter(_=>/src|scripts|external|all/i.test(_)).length) {
      bot.load(Path.resolve(".", modes[0]));
    }
    if(!modes || modes.includes("scripts")) {
      bot.load(Path.resolve(".", "scripts"));
    }
    if(!modes || modes.includes("src")) {
      bot.load(Path.resolve(".", "src", "scripts"));
    }
    if(!modes || modes.includes("external")) {
      try {
        Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
          bot.loadExternalScripts(JSON.parse(res))
        })
      } catch(e) {
       res.send("Error loading external-scripts.json " + e)
      }
    }
    res.send("Reloaded `" + (modes ? modes.join(", ") : "all") + "` code.")
  }
  Object.defineProperty(l, 'reload', {value: Reload, enumerable: true})
  ;
  Object.defineProperty(l.reload, 'modes', {
    set(n){ reloadMode = n },
    get(){ return reloadMode },
    enumerable: true
  })
  ;
}).call(this);
