// Description:
//   Set your availability status so people know whether they're able to come
//   over and chat with you or ping you over IM.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot is <user> available - Find out if the specified user is available or not
//   hubot i am <available|free|not busy|at hand|back|here> - Set that you are available - (the 'i am' is optional)
//   hubot i am <unavailable|dnd|do not disturb|busy|in the zone|away|gone|afk|brb> - Setthat you are not available - (the 'i am' is optional)
//
// Author:
//  tombell or leathan

(function() {
  module.exports = function(robot) {
    var findUser;
    findUser = function(name) {
      var users;
      users = robot.brain.usersForFuzzyName(name);
      if (users.length === 1) {
        return users[0];
      } else if (users.length > 1) {
        return users;
      } else {
        return false;
      }
    };
    robot.respond(/is (.*) available(\?)?/i, function(msg) {
      var name, user;
      name = msg.match[1];
      user = findUser(name);
      if (typeof user === 'object') {
        if (user.available.available) {
          return msg.send(user.name + " has been available since " + user.available.timestamp);
        } else {
          return msg.send(user.name + " has been unavailable since " + user.available.timestamp);
        }
      } else if (typeof user.length > 1) {
        return msg.send("I found " + user.length + " people named " + name);
      } else {
        return msg.send("I have never met " + name);
      }
    });
    robot.respond(/((i am ))?(available|free|not busy|at hand|back|here)/i, function(msg) {
      var name, user;
      name = msg.message.user.name;
      user = findUser(name);
      if (typeof user === 'object') {
        user.available = {
          available: true,
          timestamp: new Date
        };
        return msg.reply("Okay, I have set you as available");
      } else if (typeof user.length > 1) {
        return msg.send("I found " + user.length + " people named " + name);
      } else {
        return msg.send("I have never met " + name);
      }
    });
    return robot.respond(/((i am ))? (unavailable|dnd|do not disturb|busy|in the zone|away|gone|afk|brb)/i, function(msg) {
      var name, user;
      name = msg.message.user.name;
      user = findUser(name);
      if (typeof user === 'object') {
        user.available = {
          available: false,
          timestamp: new Date
        };
        return msg.reply("Okay, I have set you as unavailable");
      } else if (typeof user.length > 1) {
        return msg.send("I found " + user.length + " people named " + name);
      } else {
        return msg.send("I have never met " + name);
      }
    });
  };

}).call(this);
