// Description:
//   Allows Hubot to (re)load scripts without restart
//
// Commands:
//   hubot reload all scripts - Reloads scripts without restart. Loads new scripts too.
//   hubot command count - Tells how many commands hubot knows
//
// Author:
//   leathan & spajus

(function() {
  var Fs, Path, oldCommands, oldListeners, reloadAllScripts;
  Fs = require('fs');
  Path = require('path');
  oldCommands = oldListeners = null;

  module.exports = function(robot) {
    robot.respond(/.*command count.*/i, function(msg) {
      msg.send("I am aware of " + msg.robot.commands.length + " commands.");
    });
    robot.respond(/reload$/i, function(msg) {
      oldCommands = robot.commands;
      oldListeners = robot.listeners;
      robot.commands = [];
      robot.listeners = [];
      reloadAllScripts(msg);
    });
  };
  reloadAllScripts = function(msg) {
    var scripts, robot = msg.robot;
    robot.events._events = {}
    try {
      robot.middleware.listener.stack = []
      robot.middleware.response.stack = []
      robot.middleware.receiver.stack = []
    } catch(e) {}
    robot.load(Path.resolve(".", "scripts"));
    robot.load(Path.resolve(".", "src", "scripts"));
    try {
      Fs.readFile(Path.resolve(".", "external-scripts.json"), (err, res) => {
        robot.loadExternalScripts(JSON.parse(res))
      })
    } catch(e) { msg.send("Error loading external-scripts.json " + e) }
    msg.send("Reloaded all scripts.");
  };
}).call(this);
