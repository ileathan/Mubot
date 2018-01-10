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
      reloadModes = ["all"];
  ;
  Object.defineProperty(l, 'reload', {value: Reload, enumerable: true})
  ;
  l.reload.exports = _bot => {
    bot = _bot;
    bot.respond(/reload(?: (.+))?$/i, l.reload)
    bot.respond(/set (?:reload|load)(?: modes?)?(?: me)?(?: (.+))?/i, l.reload.setModes)
    Object.assign(bot.mubot, l)
  }
  ;
  l.reload.imports = {fs, path}
  ;
  l.reload.setModes = res => {
    let modes = res.match[1]
    if(!modes) {
      return res.send(
        "Please specify atleast 1 mode, possible modes are `all|src|scripts|external|<filepath>`."
      );
    }
    reloadModes = modes;
    res.send("Reload code set to `" + reloadModes.split(' ').join(', ') + "`.");
  }
  function Reload(res) {
    let modes = [];
    if(!res || !res.match[1]) {
      modes = reloadModes;
    } else {
      modes = res.match[1]
    }
    try {
      bot.middleware.listener.stack = [];
      bot.middleware.receive.stack = [];
      bot.middleware.response.stack = [];
      bot.commands = [];
      bot.listeners = [];
      bot._events = {};
      bot.brain._events = {};
      bot.events._events = {}
      //bot.leat.io._events = {};
      //bot.server._events.error.splice(2)
      //bot.server._events.listening.splice(2)
      bot.bitmark.io._events = {};
    } catch(e){}
    if(modes.includes("all")) {
       modes = ["all"];
    }
    // modes is [filepath]
    if(modes && !modes.filter(_=>/server|scripts|external|all/i.test(_)).length) {
      bot.load(path.resolve(".", modes[0]));
    }
    if(modes.includes("all") || modes.includes("scripts")) {
      bot.load(path.resolve(".", "scripts"));
    }
    if(modes.includes("server")) {
      bot.load(path.resolve(".", "server-scripts"));
      try {
        fs.readFile(path.resolve(".", "server-scripts.json"), (err, res) => {
          let files = JSON.parse(res);
          bot.loadExternalScripts(files)
        })
      } catch(e) {
       res.send("Error loading server-scripts.json " + e)
      }
    } else {
      bot.emit("leat.io loaded", bot)
    }
    if(modes.includes("all") || modes.includes("external")) {
      try {
        fs.readFile(path.resolve(".", "external-scripts.json"), (err, res) => {
          let files = JSON.parse(res);
          bot.loadExternalScripts(files)
        })
      } catch(e) {
       res.send("Error loading external-scripts.json " + e)
      }
    }
    res.send("Reloaded `" + (modes ? modes.join(", ") : "all") + "` code.")
  }

  Object.defineProperties(l.reload, {
    imports: {enumerable: false},
    exports: {enumerable: false},
    modes: {
      set(n) {reloadMode = n},
      get() {return reloadMode},
      enumerable: true
    }
  })
  ;
  module.exports = l.reload.exports
  ;
}).call(this);
