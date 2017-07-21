var crypto = require('crypto');

var MIN_PRIVATE_KEY = new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
var MAX_PRIVATE_KEY = new Buffer('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140', 'hex');

function validatePrivateKey(privateKey) {
    var isValid = true;

    // must be at least the minimum
    if (privateKey.compare(MIN_PRIVATE_KEY) < 0) {
        isValid = false;
    }

    //must not exceed the maximum
    if (privateKey.compare(MAX_PRIVATE_KEY) > 0) {
             isValid = false;
    }

    return isValid;
}

var privateKey;

do {
    privateKey = crypto.randomBytes(32);
} while (!validatePrivateKey(privateKey));

console.log(privateKey);

var eccrypto = require('eccrypto');

var publicKey = eccrypto.getPublic(privateKey);

console.log(publicKey);


var hash = crypto.createHash('sha256').update(publicKey).digest();

hash = crypto.createHash('ripemd160').update(hash).digest();

console.log(hash);

var version = new Buffer('55', 'hex');

checksum = Buffer.concat([version, hash]);

checksum = crypto.createHash('sha256').update(checksum).digest();

checksum = crypto.createHash('sha256').update(checksum).digest();

checksum = checksum.slice(0, 4);

console.log(checksum);

var address = Buffer.concat([version, hash, checksum]);

console.log(address);

var bs58 = require('bs58');

var address = bs58.encode(address);

console.log(address);
