// Description:
//   Allows Hubot to (re)load scripts without restart
//
// Commands:
//   hubot reload - Reloads scripts without restart. Loads new scripts too.
//   hubot command count - Tells how many commands hubot knows
//
// Author:
//   leathan & spajus

(function() {
  var Fs, Path, oldCommands, oldListeners, reloadAllScripts;
  Fs = require('fs');
  Path = require('path');
  oldCommands = oldListeners = null;

  module.exports = bot => {
    bot.respond(/.*command count.*/i, msg => {
      msg.send("I am aware of " + msg.bot.commands.length + " commands.")
    });
    bot.respond(/reload$/i, msg => {
      oldCommands = bot.commands;
      oldListeners = bot.listeners;
      bot.commands = [];
      bot.listeners = [];
      reloadAllScripts(msg)
    })
  };
  reloadAllScripts = msg => {
    var scripts, bot;
    bot = msg.bot;
    bot.events._events = {}
    bot.middleware.listener.stack = [];
    bot.middleware.response.stack = [];
    bot.middleware.receiver.stack = [];
    bot.load(Path.resolve(".", "scripts"));
    bot.load(Path.resolve(".", "src", "scripts"));
    try {
      Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
        bot.loadExternalScripts(JSON.parse(res))
      })
    } catch(e) {
      msg.send("Error loading external-scripts.json " + e)
    }
    msg.send("Reloaded all scripts.")
  }
}).call(this);
