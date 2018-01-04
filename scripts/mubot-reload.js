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
  let bot = null,
      reloadMode = "all"
  ;
  module.exports = _bot => {
    bot = _bot;
    bot.respond(/reload(?: (.+))?$/i, l.reload)
    bot.respond(/set (?:reload|load)(?: mode)?(?: me)?(?: (.+))?/i, res => {
      let mode = res.match[1]
      if(!mode) {
        return res.send(
          "Please specific a mode to set, possible modes are `all|src|scripts|external|<filepath>`."
        );
      }
      l.reloadMode = mode;
      res.send("Reload code set to " + reloadMode + ".");
    });
    Object.assign(bot.mubot, l)
  }
  ;
  const l = {}
  ;
  const Reload = res => {
    // Hack on res in case we dont want a reply.
    res || (res = {send: _=>0, match:[]});
    let bot = res.bot || l.bot,
        mode = res.match[1] ? res.match[1].split(/[\s\W]*/) : [].slice.call(arguments, 1)
    ;
    bot.middleware.listener.stack = [];
    bot.middleware.receive.stack = [];
    bot.middleware.response.stack = [];
    bot.commands = [];
    bot.listeners = [];
    bot._events = {};
    bot.leat.io._events = {};
    bot.bitmark.io._events = {};
    bot.brain._events = {};
    //bot.client._events = {};
    bot.events._events = {}

    if(mode.includes("all") || !mode.length) {
       mode = null;
    }
    // mode is [filepath]
    if(mode && !mode.filter(_=>/src|scripts|external|all/i.test(_)).length) {
      bot.load(Path.resolve(".", mode[0]));
    }
    if(!mode || mode.includes("scripts")) {
      bot.load(Path.resolve(".", "scripts"));
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
  Object.defineProperty(l, 'reload', {value: Reload, enumerable: true})
  ;
  Object.defineProperty(l.reload, 'SRC_MODE', {
    set(n){ reloadMode = n },
    get(){ return reloadMode },
    enumerable: true
  })
  ;
}).call(this);