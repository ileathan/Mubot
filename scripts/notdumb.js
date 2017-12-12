
module.exports = bot => {
  bot.respond(/(is|so)? ?dumb/i, msg => {
     msg.send("FUCK YOU!")
  });

};