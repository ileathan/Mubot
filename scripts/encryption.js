(function() {
  const secp256k1 = require('secp256k1');
  const eccrypto  = require('eccrypto');
  const crypto    = require('crypto');

  module.exports = bot => {
    bot.brain.on('loaded', () => {
      keys = bot.brain.data.keys || (bot.brain.data.keys = {});
    })
    bot.respond(/encrypt (<@?!?(\d+)>) (.*)/i, res => {
      if(!keys[res.message.user.id]) return res.send("Sorry, you need a base keypair first.")
      receiver = bot.brain.userForId(res.match[2]);
      if(!receiver) return res.send("Sorry, I cant find that user.")
      if(!keys[receiver]) return res.send("Sorry, but your recipient needs a base keypair.")
      eccrypto.encrypt(keys[receiver].public, Buffer(msg.match[3])).then(encrypted => res.send(res.match[1] + " " + encrypted))
    })

  }
}).call(this);
