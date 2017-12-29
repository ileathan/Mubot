// Description:
//   return room/user id from adapter.
//
// Commands:
//   Mubot get room id
//   Mubot get my id
//
// Author:
//   leathan
//
module.exports = bot => {

  bot.respond(/(get )?room( id)?$/i, msg => msg.send("Current room id: " + msg.message.room));

  bot.respond(/(get )?(user |my )?id$/i, msg => msg.send("Your user id: " + msg.message.user.id));

  bot.respond(/(get )?(user )?id (.+)$/i, msg => {
    var name = msg.match[3];
    var user = bot.brain.userForName(name);
    user ?
      msg.send(name + " user id: " +  user.id)
    :
      msg.send("No user found.");
  })
  ;
  bot.respond(/(get )?(user )? id <@?!?(\d+)>$/i, msg => msg.send(
    bot.brain.userForId(msg.match[3]).name
    + "user id: " +
    msg.match[3]
  ))
  ;
  bot.respond(/(get )?(user )?ids (.+)$/i, msg => msg.send(
    msg.match[3]
    + " matches ids: " +
    bot.brain.usersForFuzzyName(msg.match[3]).map(_=>_.id).join(', ')
  ))
  ;
}
