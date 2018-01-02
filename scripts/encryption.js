// Description:
//   Encrypts a message to a users using their public key.
//
// Commands:
//   mubot encrypt Alice hello - Encrypts the message hello using Alice's pubkey.
//

(function() {
  const secp256k1 = require('secp256k1');
  const eccrypto  = require('eccrypto');
  const crypto    = require('crypto');

  let keys;
  module.exports = bot => {
    bot.brain.on('loaded', () => {
      keys = bot.brain.data.keys || (bot.brain.data.keys = {});
    })
    bot.respond(/encrypt (<@?!?(\d+)>) (.*)/i, res => {
      if(!keys[res.message.user.id]) return res.send("Sorry, you need a base keypair first.");
      if(!keys[res.match[2]]) return res.send("Sorry, but your recipient needs a base keypair.");
      eccrypto.encrypt(Buffer(keys[res.match[2]].public), Buffer(res.match[3])).then(encrypted => res.send(res.match[1] + " " + encrypted))
    })
  }
}).call(this);
