// Description:
//   Allows Hubot to (re)load scripts without restart
//
// Commands:
//   imubot reload - Reloads scripts without restart. Loads new scripts too.
//   imubot command count - Tells how many commands imubot knows
//
// Author:
//   leathan & spajus

(function() {
  var Fs, Path, reloadAllScripts;
  Fs = require('fs');
  Path = require('path');

  module.exports = bot => {

    bot.reload = () => {
      bot.middleware.listener.stack = [];
      bot.middleware.receive.stack = [];
      bot.middleware.response.stack = [];
      bot.commands = [];
      bot.listeners = [];
      bot._events = {};
      bot._eventsCount = 0;
      bot.events._events = {};
      bot.brain._events = {};
      bot.load(Path.resolve(".", "scripts"));
      bot.load(Path.resolve(".", "src", "scripts"));
      try {
        Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
          bot.loadExternalScripts(JSON.parse(res))
          return true
        })
      } catch(e) { return false }
    }

    bot.respond(/.*command count/i, msg => {
      msg.send("I am aware of " + msg.bot.commands.length + " commands.")
    });
    bot.respond(/reload$/i, msg => {
      reloadAllScripts(msg)
    })
  };

  reloadAllScripts = msg => {
    var bot = msg.bot;
    bot.middleware.listener.stack = [];
    bot.middleware.receive.stack = [];
    bot.middleware.response.stack = [];
    bot._events = {};
    bot._eventsCount = 0;
    bot.commands = [];
    bot.listeners = [];
    bot.events._events = {}
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


/*function reload() {
    const bot = bot;
    const Path = require('path');
    bot.commands = [];
    bot.listeners = [];
    bot.events._events = {}
    bot.load(Path.resolve(".", "scripts"));
    bot.load(Path.resolve(".", "src", "scripts"));
    try {
      Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
        bot.loadExternalScripts(JSON.parse(res))
        return true
      })
    } catch(e) { return false }
}
    bot.middleware.listener.stack = [];
    bot.middleware.response.stack = [];
    bot.middleware.receiver.stack = [];
*/
