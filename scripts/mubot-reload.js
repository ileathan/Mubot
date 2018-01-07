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
  const fs = require('fs'),
        path = require('path'),
        l = {}
  ;
  let bot = null,
      reloadMode = "all"
  ;
  l.exports = _bot => {
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
  l.imports = {fs, path}
  ;
  const Reload = function(res = {send: _=>_}) {
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
      bot.server._events = {};
      bot.bitmark.io._events = {};
    } catch(e){}

    if(modes.includes("all") || !modes.length) {
       modes = null;
    }
    // modes is [filepath]
    if(modes && !modes.filter(_=>/src|scripts|external|all/i.test(_)).length) {
      bot.load(path.resolve(".", modes[0]));
    }
    if(!modes || modes.includes("scripts")) {
      bot.load(path.resolve(".", "scripts"));
    }
    if(!modes || modes.includes("src")) {
      bot.load(path.resolve(".", "src", "scripts"));
    }
    if(!modes || modes.includes("external")) {
      try {
        fs.readFile(path.resolve(".", "external-scripts.json"), (err, res) => {
          bot.loadExternalScripts(JSON.parse(res))
        })
      } catch(e) {
       res.send("Error loading external-scripts.json " + e)
      }
    }
    res.send("Reloaded `" + (modes ? modes.join(", ") : "all") + "` code.")
  }
  Object.defineProperties(l, {
    reload: {value: Reload, enumerable: true},
    imports: {enumerable: false},
    exports: {enumerable: false}
  })
  ;
  Object.defineProperties(l.reload, {
    modes: {
      set(n) {reloadMode = n},
      get() {return reloadMode},
      enumerable: true
    }
  })
  ;
  module.exports = l.exports
  ;
}).call(this);
