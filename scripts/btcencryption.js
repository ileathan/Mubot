// Description:
//   Allow connect each user with a private key for signitures and encryption.
//

const ec = require('elliptic').ec('secp256k1')
const c  = require('crypto')
const cs = require('coinstring')
module.exports = bot => {
  var  keys;


  bot.brain.on('loaded', () => {
    keys = bot.brain.data.keys || (bot.brain.data.keys = {});
delete keys['U02JGQLSQ']
delete keys['183771581829480448']
    bot.brain.save();

  })
  bot.respond(/bitmark me$/i, r => {
    if(keys[r.message.user.id]) return r.reply("you already have an associated key. To override pm me the command followed by 'overide' or your hexidecimal key.");
    ecKey     = ec.genKeyPair(); ecKey.getPublic()
    hash      = c.createHash('sha256').update((new Buffer(ecKey.pub.encode('hex'), 'hex'))).digest()
    hash      = c.createHash('ripemd160').update(hash).digest()
    version   = new Buffer('55', 'hex')
    version2   = new Buffer('D5', 'hex')
    checksum  = Buffer.concat([version, hash])
    checksum  = c.createHash('sha256').update(checksum).digest()
    checksum  = c.createHash('sha256').update(checksum).digest()
    checksum  = checksum.slice(0, 4)
    address   = require('bs58').encode(Buffer.concat([version, hash, checksum]))
    keys[r.message.user.id] = {
      private: ecKey.getPrivate().toString('hex'),
      public:  ecKey.pub.encode('hex'),
      address: address
    };
    bot.brain.save()
    r.reply('I have just set your keypair, your address is `' + address + '`.')
  })
}
