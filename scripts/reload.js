// Description:
//   Allows Hubot to (re)load scripts without restart
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot reload all scripts - Reloads scripts without restart. Loads new scripts too.
//   hubot command count - Tells how many commands hubot knows
//
// Author:
//   spajus

(function() {
  var Fs, Path, oldCommands, oldListeners, reloadAllScripts, success;

  Fs = require('fs');

  Path = require('path');

  oldCommands = null;

  oldListeners = null;

  module.exports = function(robot) {
    robot.respond(/.*command count.*/i, function(msg) {
      return msg.send("I am aware of " + msg.robot.commands.length + " commands.");
    });
    return robot.respond(/reload$/i, function(msg) {
      var error;
      try {
        oldCommands = robot.commands;
        oldListeners = robot.listeners;
        robot.commands = [];
        robot.listeners = [];
        return reloadAllScripts(msg, success, function(err) {
          return msg.send(err);
        });
      } catch (error1) {
        error = error1;
        console.log("Hubot reloader:", error);
        return msg.send("Could not reload all scripts: " + error);
      }
    });
  };

  success = function(msg) {
    var i, len, listener;
    for (i = 0, len = oldListeners.length; i < len; i++) {
      listener = oldListeners[i];
      listener = {};
    }
    oldListeners = null;
    oldCommands = null;
    return msg.send("Reloaded all scripts.");
  };

  reloadAllScripts = function(msg, success, error) {
    var unapppendedEvents, externalScripts, hubotScripts, robot, scriptsPath;
    robot = msg.robot;
    unappendedEvents = Object.assign({}, robot.events._events);

    robot.emit('reload_scripts');
    scriptsPath = Path.resolve(".", "scripts");
    robot.load(scriptsPath);
    scriptsPath = Path.resolve(".", "src", "scripts");
    robot.load(scriptsPath);
    hubotScripts = Path.resolve(".", "hubot-scripts.json");
    Fs.exists(hubotScripts, function(exists) {
      if (exists) {
        return Fs.readFile(hubotScripts, function(err, data) {
          var scripts;
          if (data.length > 0) {
            try {
              scripts = JSON.parse(data);
              scriptsPath = Path.resolve("node_modules", "hubot-scripts", "src", "scripts");
              return robot.loadHubotScripts(scriptsPath, scripts);
            } catch (error1) {
              err = error1;
              error("Error parsing JSON data from hubot-scripts.json: " + err);
            }
          }
        });
      }
    });
    externalScripts = Path.resolve(".", "external-scripts.json");
    Fs.exists(externalScripts, function(exists) {
      if (exists) {
        return Fs.readFile(externalScripts, function(err, data) {
          var scripts;
          if (data.length > 0) {
            try {
              scripts = JSON.parse(data);
              //scripts.splice(0, 1) // REMOVES THE FIRST SCRIPT (hubot-server)
            } catch (error1) {
              err = error1;
              error("Error parsing JSON data from external-scripts.json: " + err);
            }
            robot.loadExternalScripts(scripts);
          }
        });
      }
    });
    robot.events._events = unappendedEvents
    return success(msg);
  };

}).call(this);
