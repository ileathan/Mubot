
// Description:
//   Miner/gambler servers
//
// Commands:
//   None.
//
// Author:
//   leathan
//
(function(){
const DEBUG = 1;
const qrcode = require('qrcode');
const TFA = require('speakeasy');
const STRATUM_API_ENDPOINT = 'https://localhost:3000/stats';
const STRATUM_ENDPOINTS = ['/gambler/api/:jobid/:result/:nonce/:hash', '/0/api/:jobid/:result/:nonce/:hash'];
const SERVER_ROOT = '/../node_modules/hubot-server/public/io.html';
const DATABASE_ENDPOINT = 'mongodb://localhost/gambler-api';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.slice(0, 32);
const SECRET = process.env.SECRET;
// As is, these route back to the referal 0, I will change this to the seed 20 users.
const LEGACY_ENDPOINTS = ['/chat', '/miner', '/gamble'];
// Save every users socket, by user.
const USERS_INFO = {}, USER_BY_COOKIE = {}, USER_SOCKETS = {}; USER_TFA_CHECKS = {};
const request      = require('request');            // Easy http requests.
const exec	       = require('child_process').exec; // Used to access monero daemon.
const mongoose     = require('mongoose');           // Our db.
const path         = require('path');               // OS independant path resolves.
const crypto       = require('crypto');             // For encryption.
const argonp       = require('argon2-ffi').argon2i; // Our password hash algo.
// Infinite base encoder I made and maintain.
const c            = require('encode-x')();
// $argon2i$v=19$m=7777,t=77,p=77$user.date + crypto.randomBytes + $ + hash
// Memory cost 7777 KiB (1024*7777), relative time cost, and the number of threads sustained and concurrent threads needed.
const ARGON_PCONF = { parallelism: 77, memoryCost: 7777, timeCost: 77 };

// Our salter.
Object.defineProperty(crypto, 'salt', { get: ()=>crypto.randomBytes(77) });
// Begin mongoose schematic configuration.
mongoose.Promise = global.Promise;
const conn = mongoose.createConnection(DATABASE_ENDPOINT);
const SharesFoundSchema = new mongoose.Schema({
 	'hashes': String,
 	'hashesPerSecond': String,
 	'miner': String,
 	'jobid': String,
 	'result': String,
 	'nonce': String,
 	'date': { type: Date, default: Date.now }
});
const TransactionsSchema = new mongoose.Schema({
 	'from': String,
 	'to': String,
 	'amount': Number,
 	'type': String,
 	'date': { type: Date, default: Date.now }
});
const ChatMessagesSchema = new mongoose.Schema({
 	'username': String,
 	'message': String,
 	'date': { type: Date, default: Date.now }
});
const UsersSchema = new mongoose.Schema({
 	'username': String,
 	'loginCookies': Array,
 	'password': String,
  'tfa': Boolean,
 	'wallet': String,
 	'balance': { type: Number, default: 0 },
 	'ref': Number,
 	'isMiningFor': String,
 	'refPayments': { type: Number, default: 0 },
 	'refPaymentsReceived': { type: Number, default: 0 },
 	'minedPayments': { type: Number, default: 0 },
 	'minedPaymentsReceived': { type: Number, default: 0 },
 	'id': Number,
 	'shares': { type: Number, default: 0 },
 	'sharesFound': { type: Number, default: 0 },
 	'miningConfig': Object,
 	'date': { type: Date, default: Date.now }
});
// Beautiful hack to allow hotreloading.
const SharesFound = conn.models.SharesFound || conn.model('SharesFound', SharesFoundSchema);
const Transactions = conn.models.Transactions || conn.model('Transactions', TransactionsSchema);
const ChatMessages = conn.models.ChatMessages || conn.model('ChatMessages', ChatMessagesSchema);
const Users = conn.models.Users || conn.model('Users', UsersSchema);
//
//
// Get and ensure minimal security.
if(!SECRET) { throw new Error("Need to pass in a SECRET `SECRET=\"someverylongsafesecret\" mubot`") }
if(!ENCRYPTION_KEY) { throw new Error("Need to pass in an ENCRYPTION_KEY `ENCRYPTION_KEY=\"someverylongsafekey\"`") }
if(ENCRYPTION_KEY.length < 32) { throw new Error("Need to make your ENCRYPTION_KEY longer. (Min: 32chars)") }
if(SECRET.length < 32) { throw new Error("Need to make your SECRET longer. (Min: 32chars)") }
// Current AES keys must be at most 256 bytes (32 characters)
function encrypt(text) {
  if(text === null) return;
  // For AES, this is always 16.
  var salt = crypto.randomBytes(16);
  // Open AES encryption stream.
  var cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), salt);
  var encrypted = cipher.update(text);
  // Close the stream and update encrypted.
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Return buffers as hex strings.
  return Buffer.concat([salt, encrypted]).toString('hex');
}
function decrypt(text) {
  try {
    var salt = Buffer.from(text.substring(0, 32), 'hex');
    var encrypted = Buffer.from(text.substring(32), 'hex');
    var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), salt);
    var decrypted = decipher.update(encrypted);
    // Close the stream and updated decrepted.
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // return UTF8 buffer as string
    return decrypted.toString()
  } catch(e) {
    return null;
  }
}
// Our very own home baked encoders.
function encode(data) { return c.from16To64(data) }
function decode(data) { return c.from64To16(data) }
// Static salts
function ssalt(data) { return '7' + data + SECRET }
// Dynamic salts.
function dsalt(data) {
  let seed_salt = crypto.salt;
  let date_salt = Buffer.from(data.date.getTime().toString(16));
  return Buffer.concat([seed_salt, date_salt]);
}
// For debugging.
global.Users = Users;
// Load logged in users into memory.
Users.find({}, (e, users) => {
  for(let i = 0, l = users.length; i<l; ++i) {
    var user = users[i].toJSON();
    delete user.password; delete user._id; delete user.__v;
    for(let i = 0, l = user.loginCookies ? user.loginCookies.length : 0; i<l; ++i) {
      let cookie = user.loginCookies[i];
      let c = decrypt(decode(cookie)).slice(0, 32);
      USER_BY_COOKIE[c] = user.username;
      USERS_INFO[user.username] = user;
      if(DEBUG) {
        console.log("Added cookie to mem from db: " + c.slice(0, 32));
      }
    }
    if(USERS_INFO[user.username])
      delete USERS_INFO[user.username].loginCookies;
  }
})
// Begin exports.
module.exports = bot => {
  // keep track of our unlogged in users
  var guests = 0;

  const io = bot.io.of('/0');

  console.log("io loaded on global.io for developement.");
  global.io = io;

  bot.router.get(LEGACY_ENDPOINTS, (req, res) => res.sendFile(path.join(__dirname+SERVER_ROOT)));

  bot.router.get('/:number/', (req, res, next) => {
      if(/[^0-9]/.test(req.params.number)) return next()
      if(req.cookies && !req.cookies.ref) res.cookie('ref', req.params.number)
      res.sendFile(path.join(__dirname + SERVER_ROOT))
  })
  bot.router.get(STRATUM_ENDPOINTS, (req, res) => {
    // Close the connection immediatly, so client doesnt wait.
    res.end(0);
    // Verify that the hash is not fabricated.
    for(let param in req.params) req.params[param] = decodeURIComponent(req.params[param]);
    // This is coming from local host, and always should be, so the verification is not
    // needed. so argonp is used for data hashing and no salts.
    argonp.verify(req.params.hash, req.params.jobid + req.params.result + req.params.nonce + SECRET).then(correct => {

     if(correct) SharesFound.findOne({result: req.params.result}, (err, share) => {
       if(!share) SharesFound.create(req.params, (err, share) => void 0);
     })

    }, incorrect => console.log("HASH AUTHENTICATION FAILURE!"));
  })
  io.on('connection', socket => {
   isLoggedIn(socket, (username, cookie) => {
      socket.on('whoami', (_, callback) => {
       //Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => {
          //SharesFound.count({}, function(err, count) {
            request({uri: STRATUM_API_ENDPOINT, strictSSL: false}, (err, res, stats)=> {
              stats = JSON.parse(stats);
              // temporary fix - remove hardcoded 9500 later, conservativly update the total again.
              //stats.total_hashes = count + 9500;
              ChatMessages.find({}, {_id: 0, __v: 0}).sort({'date': -1}).limit(20).exec((err, chatMsgs)=> {
                if(username) {
                  let userRegex = new RegExp('^' + username + '$', 'i');
                  Transactions.find({ $or:[ {from: userRegex}, {to: userRegex} ]}, {_id: 0, __v: 0}, (err, trans) => {
                    callback(Object.assign({}, USERS_INFO[username], {chatMsgs: chatMsgs.reverse(), transactions: trans, users: USERS_INFO}))
                  });
                }
                else {
                  //++guests;
                  let user = encrypt(socket.handshake.address).toString().slice(0, 8); //.split(':').pop()
                  USERS_INFO['_'+user] = {username: 'Guest #' + ++guests, shares: 0, balance: 0};
                  callback(Object.assign({}, USERS_INFO['_'+user], {chatMsgs: chatMsgs.reverse(), transactions: [], users: USERS_INFO}));
                }
              })
            })
          //})
        //})
      });
      // Client is sending a new chat message.
      socket.on("chat message", msg => {
        username = username || USERS_INFO[encrypt(socket.handshake.address)] && USERS_INFO[socket.handshake.address].username || "Guest Hacker";
        io.emit("chat message", (username || "Guest User") + ": " + msg)
        ChatMessages.create({username: username || "Guest User", message: msg}, ()=>{})
      })
      socket.on("share found", (data, callback) => shareFound(username, data, callback));
      // Logged in users only API
      if(!username) return; // Its a guest, dont allow entry.
      socket.on("work log", callback => {
        sharesFound.find({miner: new RegExp('^' + username + '$', 'i')}, (err, shares) => {
          if(!shares) callback(false, "No work log history.");
          else callback(shares, null)
        })
      })
      socket.on("transfer log", callback => {
        Transactions.find({from: new RegExp('^' + username + '$', 'i')}, (err, trans) => {
          if(!trans) callback(false, "No transfer history.");
          else callback(trans, null)
        })
      })
      socket.on("mine for user", (user, callback) => {
        if(user) {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $set: {'isMiningFor': user} }, (err, user0) => {
            if(user0) USERS_INFO[username].isMiningFor = user;
            callback(!!user0, err || !user0 && "User not found")
          })
        } else {
          delete USERS_INFO[username].isMiningFor;
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'isMiningFor': 1} }, (err, user) => callback(!!user, err))
        }
      })
      socket.on("update mining configuration", (config, callback) => {
        if(config) {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $set: {'miningConfig': config} }, (err, user) => {
            if(user) USERS_INFO[username].miningConfig = config;
              callback(!!user, err)
          })
        } else {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'miningConfig': 1} }, (err, user) => {
            if(user) delete USERS_INFO[username].miningConfig;
            callback(!!user, err)
          })
        }
      })
      socket.on("transfer", transferShares.bind(username))
      socket.on("log out", ()=>logout(username, cookie));
      // debuging
      global.sock = socket;
      // debuging end
      socket.on("enable tfa", (_, callback) => {
        // debuging
        console.log("Got request to enable tfa by " + username);
        // debuging end
        var tfa = TFA.generateSecret({length: 37});
        var token = TFA.totp({secret: tfa.base32, encoding: 'base32' });
        qrcode.toDataURL(tfa.secret, (err, tfa_url) => {
          // debuging
          console.log("That request yeilded " + err || username);
          // debuging end
          callback(err || tfa_url) //'<img src="' + tfa_url + '">'
        })
      })
      socket.on("verify tfa", (tfa_token, callaback) => {
        // debuging
        console.log("Got request to verify tfa " + tfa_token);
        // debuging end
        if(TFA_CHECKS[username]) {
          TFA.totp.verify({secret: tfa.base32, encoding: 'base32', token: tfa_token}) ? callback(true)
            : callback(false, "Incorrect code")
        } else {
          callback(false, "Enable 2FA first.")
        }
      })
    })
    socket.on('server stats', (_, callback) => {
      Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => {
         SharesFound.count({}, (err, count) => {
           request({uri: STRATUM_API_ENDPOINT, strictSSL: false}, (err, res, stats) => {
             stats = JSON.parse(stats);
             stats.total_hashes = stats.total_hashes|0 + count;
console.log(stats) 
            callback(users, stats)
          })
        })
      })
    });
    // Client is checking to see if a username is available.
    socket.on("check username", (username, callback) => {
      Users.findOne({username: new RegExp('^' + username + '$', 'i') }, (err, user) => {
        if(err) return next(err);
        callback(Boolean(!user));
      })
    })
    socket.on("log in", (logindata, callback) => {
      Users.findOne({'username': new RegExp('^' + logindata.username + '$', 'i')},  (err, user) => {
        if(!user) return callback(false, "No such user.")
        console.log("log in attempt from " + user.username)
        argonp.verify(decrypt(decode(user.password)), ssalt(logindata.password), ARGON_PCONF).then(correct => {
          if(!correct) return callback(false, "Password authentication failure");
          // Create new password hash.
          argonp.hash(ssalt(logindata.password), dsalt(user), ARGON_PCONF).then(new_phash => {
            logindata.password = null;
            // Create new login cookie.
            var cookie = crypto.randomBytes(777).toString('hex');
            var enc_cookie = encode(encrypt(cookie));
            Users.findOneAndUpdate({'username': user.username}, {$set: {password: encode(encrypt(new_phash))  }, $push: {loginCookies: enc_cookie}},  (err, user) => {
              callback(user ? encode(cookie) : false)
              DEBOG && console.log("Login attempt from " + user.username + " successfull, handed them cookie: " + cookie.slice(0,32));
              DEBUG && console.log("Stored on db as " + enc_stopcookie.slice(0,32));
              //io.emit('user logged in', user);
              USER_BY_COOKIE[cookie.slice(0, 32)] = user.username;
              USERS_INFO[user.username] = user.toJSON();
              delete USERS_INFO[user.username].loginCookies;
              delete USERS_INFO[user.username]._iv;
              delete USERS_INFO[user.username].__v;
              USER_SOCKETS[user.username] = socket;
            })
          })
        })
      })
    })
    socket.on("create account", (acntdata, callback) => {
      if(!acntdata.username || acntdata.username === 'false' || /^_|[^a-zA-Z0-9_]/.test(acntdata.username)) return callback({error: 'Illegal name, try again.'});
      acntdata.date = Date.now();
      Users.findOne({username: new RegExp('^' + acntdata.username + '$', 'i') }, (err, user) => {
        if(user) callback({error: 'Username already exists.'});
        else {
          argonp.hash(ssalt(acntdata.password), dsalt(acntdata), ARGON_PCONF).then(pass_hash => {
            acntdata.password = encode(encrypt(pass_hash));
            var cookie = crypto.randomBytes(777).toString('hex');
            exec('echo monerod getnewaddress', (error, stdout) => {
              // acntdata.password = acntdata.password.replace(/\\/g, '\\\\');
              Users.count({}, function(err, count) {
                if(err || !count) return callback({error: "Internal server error (counting users) " + err});
                acntdata.id = count;
                if(acntdata.id > 20) acntdata.ref = acntdata.ref || 0;
                else delete acntdata.ref;
                acntdata.loginCookies = [ encode(encrypt(cookie)) ];
                Users.create(acntdata, err => {
                  if(err) callback({error: "Internal server error (creating account) " + err});
                  else callback(encode(cookie));
                })
              })
            })
          }).catch(err => callback({error: "Internal server error (hashing password) " + err}))
        }
      })
    })
  })
};
function transferShares(data, callback) {
  var username = this;
  if(USERS_INFO[username].tfa) {
    if(!USERS_INFO[username]._verified) return callback(false, "Enter 2FA code.");
    else delete USERS_INFO[username]._verified
  }
  if(data) {
    let toUser = data.username;
    let amount = data.amount;
    if(!Number(amount) && (!toUser || toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser))) return callback(false, "Amount / User invalid.");
    if(!Number(amount)) return callback(false, "Amount wasnt a number.");
    if(toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser)) return callback(false, "Not a valid name.");
    if(USERS_INFO[username].shares < amount) return callback(false, "Not enough funds.");
    Users.findOneAndUpdate({username: new RegExp('^' + toUser + '$', 'i')}, { $inc: {'shares': amount} }, (err, user) => {
      if(!user) return callback(false, "Username not found.");
        Transactions.create({from: username, to: toUser, type: 'transfer', amount: amount}, ()=>{})
        if(USERS_INFO[user.username]) {
          USERS_INFO[user.username].shares += amount;
          USER_SOCKETS[user.username].emit("transfer payment", amount, username);
        }
        USERS_INFO[username].shares -= amount;
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $inc: {'shares': -amount} }, (err, user) => {
        if(!user) {
          console.log("CRITICAL ERROR!! PAYMENT SENT BUT BALANCE NOT DEDUCTED!" + err);
          callback(true, "CRITICAL ERROR")
        } else {
          callback(true, null)
        }
      })
    })
  } else {
    callback(false, "No data provided.")
  }
}
function logout(user, remove_cookie) {
  if(!user && !current_cookie) return;
    Users.findOne({username: new RegExp('^' + user + '$', 'i')}, (err, user) => {
    cl = user.loginCookies.length;
    cookies = user.loginCookies;
    while(cl--) {
      let cookie = decrypt(decode(cookies[cl]));
      if(cookie.slice(0, 32) === remove_cookie) remove_cookie = cookies[cl];
    }
    Users.findOneAndUpdate({username: new RegExp('^' + user + '$', 'i')}, {$pull: {loginCookies: remove_cookie }}, (err, user) => {
      delete USER_BY_COOKIE[remove_cookie];
      delete USERS_INFO[user];
      delete USER_SOCKETS[user];
      // {projection: {username: 0, _id: 0}}, (err, user) => {
      //USER_SOCKETS[user].broadcast.emit('user logged out', user);
    })
  })
}
function shareFound(username, user, callback) {
  if(!username) return callback(false, "No username provided")
  SharesFound.findOneAndUpdate({result: user.result}, {$set:{miner: username,mined_for: user.mineForUser || '_self',hashes: user.hashes,hashesPerSecond: user.hashesPerSecond}},(err,share)=>{
    if(err || !share) return callback(false, err || "Share not found");
    var needs_to_pay = false;
    var myuser = USERS_INFO[username];
    ++myuser.sharesFound;
    if(myuser.ref != null && !myuser.refPayments) needs_to_pay = true;
    else if(myuser.ref != null && myuser.refPayments / myuser.sharesFound < .03) needs_to_pay = true;
    if(needs_to_pay) {
      Users.findOneAndUpdate({'id': myuser.ref }, {$inc: {'shares': 1, 'refPaymentsReceived': 1 } }, (err, userBeingPaid) => {
        if(err || !userBeingPaid) return callback(false, err || "User being paid via ref not found.");
        Transactions.create({from: username, to: userBeingPaid.username, type: 'ref', amount: 1}, ()=>{})
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'refPayments': 1, 'sharesFound': 1 } }, ()=>{})
        if(USERS_INFO[userBeingPaid.username]) {
          ++USERS_INFO[userBeingPaid.username].shares;
          ++USERS_INFO[userBeingPaid.username].refPaymentsReceived
          USER_SOCKETS[userBeingPaid.username].emit("ref payment", username);
        }
        ++myuser.refPayments;
        callback(userBeingPaid.username, null)
      })
    } else if(user.mineForUser) {
      Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'sharesFound': 1, 'minedPayments': 1 } }, (err, user) => {
        if(err || !user) return callback(false, err || "Error user not found.");
        Users.findOneAndUpdate({username: new RegExp('^' + user.mineForUser + '$', 'i') }, {$inc: {'shares': 1, 'minedPaymentsReceived': 1 } }, (err, userBeingPaid)=>{
          if(err || !userBeingPaid) return callback(false, err || "User being paid via mining not found.");
          Transactions.create({from: username, to: userBeingPaid.username, type: 'mined_for', amount: 1}, ()=>{})
          if(USERS_INFO[userBeingPaid.username]) {
            ++USERS_INFO[userBeingPaid.username].shares;
            ++USERS_INFO[userBeingPaid.username].minedPaymentsReceived;
            USER_SOCKETS[userBeingPaid.username].emit("mined for payment", username)
          }
          ++myuser.minedPayments;
          callback(userBeingPaid.username, null)
        })
      })
    } else {
      Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'shares': 1, 'sharesFound': 1 } }, (err, user) => {
        ++myuser.shares;
        if(user) callback(user.username, null)
        else callback(false, "No user found: " + err)
      })
    }
  })
}
function isLoggedIn(socket, cb) {
 if(socket.handshake.headers.cookie) {
    var cookie = /loginCookie=(.*?)(?:; |$)/.exec(socket.handshake.headers.cookie);
    if(cookie) {
      cookie = cookie[1];
      let ic = decode(cookie).slice(0, 32);
      let username = USER_BY_COOKIE[ic];
      if(DEBUG) {
        console.log("Socket.io connection from: " + socket.handshake.address)
        console.log("raw: " + cookie.slice(0, 32))
        console.log("decoded: " + ic)
        console.log("status: " + (username ? "Accepted - " + username : "Rejected"))
        console.log(" ----- socket.io con ------ ")
      }
      if(username) {
        USER_SOCKETS[username] = socket;
        return cb(username, ic)
      }
    }
    cb(false);
  } else {
    // Guest logged in/out.
    cb(false)
  }
}
})();

