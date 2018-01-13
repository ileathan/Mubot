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
    if(msg.match[3][0] === "<") {
      msg.send(msg.match[3].slice(2, -1))
    } else {
      let user = bot.brain.userForName(msg.match[3]);
      msg.send(user ? user.id : "No user found.");
    }
  })
  ;
  bot.respond(/(get )?(user )?ids (.+)$/i, msg => msg.send(
    msg.match[3]
    + " matches ids: " +
    bot.brain.usersForFuzzyName(msg.match[3]).map(_=>_.id).join(', ')
  ))
  ;
}
