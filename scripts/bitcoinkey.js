// Description:
//   Returns a secp256k1 compatible private key.
//
// Commands:
//   mubot btc me - Returns private key.
//
// Author:
//   leathan
//
// Depenencies:
//   crypto (should be preinstalled)
//
var crypto = require('crypto');
// Pulled directly from the secp256k1 ECDSA specification on private key lengths.
var MIN = new Buffer('FFF0000000000000000000000000000000000000000000000000000000000001', 'hex');
var MAX = new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140', 'hex');

const x = _ => !(_.compare(MIN) < 0) && !(_.compare(MAX) > 0)?_:x(crypto.randomBytes(32))

module.exports = b => b.respond(/btc(?: key)? me$/i, r => r.send(x(crypto.randomBytes(32)).toString('hex')))
