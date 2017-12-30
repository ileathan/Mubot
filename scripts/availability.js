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
//   imubot is <user> available - Find out if the specified user is available or not
//   imubot i am <available|free|not busy|at hand|back|here> - Set that you are available - (the 'i am' is optional)
//   imubot i am <unavailable|dnd|do not disturb|busy|in the zone|away|gone|afk|brb> - Setthat you are not available - (the 'i am' is optional)
//
// Author:
//  tombell
//  leathan

(function() {
  module.exports = bot => {
    function findUser(name) {
      var users = bot.brain.usersForFuzzyName(name);
      if(users.length === 1) {
        return users[0]
      } else if(users.length > 1) {
        return users
      } else {
        return false
      }
    }
    bot.respond(/is (.*) available(\?)?/i, msg => {
      var name, user;
      name = msg.match[1];
      user = findUser(name);
      if(user && !user.length) {
        if(user.available.available) {
          msg.send(user.name + " has been available since " + user.available.timestamp)
        } else {
          msg.send(user.name + " has been unavailable since " + user.available.timestamp)
        }
      } else if(user.length) {
        msg.send("I found " + user.length + " people named " + name)
      } else {
        msg.send("I have never met " + name)
      }
    });
    bot.respond(/(?:i am )?(?:available|free|not busy|at hand|back|here)/i, msg => {
      var name, user;
      name = msg.message.user.name;
      user = findUser(name);
      if(user && !user.length) {
        user.available = { available: true, timestamp: new Date };
        msg.reply("Okay, I have set you as available");
      } else if(user.length) {
        msg.send("I found " + user.length + " people named " + name)
      } else {
        msg.send("I have never met " + name)
      }
    });
    bot.respond(/(?:i am )?(?:unavailable|dnd|do not disturb|busy|in the zone|away|gone|afk|brb)/i, msg => {
      var name, user;
      name = msg.message.user.name;
      user = findUser(name);
      if(user && !user.length) {
        user.available = { available: false, timestamp: new Date };
        msg.reply("Okay, I have set you as unavailable")
      } else if(user.length) {
        msg.send("I found " + user.length + " people named " + name)
      } else {
        msg.send("I have never met " + name)
      }
    })
  }
}).call(this);
