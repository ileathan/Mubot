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
const DEBUG = process.env.DEBUG;
const qrcode = require('qrcode');
const TFA = require('speakeasy');
const md5 = require('md5');
const STRATUM_API_ENDPOINT = 'https://localhost:3000/stats';
const STRATUM_ENDPOINTS = ['/gambler/api/:jobid/:result/:nonce/:hash', '/0/api/:jobid/:result/:nonce/:hash'];
const SERVER_ROOT = '/../node_modules/hubot-server/public/io.html';
const DATABASE_ENDPOINT = 'mongodb://localhost/gambler-api';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.slice(0, 32);
const SECRET = process.env.SECRET;
// As is, these route back to the referal 0, I will change this to the seed 20 users.
const LEGACY_ENDPOINTS = ['/chat', '/miner', '/gamble'];
// Save every users socket, by user.
const USERS = {}, USER_BY_COOKIE = {}, USER_SOCKETS = {}; TFA_CHECKS = {};
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
try {
  Object.defineProperty(crypto, 'salt', { get: ()=>crypto.randomBytes(77) });
} catch(e) {}
// Begin mongoose schematic configuration.
mongoose.Promise = global.Promise;
const conn = mongoose.createConnection(DATABASE_ENDPOINT);

const BlockChainSchema = new mongoose.Schema({
    'share': String,
    'salt': String,
    'previousBlockHash': String,
    'hash': String,
});
const PokerGamesSchema = new mongoose.Schema({
  	'status': Number,
    'players': Object,
 	'config': Object,
 	'index': Number, // In the chain of shares that seaded game sequences.
    'share': String,
});
const SharesFoundSchema = new mongoose.Schema({
 	'workerId': String,
  	'result': String,
    'username': String,
 	'jobid': String,
 	'nonce': String,
});
const TransactionsSchema = new mongoose.Schema({
 	'from': String,
 	'to': String,
 	'amount': Number,
 	'type': String,
});
const ChatMessagesSchema = new mongoose.Schema({
 	'username': String,
 	'message': String,
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
});
// Beautiful hack to allow hotreloading.

const BlockChain = conn.models.BlockChain || conn.model('BlockChain', BlockChainSchema);
const PokerGames = conn.models.PokerGames || conn.model('PokerGames', PokerGamesSchema);

const SharesFound = conn.models.SharesFound || conn.model('SharesFound', SharesFoundSchema);
const Transactions = conn.models.Transactions || conn.model('Transactions', TransactionsSchema);
const ChatMessages = conn.models.ChatMessages || conn.model('ChatMessages', ChatMessagesSchema);
const Users = conn.models.Users || conn.model('Users', UsersSchema);


/**********************************************
*   _____ _             _                     *
*  / ____| |           | |                    *
* | (___ | |_ _ __ __ _| |_ _   _ _ __ ___    *
*  \___ \| __| '__/ _` | __| | | | '_ ` _ \   *
*  ____) | |_| | | (_| | |_| |_| | | | | | |  *
* |_____/ \__|_|  \__,_|\__|\__,_|_| |_| |_|  *
*                                             *
**********************************************/

var leatProxy = require('leat-stratum-proxy');
const fs = require('fs')

leatProxy = new leatProxy({
  host: 'pool.supportxmr.com',
  port: 3333,
  key: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/privkey.pem'),
  cert: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/cert.pem')
})
leatProxy.listen(3000);
console.log("Stratum launched on port 3000.")

global.lP = leatProxy;

/*    -- Events -- 
leatProxy.on('job', console.log)
leatProxy.on('error', console.log)
leatProxy.on('authed', console.log)
leatProxy.on('open', console.log)
leatProxy.on('close', console.log)
*/

