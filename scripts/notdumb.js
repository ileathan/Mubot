
// notdumb.js

module.exports = bot => {
  bot.hear(/^mubot\s+(is |so )[\S\s]*dumb/i, msg => {
     msg.send("FUCK YOU!")
  });

};