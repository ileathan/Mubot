// Description:
//   Allows Mubot to hotload code.
//
// Commands:
//   mubot reload [mode] - Reloads code without restart.
//
// Author:
//   leathan
//
;(function() {
  const Fs = require('fs'),
        Path = require('path')
  ;
  let reloadMode = "all"
  ;
  module.exports = bot => {
    bot.respond(/reload(?: (.+))?$/i, l.reload)
    bot.respond(/set (?:reload|load)(?: mode)?(?: me)?(?: (.+))?/i, res => {
      let mode = res.match[1]
      if(!mode) {
        return res.send("Please specific a mode to set, possible modes are `all|src|scripts|external|<filepath>`.");
      }
      l.reloadMode = mode;
      res.send("Reload code set to " + reloadMode + ".");
    });
    Object.assign(bot.mubot, {reload: l})
  }
  ;
  const l = {}
  ;
  Object.defineProperty(l, 'reloadMode', {set(n){reloadMode = n}})
  ;
  l.reload = res => {
    let bot = res.bot,
        mode = res.match[1].split(/[\s\W]*/)
    ;
    bot.middleware.listener.stack = [];
    bot.middleware.receive.stack = [];
    bot.middleware.response.stack = [];
    bot._events = {};
    bot.brain._events;
    bot._eventsCount = 0;
    bot.commands = [];
    bot.listeners = [];
    bot.events._events = {}

    if(mode && mode.filter(_=>/src|scripts|external|all/i.test(_)).length === 0) {
      bot.load(Path.resolve(".", res.match[1]));
    }
    if(!mode || mode.includes("scripts")) {
      bot.load(Path.resolve(".", "scripts"));
    }
    if(mode.includes("all")) {
       mode = null;
    }
    if(!mode || mode.includes("src")) {
      bot.load(Path.resolve(".", "src", "scripts"));
    }
    if(!mode || mode.includes("external")) {
      try {
        Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
          bot.loadExternalScripts(JSON.parse(res))
        })
      } catch(e) {
       res.send("Error loading external-scripts.json " + e)
      }
    }
    res.send("Reloaded `" + (mode ? mode : "all") + "` code.")
  }
}).call(this);