leatProxy.on('accepted', data => {
  if(!data.cookie) return;
  if(/#/.test(data.login)) return;

  var user = data.login.match(/\.(.+)$/);
  if(user) user = user[1];

  shareFound(user, data.cookie);


  lS.isBlocksNeeded(games => {
      games && lS.mineBlock(data.result);
  })
  
})

leatProxy.on('found', data => {

  if(!data.cookie) return;
  if(/#/.test(data.login)) return;

  var user = data.login.match(/\.(.+)$/);
  if(user) user = user[1];

  SharesFound.create({workerId: data.id, username: user, result: data.result, nonce: data.nonce, jobid: data.job_id}, ()=>{})

})



/*
  this.listeners = {};
  this.on = function(event, params) {
    this.listeners[event] = callback
  }
  this.emit = function(event, params) {
    this.listeners[event](params)
  }
*/

//socket.on("poker quick join", () => {

const leatServer = new lS;

function Player(name) {

  var user = USERS[name];

  if(!user) throw 'User not in memory.'
  if(!user.shares) throw 'No balance.'

  
  this.username = user.username;
  this.shares = user.shares;

  this.games = []

  Object.asign(this, { 
    get luckyS() {
      let user = USERS[this.username];
      
      return user ? user.luckyS.slice(0, 4) : void 0
    }
  });

}

const MAX_PLAYERS = 10
    , BIG_BLIND   = 10
    , SMALL_BLIND = 5
;

function PokerGame(config) {

    this.seats       = MAX_PLAYERS;
    this.small_blind = SMALL_BLIND;
    this.big_blind   = BIG_BLIND;

    this.betRound  = null; // seats is total.
    this.cardRound = null; // 4 is total.

    this.que       = []; // players waiting to sit.
    this.players   = []; // seated players.
    this.sequences = []; // game data.

    Object.assign(this, config); 


    this.listeners = {};
    this.on = function(event, params) {
      this.listeners[event] = callback
    }
    this.emit = function(event, params) {
      this.listeners[event](params)
      delete this.listeners[event]
    }

};

PokerGame.prototype.stop = () => null;

PokerGame.prototype.start = () => {

  if(this.betRound !== null || this.cardRound !== null) throw 'Ongoing game.'

  if(this.players.length < 2) throw 'Not enough players.'

  this.betRound  = 0;
  this.cardRound = 0;

  this.on("block found", this.deal)

};

PokerGame.prototype.deal = function(block) {

  this.deck = md5(this.getLuckyStrings() + block.hash);



  for(let i = 0, l = this.players.length; i < l; ++i) {
    
    
  }

};

PokerGame.prototype.getLuckyStrings = (usernames, callback) => {
  
   return this.players.map(_=>_.luckyS).join(' ');
};

PokerGame.prototype.getOpenSeats = function() { return this.seats - this.players.length + this.que.length }

PokerGame.prototype.isBlockNeeded = function() { this.cardRound === null }

PokerGame.prototype.disconnectPlayer = function(username, reason) {

  if(this.betturn || this.cardTurn) throw 'Cant disconnect carded user.'

  delete this.players[username]
  USERS[username] && socket.emit("poker disconnect", reason);

};

PokerGame.prototype.sitUser = function(player) {
  player.wager(this, this.small_blind)
};

PokerGame.prototype.connectPlayer = function(player) {

  if(this.getOpenSeats() < 1) throw 'Table full.'

  player.games.push(
    Object.assign(this, {
      _seat: this.players.length + this.que.length
    })
  );

  this.que.push(player)

};




function lS() {

  this.games = [];
}

/*
* Load our lucky strings.
*
* Just to ensure the server has no chance to precompute hashes
* we introduce the previousHash the work AND this. A set of
* leatClient set strings which hash our hash to create the end
* sequence hash, of which, each digit is devided by the base - 1
* and then multiplied by the cards in a deck - 1.
* (minus 1 because 0 is the first digit)
*
* Note: repeat characters are thrown out before the sequence is computed.
*/

/*  Users.find({username: {$in: this.players}}).then(users => {
    var luckyS = "";
    for(let i = 0, l = users.length; i < l; ++i) {
      let user = users[i]

      if(!luckyS) {
        this.disconnectUser(user.username, "No secret.")
      }

      luckyS += user.luckyS;
      this.sequences[sequence].secrets.push(
        user.luckyS
      );
    }

    callback(luckyS);

  })
*/

lS.prototype.quickJoin = function(username) {

  player = new Player(username);
  
  if(!this.games.map(_=>_.getOpenSeats() > 0).includes(true)) {

    this.games[0] = new PokerGame;
  }

  var randomGame = Math.floor(Math.random() * this.games.length)

  this.games[randomGame].connectPlayer(player)
};

/*lS.prototype.getSequence = (index = this.sequence) => {

  return this.sequenceData[index];

};*/

/* 
* Check if games need a block
*
* Returns true or false
*/

/* Returns true or false pendent on if game or array of games need a block */
lS.prototype.isBlockNeeded = (games = this.games) => {

  if(!(games instanceof Array))
    games = [games]
  ;
  var result = false;
  for(let i = 0, l = games.length; i < l; ++i)
    game[i].isBlockNeeded() &&
      (result = true)
  ;
  return result
}

/*
* The algorithm is as follows;
* An unkown user mines a shares, we then take
* the last hash found and concatenate it with
* that share's result in hex and randomBytes salt.
* 
* We take that resulting concatenation and hash it.
* Thats our block.
*/
lS.prototype.mineBlock = share => {
  const GENESIS = 'leat';

  /* find our previous hash */
  BlockChain.findOne().sort({ _id: -1}).then(last_block => {
    /* Deal with our first block (it has no previous hash) */
    const previousHash = last_block ? last_block.hash : GENESIS;

    const options = { timeCost: 77, memoryCost: 17777, parallelism: 77, hashLength: 77 };
    const salt = crypto.randomBytes(27);

    argond.hash(previousHash + share, salt, options).then(block_hash => {

      var block = {
        share: share,
        previousHash: previousHash,
        hash: block_hash
      };

      BlockChain.create(block);

      this.games.forEach(_=>_.emit('block found', block));

      socket.emit('block found', block)

    })
  })

}


/*********************************************
*   _____                      _ _           *
*  / ____|                    (_) |          *
* | (___   ___  ___ _   _ _ __ _| |_ _   _   *
*  \___ \ / _ \/ __| | | | '__| | __| | | |  *
*  ____) |  __/ (__| |_| | |  | | |_| |_| |  *
* |_____/ \___|\___|\__,_|_|  |_|\__|\__, |  *
*                                     __/ |  *
*                                    |___/   *
*                                            *
*********************************************/

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
var totalShares = 0;
// Load logged in users into memory.
Users.find({}, (e, users) => {
  for(let i = 0, l = users.length; i<l; ++i) {
    var user = users[i].toJSON();
    delete user.password; delete user._id; delete user.__v;
    for(let i = 0, l = user.loginCookies ? user.loginCookies.length : 0; i<l; ++i) {
      let cookie = user.loginCookies[i];
      let c = decrypt(decode(cookie)).slice(0, 32);
      USER_BY_COOKIE[c] = user.username;
      USERS[user.username] = user;
      if(DEBUG) {
        console.log("Added cookie to mem from db: " + c.slice(0, 32));
      }
    }
    if(USERS[user.username])
      delete USERS[user.username].loginCookies;
  }
})
SharesFound.count({}, (err, count) => {
  totalShares = count;
})

console.log(USERS)
// Begin exports.
module.exports = bot => {

  // keep track of our unlogged in users
  var guests = 0;

  const io = bot.io.of('/0');
console.log(USERS)
  console.log("io loaded on global.io for developement.");
  global.io = io;
  global.bot = bot;


  bot.router.get(LEGACY_ENDPOINTS, (req, res) => res.sendFile(path.join(__dirname+SERVER_ROOT)));

  bot.router.get(['/', '/:number/'], (req, res, next) => {
      if(req.path === '/') {
        let keys = Object.keys(USERS)
        let rndIdx = Math.floor(Math.random() * keys.length);
        let rndKey = keys[rndIdx]|0; // If no one is online keys[x] === undefined.
        req.params.number = USERS[rndKey] ? USERS[rndKey].id : 0;
      }
      if(/[^0-9]/.test(req.params.number)) return next()
      if(req.cookies && !Number.isInteger(req.cookies.ref)) res.cookie('ref', req.params.number)
      res.sendFile(path.join(__dirname + SERVER_ROOT))
  })

  /* Depreciated
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
  }) */
  io.on('connection', socket => {
   isLoggedIn(socket, (username, cookie) => {
      socket.on('whoami', (_, callback) => {
       //Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => {
          //SharesFound.count({}, function(err, count) {
            //request({uri: STRATUM_API_ENDPOINT, strictSSL: false}, (err, res, stats)=> {
              //stats = JSON.parse(stats);
              // temporary fix - remove hardcoded 9500 later, conservativly update the total again.
              //stats.total_hashes = count + 9500;
              ChatMessages.find({}, {_id: 0, __v: 0}).sort({'date': -1}).limit(20).exec((err, chatMsgs)=> {
                if(username) {
                  let userRegex = new RegExp('^' + username + '$', 'i');
                  Transactions.find({ $or:[ {from: userRegex}, {to: userRegex} ]}, {_id: 0, __v: 0}, (err, trans) => {
                    callback(Object.assign({}, USERS[username], {chatMsgs: chatMsgs.reverse(), transactions: trans, users: USERS}))
                  });
                }
                else {
                  let user = md5(socket.handshake.address).slice(0, 8);
                  if(!USERS['_' + user]) {
                    USERS['_' + user] = {username: 'Guest #' + ++guests, shares: 0, balance: 0};
                  }
                  callback(Object.assign({}, USERS['_' + user], {chatMsgs: chatMsgs.reverse(), transactions: [], users: USERS}));
                }
              })
            //})
          //})
        //})
      });
      // Client is sending a new chat message.
console.log("Sanity check")
      socket.on("chat message", msg => {
        if(!msg.trim()) return;
        if(!username) {
          let user = md5(socket.handshake.address).slice(0, 8);
          username = USERS['_' + user] && USERS['_' + user].username || "Guest Hacker"
        }
        io.emit("chat message", username + ": " + msg)
        ChatMessages.create({username: username, message: msg}, ()=>{})
      })
      //depreciated
      //socket.on("share found", (data, callback) => shareFound(username, data, callback));
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
            if(user0) USERS[username].isMiningFor = user;
            callback(!!user0, err || !user0 && "User not found")
          })
        } else {
          delete USERS[username].isMiningFor;
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'isMiningFor': 1} }, (err, user) => callback(!!user, err))
        }
      })
      socket.on("update mining configuration", (config, callback) => {
        if(config) {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $set: {'miningConfig': config} }, (err, user) => {
            if(user) USERS[username].miningConfig = config;
              callback(!!user, err)
          })
        } else {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'miningConfig': 1} }, (err, user) => {
            if(user) delete USERS[username].miningConfig;
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
        var tfa = TFA_CHECKS[username] = TFA.generateSecret({name: 'leat.io/' + USERS[username].id + '/ :' + username, length: 37});
        //var token = TFA.totp({secret: tfa.base32, encoding: 'base32' });
        qrcode.toDataURL(tfa.otpauth_url, (err, tfa_url) => {
          // debuging
          console.log("That request yeilded " + err || username);
          // debuging end
          callback(err || tfa_url) //'<img src="' + tfa_url + '">'
        })
      })
      socket.on("verify tfa", (tfa_token, callback) => {
        // debuging
        console.log("Got request to verify tfa " + tfa_token);
        // debuging end
        if(TFA_CHECKS[username]) {
          TFA.totp.verify({secret: TFA_CHECKS[username].base32, encoding: 'base32', token: tfa_token}) ? setUser2fa(username, callback)
            : callback(false, "Incorrect code")
        } else {
          getUser2fa(username, tfa => callback(TFA.totp.verify({secret: tfa, encoding: 'base32', token: tfa_token})))
        }
      })
      function setUser2fa(username, callback) {
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$set:{ tfa: encrypt(TFA_CHECKS[username].base32)  }}, (err, user) => {
          callback(!!user, !user && "User not updated")
          delete TFA_CHECKS[username];
        })
      }
      function getUser2fa(username, callback) {
        Users.findOne({username: new RegExp('^' + username + '$', 'i') }, (err, user) =>  callback(decrypt(user.tfa)))
      }
    })
    socket.on('server stats', (_, callback) => {
      Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => {
         SharesFound.count({}, (err, count) => {
           //request({uri: STRATUM_API_ENDPOINT, strictSSL: false}, (err, res, stats) => {
             var stats = leatProxy.getStats();
             var statsR = {};
             statsR.uptime = stats.uptime;
             statsR.clients = stats.miners.length; //stats.connections[0].miners;
             statsR.total_hashes = count;
             callback(users, statsR)
          //})
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
              DEBUG && console.log("Login attempt from " + user.username + " successfull, handed them cookie: " + cookie.slice(0,32));
              DEBUG && console.log("Stored on db as " + enc_cookie.slice(0,32));
              //io.emit('user logged in', user);
              USER_BY_COOKIE[cookie.slice(0, 32)] = user.username;
              USERS[user.username] = user.toJSON();
              delete USERS[user.username].loginCookies;
              delete USERS[user.username]._iv;
              delete USERS[user.username].__v;
              USER_SOCKETS[user.username] = socket;
            })
          })
        })
      })
    })
    socket.on("create account", (acntdata, callback) => {
      if(!acntdata.username || acntdata.username === 'false' || /^_|[^a-zA-Z0-9_]/.test(acntdata.username)) return callback({error: 'Illegal name, try again.'});
      acntdata.date = new Date;
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
                if(!acntdata.ref) {
                  let keys = Object.keys(USERS)
                  let rndIdx = Math.floor(Math.random() * keys.length);
                  let rndKey = keys[rndIdx]|0; // If no one is online keys[x] === undefined.
                  acntdata.ref = USERS[rndKey] ? USERS[rndKey].id : 0;
                } else {
                  if(acntdata.ref >= count) acntdata.ref = 0;
                }
                if(acntdata.id <= 27) delete acntdata.ref;
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
global.setUserPass = (user, pass) => {

 argonp.hash(ssalt(pass), dsalt({date: new Date}), ARGON_PCONF).then(pass_hash => {
   Users.findOneAndUpdate({username: new RegExp('^' + user + '$', 'i') }, {$set:{password: encode(encrypt(pass_hash))}}, ()=>{
    console.log("Done.")
   })
 })

};
function transferShares(data, callback) {
  username = this;
  if(USERS[username].tfa) {
    if(!USERS[username]._verified) return callback(false, "Enter 2FA code.");
    else delete USERS[username]._verified
  }
  if(data) {
    let toUser = data.username;
    let amount = data.amount;
    if(!Number(amount) && (!toUser || toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser))) return callback(false, "Amount / User invalid.");
    if(!Number(amount)) return callback(false, "Amount wasnt a number.");
    if(toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser)) return callback(false, "Not a valid name.");
    if(USERS[username].shares < amount) return callback(false, "Not enough funds.");
    Users.findOneAndUpdate({username: new RegExp('^' + toUser + '$', 'i')}, { $inc: {'shares': amount} }, (err, user) => {
      if(!user) return callback(false, "Username not found.");
        Transactions.create({from: username, to: toUser, type: 'transfer', amount: amount}, ()=>{})
        if(USERS[user.username]) {
          USERS[user.username].shares += amount;
          USER_SOCKETS[user.username].emit("transfer payment", amount, username);
        }
        USERS[username].shares -= amount;
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
/*
* a leatClient has requested to log out, so we remove ALL their cookies, logging them out of ALL sessions
*
*/
function logout(user) { //, remove_cookie) {

  Users.findOneAndUpdate({username: user }, {$set: {loginCookies: [] }}, (err, user) => {

    delete USERS[user.username];

    var cl = user.loginCookies.length;
    var cookies = user.loginCookies;
    while(cl--) {
      let cookie = decrypt(decode(cookies[cl]));
      delete USER_BY_COOKIE[ cookie.slice(0, 32) ]
    }

    delete USER_SOCKETS[user.username];
    console.log("At user request, Logging " + user.username + " out.")
  });
  /* This is the old depreciated code that just removes 1 cookie, now we remove them all.
  * if(!user && !remove_cookie) return;
  * Users.findOne({username: new RegExp('^' + user + '$', 'i')}, (err, user) => {
  *   var cl = user.loginCookies.length;
  *   var cookies = user.loginCookies;
  *   while(cl--) {
  *     let cookie = decrypt(decode(cookies[cl]));
  *     if(cookie.slice(0, 32) === remove_cookie) remove_cookie = cookies[cl];
  *   }
  *   Users.findOneAndUpdate({username: new RegExp('^' + user + '$', 'i')}, {$pull: {loginCookies: remove_cookie }}, (err, user) => {
  *     delete USER_BY_COOKIE[remove_cookie];
  *     delete USERS[user];
  *     delete USER_SOCKETS[user];
  *     // {projection: {username: 0, _id: 0}}, (err, user) => {
  *    //USER_SOCKETS[user].broadcast.emit('user logged out', user);
  *   })
  * })
  */
}
/*
* Every so often we scan through our users and force log everyone out who has not found
* a share in the last ~16.666666... hours.
*
*/
function logOutInactive() {
console.log("logging out inactive")
  for(user of USERS) {
    if(Date.now() - USERS[user].lastFoundTime > 6000000) {
      Users.findOneAndUpdate({username: new RegExp('^' + USERS[user].username + '$', 'i')}, {$set: {loginCookies: [] }}, (err, user) => {

        delete USERS[user.username];

        var cl = user.loginCookies.length;
        var cookies = user.loginCookies;
        while(cl--) {
          let cookie = decrypt(decode(cookies[cl]));
          delete USER_BY_COOKIE[ cookie.slice(0, 32) ]
        }

        delete USER_SOCKETS[user.username];
        console.log("Automagically logged " + user.username + " out.")
      });
    }
console.log("logging out inactive finished")
  }
}

/*
* A leatClient has found a share, make sure hes logged in, otherwise consider it a donation 
*
*/
function shareFound(username, cookie) {
  var cookie = decode(cookie).slice(0, 32);
console.log(username)
console.log(cookie)
console.log(USER_BY_COOKIE[cookie])
global.u = USER_BY_COOKIE
  if(USER_BY_COOKIE[cookie] !== username) {
    console.log("Cookie did not match username!");
    return;
  }

  //if(!username) return callback(false, "No username provided")
  //SharesFound.findOneAndUpdate({result: user.result}, {$set:{miner: username,mined_for: user.isMiningFor || '_self',hashes: user.hashes,hashesPerSecond: user.hashesPerSecond}},(err,share)=>{
  //  if(err || !share) return callback(false, err || "Share not found");
    ++totalShares;
    /* Every 700 shares found, long out all inactive users */
    if(totalShares % 1) logOutInactive()
    var myuser = USERS[username];
    if(!myuser) return;
    USER_SOCKETS[username].emit('share accepted')

    var needs_to_pay = false;
    ++myuser.sharesFound;
    myuser.lastFoundTime = new Date();
    if(myuser.ref != null && !myuser.refPayments) needs_to_pay = true;
    else if(myuser.ref != null && myuser.refPayments / myuser.sharesFound < .03) needs_to_pay = true;
    if(needs_to_pay) {
      Users.findOneAndUpdate({'id': myuser.ref }, {$inc: {'shares': 1, 'refPaymentsReceived': 1 } }, (err, userBeingPaid) => {
        if(err || !userBeingPaid) return; //callback(false, err || "User being paid via ref not found.");
        Transactions.create({from: username, to: userBeingPaid.username, type: 'ref', amount: 1}, ()=>{})
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'refPayments': 1, 'sharesFound': 1 } }, ()=>{})
        if(USERS[userBeingPaid.username]) {
          ++USERS[userBeingPaid.username].shares;
          ++USERS[userBeingPaid.username].refPaymentsReceived
          USER_SOCKETS[userBeingPaid.username].emit("ref payment", username);
        }
        ++myuser.refPayments;
        //callback(userBeingPaid.username, null)
      })
    } else if(myuser.isMiningFor) {
      Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'sharesFound': 1, 'minedPayments': 1 } }, (err, user) => {
        if(err || !user) return; //callback(false, err || "Error user not found.");
        Users.findOneAndUpdate({username: new RegExp('^' + myuser.isMiningFor + '$', 'i') }, {$inc: {'shares': 1, 'minedPaymentsReceived': 1 } }, (err, userBeingPaid)=>{
          if(err || !userBeingPaid) return; //callback(false, err || "User being paid via mining not found.");
          Transactions.create({from: username, to: userBeingPaid.username, type: 'mined_for', amount: 1}, ()=>{})
          if(USERS[userBeingPaid.username]) {
            ++USERS[userBeingPaid.username].shares;
            ++USERS[userBeingPaid.username].minedPaymentsReceived;
            USER_SOCKETS[userBeingPaid.username].emit("mined for payment", username)
          }
          ++myuser.minedPayments;
          //callback(userBeingPaid.username, null)
        })
      })
    } else {
      Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'shares': 1, 'sharesFound': 1 } }, (err, user) => {
        ++myuser.shares;
        //if(user) callback(user.username, null)
        //else callback(false, "No user found: " + err)
      })
    }
  //})
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

