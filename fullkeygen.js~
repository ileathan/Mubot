var t, r, publicKey, hash, checksum, address, privateKey, crypto, eccrypto
crypto = require('crypto');
eccrypto  = require('eccrypto')

t = _ => _.toString('hex')
r = _ => !(_.compare((new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex'))) < 0)
      && !(_.compare((new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140', 'hex'))) > 0)
         ? _
    : r(crypto.randomBytes(32)) ;

if (typeof process.argv == 'undefined' || typeof process.argv[2] == 'undefined') {
  privateKey = r(crypto.randomBytes(32))
}
else if(process.argv[2] == 'private') {
  console.log("privkey is")
  console.log(r(crypto.randomBytse(32)))
  process.exit(0)
}
else if(process.argv[2].length == 61) {
  privateKey = new Buffer(process.argv[2], 'hex')
  console.log("using privkey " + privateKey.toString('hex'))
}

publicKey = eccrypto.getPublic(privateKey)
hash      = crypto.createHash('sha256').update(publicKey).digest()
hash      = crypto.createHash('ripemd160').update(hash).digest()
checksum  = Buffer.concat([(version = new Buffer('00', 'hex')), hash])
checksum  = crypto.createHash('sha256').update(checksum).digest()
checksum  = crypto.createHash('sha256').update(checksum).digest()
checksum  = checksum.slice(0, 4)
address   = require('bs58').encode(Buffer.concat([version, hash, checksum]))

console.log(['privateKey', 'hash', 'version', 'checksum', 'address', 'publicKey'])
console.log([t(privateKey), t(hash), t(version), t(checksum), t(address), t(publicKey)])

//EC = require("elliptic").ec;
//ec = new EC("secp256k1");
//shaMsg = crypto.createHash("sha256").update("leathan").digest();
//mySign = ec.sign(shaMsg, privateKey, {canonical: true});
//console.log(shaMsg, privateKey)
//console.log(mySign)
