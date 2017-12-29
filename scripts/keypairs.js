// Description:
//   Allow connecting each user with a private key for signitures and encryption.
//
// Commands:
//   hubot crypto me [coin] - creates a basekeypair, or extends that pair (seeds a coin keypair).
//
// Author:
//   leathan
//
(function(){
  var keys, cryptoMe, createMe, versionMe, importKeyToWallet,
        c = require('crypto'), ecc  = require('eccrypto'), cs = require('coinstring'), bs58 = require('bs58'),
        CK = require('coinkey'), secp = require('secp256k1'), exec = require('child_process').exec;

  // Verifies that the private key is on the secp2456k1 curve (valid bitcoin key)
  const x = _ => !(_.compare((new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex'))) < 0)
              && !(_.compare((new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140', 'hex'))) > 0)
                 ? _
            : x(c.randomBytes(32)) ;

  module.exports = bot => {
    bot.brain.on('loaded', () => {
      keys = bot.brain.data.keys || (bot.brain.data.keys = {});
    })
    bot.respond(/(?:priv(?:ate)? )?key me ?(.+)?$/i, res => {
      const userID = res.message.user.id;
      if(!res.match[1] && keys[userID]) return res.send("You already have a keypair.");
      if(!res.match[1]) return res.send(createMe(userID, res));
      const coin = res.match[1].toLowerCase();
      if(!keys[userID] && res.match[1]) return res.send(createMe(userID, res) + "\n" +  cryptoMe(userID, coin,  res));
      if(!keys[userID]) return res.send(createMe(userID, res))
      if(keys[userID][coin]) return res.send("You already have a " + coin +  " keypair.")
      res.send(cryptoMe(userID, coin, res))
    })
    bot.on('createMeEvent', (userID, res) => {
      createMe(userID, res);
    })
    bot.on('cryptoMeEvent', (userID, coin, res, balance) => {
      cryptoMe(userID, coin, res, balance);
    })
  }
  cryptoMe = (userID, version, balance, res) => {
    var vByte, ck, importKey;
    if(!(vByte = versionMe(version))) return "Sorry but thats not a valid coin."
    importKey = cs.encode(Buffer.concat([new Buffer(keys[userID].private), new Buffer('01', 'hex')]), vByte);
    ck = CK.fromWif(importKey);
    if(!keys['_'+version]) keys['_'+version] = []
    keys['_'+version].push(ck.publicAddress, userID)
    keys[userID][version] = {
      address: ck.publicAddress,
      importKey: importKey,
      balance: balance || 0,
      txids: []
    };
    res.bot.brain.save()
    importKeyToWallet(importKey)
    return 'Done, your address is `' + ck.publicAddress + '`.'
  }
  importKeyToWallet = importKey => {
    exec('bitmarkd importprivkey ' + importKey, (err, stdout, stderr) => {
      if(err || stderr) console.log("Error importing private key" + (err || stderr));
    })
  }
  versionMe = version => {
    switch(version) {
      case 'bitmark':
        return 0xD5;
      default:
        return 0x80;
    }
  }
  createMe = (userID, res) => {
    keys[userID] = {
      private: x(c.randomBytes(32)),
      get public() { return ecc.getPublic(this.private) }
    }
    res.bot.brain.save()
    return "Base keypair created, you may encrypt, sign, or generate coin addresses."
  }
}).call(this)
// Old code, less dependencies.
//publicKey = secp.publicKeyCreate(privKey, true)  // true => isCompressed
//buffer = c.createHash('sha256').update(publicKey).digest()
//paytoPublicKeyHash = c.createHash('ripemd160').update(hash).digest()
//version   = new Buffer('55', 'hex')
//buffer  = Buffer.concat([version, hash])
//buffer  = c.createHash('sha256').update(checksum).digest()
//buffer  = c.createHash('sha256').update(checksum).digest()
//checksum  = buffer.slice(0, 4)
//address   = bs58.encode(Buffer.concat([version, hash, checksum]))

//privPlusVersion = new Buffer('d5' + ecKey.getPrivate().toString('hex') + '01', 'hex')
//buffer     = c.createHash('sha256').update(privPlusVersion).digest()
//buffer     = c.createHash('sha256').update(hash).digest()
//checksum   = buffer.slice(0, 4)
//importKey  = bs58.encode(Buffer.concat([privPlusVersion, checksum]))
