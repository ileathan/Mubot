// Commands:
//   None.
//
// Author:
//   leathan
//
(function() {
  // Export.
  module.exports = bot => main(l.bot = bot)
  ;
  // Configuration.
  const l = {}
  ;
  l.hostname = 'leat.io'
  ;
  l.path = '/../node_modules/mubot-server/public/'
  ;
  l.address = '44sHctzZQoZPyavKM5JyLGFgwZ36FXTD8LS6nwyMgdbvhj1yXnhSQokErvFKh4aNmsAGzMyDLXSBS5vGxz3G3T46KukLmyc'
  ;
  l.debug = process.env.DEBUG
  ;
  // first seed_refs users are except for life from ref fees.
  l.seed_refs = 77;
  // Store imports/requires here, dont export these.
  l.includes = {};
  l.includes.qrcode = require('qrcode');
  l.includes.tfa = require('speakeasy');
  l.includes.md5 = require('md5');
  l.includes.request = require('request');
  l.includes.exec = require('child_process').exec;
  l.includes.mongoose = require('mongoose');
  l.includes.path = require('path');
  l.includes.crypto = require('crypto');
  l.includes.argonp = require('argon2-ffi').argon2i;
  l.includes.argond = require('argon2-ffi').argon2d;
  l.includes.salt = () => crypto.randomBytes(77);
  l.includes.c = require('encode-x')();
  // secure info, dont export these.
  l.secure = {};
  l.secure.encryption_key = process.env.ENCRYPTION_KEY.slice(0, 32);
  l.secure.secret = process.env.SECRET;
  l.legacy_endpoints = ['/chat', '/miner', '/gamble'];
  // User data.
  Object.assign(l, {
    users: {},
    cookieToUsername: {},
    usernameToSockets: {},
    usernameTo2fa: {},
  });
  /* 
  * $argon2i$v=19$m=7777,t=77,p=77$ 7+crypto.randomBytes+secret $ hash
  * Memory cost 7777 KiB (1024*7777), relative time cost, and the number 
  * of sustained concurrent threads needed.
  */
  l.argon_conf = {
    parallelism: 77,
    memoryCost: 7777,
    timeCost: 77
  }
  ;
  /*
  * Begin mongoose schematic configuration.
  */
  l.db = {}
  ;
  l.db.endpoint = 'mongodb://localhost/gambler-api'
  ;
  l.includes.mongoose.Promise = global.Promise
  ;
  l.db.conn = l.includes.mongoose.createConnection(l.db.endpoint)
  ;
  l.db.BlockChainSchema = new l.includes.mongoose.Schema({
    'share': String,
    'salt': String,
    'previousBlockHash': String,
    'hash': String,
    "date": { type: Date, default: Date.now() }
  })
  l.db.PokerGamesSchema = new l.includes.mongoose.Schema({
    'status': Number,
    'players': Object,
    'config': Object,
    'index': Number,
    // In the chain of shares that seaded game sequences.
    'share': String,
    "date": { type: Date, default: Date.now() }
  })
  l.db.SharesFoundSchema = new l.includes.mongoose.Schema({
    'workerId': String,
    'result': String,
    'username': String,
    'jobid': String,
    'nonce': String,
    "date": { type: Date, default: Date.now() }
  })
  l.db.TransactionsSchema = new l.includes.mongoose.Schema({
    'from': String,
    'to': String,
    'amount': Number,
    'type': String,
    "date": { type: Date, default: Date.now() }
  })
  l.db.ChatMessagesSchema = new l.includes.mongoose.Schema({
    'username': String,
    'message': String,
  })
  l.db.UsersSchema = new l.includes.mongoose.Schema({
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
  })
  ; 
  l.db.TransactionsSchema.options.toJSON = l.db.ChatMessagesSchema.options.toJSON = {
    transform: function(doc, ret, options) {
      ret.date = ret._id.getTimestamp()
      ;
      delete ret._id
      ;
      return ret
      ;
    }
  }
  ;
  l.db.UsersSchema.options.toJSON = {
    transform: function(doc, ret, options) {
      //ret._id && (
      //  ret.date = ret._id.getTimestamp()
      //)
      ret.date = ret._id.getTimestamp()
      ;
      delete ret._id; delete ret.__v, delete ret.password; delete ret.loginCookies
      ;
      return ret
      ;
    }
  }
  ;
  // Beautiful hack to allow hotreloading.
  l.db.BlockChain = l.db.conn.models.BlockChain || l.db.conn.model('BlockChain', l.db.BlockChainSchema)
  ;
  l.db.PokerGames = l.db.conn.models.PokerGames || l.db.conn.model('PokerGames', l.db.PokerGamesSchema)
  ;
  l.db.SharesFound = l.db.conn.models.SharesFound || l.db.conn.model('SharesFound', l.db.SharesFoundSchema)
  ;
  l.db.Transactions = l.db.conn.models.Transactions || l.db.conn.model('Transactions', l.db.TransactionsSchema)
  ;
  l.db.ChatMessages = l.db.conn.models.ChatMessages || l.db.conn.model('ChatMessages', l.db.ChatMessagesSchema)
  ;
  l.db.Users = l.db.conn.models.Users || l.db.conn.model('Users', l.db.UsersSchema)
  ;

  /**********************************************
  *   _____ _             _                     *
  *  / ____| |           | |                    *
  * | (___ | |_ _ __ __ _| |_ _   _ _ __ ___    *
  *  \___ \| __| '__/ _` | __| | | | '_ ` _ \   *
  *  ____) | |_| | | (_| | |_| |_| | | | | | |  *
  * |_____/ \__|_|  \__,_|\__|\__,_|_| |_| |_|  *
  *                                             *
  **********************************************/

  function leatServer() {
    this.games = [];
  }

  leatServer.prototype.quickJoin = function(username) {

    var player = new Player(username);

    if(this.games.map(getOpenSeats).sort().pop()) {

      return this.games[0] = new PokerGame
    }

    var openGames = this.games.filter(getOpenSeats);

    var randomGame = Math.floor(Math.random() * openGames.length)

    openGames[randomGame].connectPlayer(player)
  }
  ;

  /* 
  * Check if games need a block
  *
  * Returns true or false
  */
  leatServer.prototype.isBlockNeeded = function(games = this.games) {

    if(!(games instanceof Array))
      games = [games];

    return games.filter(this.isBlockNeeded).length;
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
  leatServer.prototype.mineBlock = share => {
    const GENESIS = 'leat'
    ;
    /* find our previous hash */
    l.db.BlockChain.findOne().sort({
      _id: -1
    }).then(last_block => {
      /* Deal with our first block (it has no previous hash) */
      const previousHash = last_block ? last_block.hash : GENESIS
      ;
      const options = {
        timeCost: 77,
        memoryCost: 17777,
        parallelism: 77,
        hashLength: 77
      }
      ;
      const salt = crypto.randomBytes(77)
      ;
      argond.hash(previousHash + prevousSecrets + share, salt, options).then(block_hash => {

        var block = {
          block: block_hash,
          verifies: {
            previousHash,
            previousSecrets,
            share
          }
        }
        ;
        l.db.BlockChain.create(block)
        ;
        this.games.forEach(_=>_.emit('block found', block))
        ;
        socket.emit('block found', block)
        ;
      })
      ;
    })
    ;
  }
  ;
  const lS = new leatServer
  ;
  function Player(name) {

    var user = l.users[name];

    if(!user)
      throw 'User not in memory.'
    if(!user.shares)
      throw 'No balance.'

    this.username = user.username;
    this.shares = user.shares;

    this.games = []

    Object.asign(this, {
      get luckyS() {
        let user = l.users[this.username];
        return user ? user.luckyS.slice(0, 4) : void 0
      }
    });

  }

  const MAX_PLAYERS = 10
    , BIG_BLIND = 10
    , SMALL_BLIND = 5;

  function PokerGame(config) {

    this.seats = MAX_PLAYERS;
    this.small_blind = SMALL_BLIND;
    this.big_blind = BIG_BLIND;

    this.betRound = null;
    // seats is total.
    this.cardRound = null;
    // 4 is total.

    this.que = [];
    // players waiting to sit.
    this.players = [];
    // seated players.
    this.sequences = [];
    // game data.

    Object.assign(this, config);

    this.listeners = {};
    this.on = function(event, params) {
      this.listeners[event] = callback
    }
    this.emit = function(event, params) {
      this.listeners[event](params)
      delete this.listeners[event]
    }

  }
  ;
  PokerGame.prototype.stop = ()=>null;

  PokerGame.prototype.start = () => {

    if(this.betRound !== null || this.cardRound !== null)
      throw 'Ongoing game.'

    if(this.players.length < 2)
      throw 'Not enough players.'

    this.betRound = 0;
    this.cardRound = 0;

    this.on("block found", this.deal)

  }
  ;

  PokerGame.prototype.deal = function(block) {

    this.deck = l.includes.md5(this.getLuckyStrings() + block.hash);

    for(let i = 0, len = this.players.length; i < len; ++i) {
    }

  }
  ;

  PokerGame.prototype.getLuckyStrings = (usernames, callback) => {

    return this.players.map(_=>_.luckyS).join(' ');
  }
  ;

  PokerGame.prototype.getOpenSeats = function(game = this) {
    return game.seats - game.players.length + game.que.length
  }

  PokerGame.prototype.isBlockNeeded = function() {
    this.cardRound === null
  }

  PokerGame.prototype.disconnectPlayer = function(username, reason) {

    if(this.betturn || this.cardTurn)
      throw 'Cant disconnect carded user.'

    delete this.players[username]
    l.users[username] && emitToUserSockets(username, "lS.Poker.disconnect", reason);

  }
  ;

  PokerGame.prototype.sitUser = function(player) {
    player.wager(this, this.small_blind)
  }
  ;

  PokerGame.prototype.connectPlayer = function(player) {

    if(this.getOpenSeats() < 1)
      throw 'Table full.'

    player.games.push(Object.assign(this, {
      _seat: this.players.length + this.que.length
    }));

    this.que.push(player)

  }
  ;


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

  if(!l.secure.secret) {
    throw new Error("Need to pass in a SECRET `SECRET=\"someverylongsafesecret\" mubot`")
  }
  if(!l.secure.encryption_key) {
    throw new Error("Need to pass in an ENCRYPTION_KEY `ENCRYPTION_KEY=\"someverylongsafekey\"`")
  }
  if(l.secure.encryption_key.length < 32) {
    throw new Error("Need to make your ENCRYPTION_KEY longer. (Min: 32chars)")
  }
  if(l.secure.secret.length < 32) {
    throw new Error("Need to make your SECRET longer. (Min: 32chars)")
  }
  // Current AES keys must be at most 256 bytes (32 characters)
  function encrypt(text) {
    if(text === null)
      return;
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
    } catch (e) {
      return null;
    }
  }
  // Our very own home baked encoders.
  function encode(data) {
    return c.from16To64(data).toString()
  }
  function decode(data) {
    return c.from64To16(data).toString()
  }
  // Static salts
  function ssalt(data) {
    return '7' + data + l.secure.secret
  }
  var totalShares = 0;

  function idToUsername(id, callback) {
    l.db.Users.findOne({id}).then(user=>callback(user.username))
  }
  l.db.SharesFound.count({}, (err, count) => {
    totalShares = count;
  }
  )
  var leatProxy;

  /*
  *  Since we allow multiple logins per acnt to mine for 1 account.
  */
  function emitToUserSockets(username, event, data) {
    //const event = [].splice.call(arguments, 0, 1);
    //const data = [].splice.call(arguments, 0, 1);
    if(username === void 0 || event === void 0)
      throw 'Missing username or event.'
    ;
    const socketIDs = Object.keys(
      l.usernameToSockets[username] || {}
    )
    ;
    var i = socketIDs.length
    ;
    while(i--) {
      let socket = l.usernameToSockets[username][ socketIDs[i] ]
      ;
      socket.emit(event, data)
      ;
    }
  }

  function verifyPassword(username, password, callback) {
    l.db.Users.findOne({
      'username': RegExp('^' + logindata.username + '$','i')
    }, (err, user) => {
      if(!user)
       return callback(false, "No such user.")
      ;
      argonp.verify(
        decrypt(decode(user.password)),
        ssalt(logindata.password),
        ARGON_PCONF
      ).then(_=>_&&callback(username));
    });
  }

  // Commands are just verify for now.
  function runCommand(username, command, bot) {
    if(/^(verify)/i.test(command)) {
      let [server, id, password ] = command.split(' ')
      verifyPassword(username, password, username => {
        var user = bot.brain.verified[username] || (bot.brain.verified[username] = {});
        Object.assign(user, l.users[username]);
        user.id || (user.id = {});
        Object.assign(user.id, {ids: {[id]: server}});
        bot.brain.save();
        let message = "Successfully verified " + server + " as " + username + "@leat.io.";

        emitToUserSockets(username, "lS.newChatMessage", { username: 'leat.io', message, date: new Date() });

        try {
          bot.adapter.send({room: id}, res)
        } catch(e){}
      });
    }
    if(/^(unverify)/i.test(command)) {
      let [server, id, password ] = command.split(' ')
      verifyPassword(username, password, username => {
        var user = bot.brain.verified[username] || (bot.brain.verified[username] = {});
        Object.assign(user, l.users[username]);
        
        if(user[id]) {
          delete user[id]
        }
       
        user[id] || (user[id] = {});
        Object.assign(user[id], {ids: {[id]: server}});
        bot.brain.save();
        try {
          bot.adapter.send({room: id}, "Successfully unverified " + server + " as " + username + "@leat.io.")
        } catch(e){}
      });
    }
  }

  function main(bot) {
    l.io = l.bot.io.of('/0');
    l.bot.router.get(['/00/', '/m/', '/miner/', '/00', '/m', '/miner'], (req, res) =>
       res.sendFile(l.includes.path.join(__dirname + l.path + 'm.html'))
    )
    ;
    l.bot.router.get(l.legacy_endpoints.concat(['/', '/:number', '/:number/']), (req, res, next) => {
      var ref = req.params.number;
      if(ref && /[^0-9]/.test(ref))
        return next()
      ;
      if(!ref) {
        let keys = Object.keys(l.users)
        let rndIdx = Math.floor(Math.random() * keys.length);
        let rndKey = keys[rndIdx] || 0;
        // If no one is online keys[x] === undefined.
        ref = l.users[rndKey] ? l.users[rndKey].id : 0;
      }
      ref = parseInt(ref);
      if(!req.cookies.loginCookie && !req.cookies.ref)
        res.cookie('ref', ref)
      ;
      res.sendFile(l.includes.path.join(__dirname + l.path + 'leat.html'))
    })
    ;
    // #Load logged in users into memory.
    l.db.Users.find().then(all_users => {
      for(let i = 0, len = all_users.length; i < len; ++i) {
        let user = all_users[i]
        ;
        for(let i = 0, len = user.loginCookies.length; i < len; ++i) {
          let cookie = user.loginCookies[i]
          ;
          l.cookieToUsername[cookie] = user.username
          ;
        }
        user.loginCookies.length && (l.users[user.username] = user.toJSON())
        ;
      }
      bot.leat = l; // export
      bot.emit("leat.io loaded", bot);
    });
    leatProxy = require('leat-stratum-proxy');
    const fs = require('fs')
    lP = leatProxy = new leatProxy({
      server: bot.server,
      host: 'pool.supportxmr.com',
       port: 3333,
       //key: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/privkey.pem'),
       //cert: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/cert.pem')
    })
    leatProxy.listen();
    console.log("Stratum launched")

    leatProxy.on('accepted', data => {
      var [addr, user] = data.login.split('.');

      var [user, diff] = user.split('+');

      if(addr !== l.address) {
        console.log("Unique addr miner - " + addr);
        return;
      }
      if(user && user.substr(0, 2) === '_#') {
        idToUsername(user.substr(2), shareFound);
      } else {
        shareFound(user);
      }
      console.log(
        '-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\n' +
        data.login + "  Work done by ("+user+"/"+l.cookieToUsername[data.cookie]+"). Total: "+ (data.hashes||0) + " Cookie: " + data.cookie
      )
    })
    leatProxy.on('found', data => {
      l.db.SharesFound.create({
        workerId: data.id,
        username: data.login.split('.')[1] || '_anon',
        result: data.result,
        nonce: data.nonce,
        jobid: data.job_id
      }, _=>0)
      ;
    })

    var guests = 0;

    l.io.on('connection', socket => {

      isLoggedIn(socket, (username, cookie) => {

        socket.on('lC.load', (_, callback) => {
          l.db.ChatMessages.find().sort({ _id: -1}).limit(20).exec((err, chatMsgs) => {
            if(username) {
              l.db.Transactions.find({$or: [{ from: username }, { to: username }]}, { __v: 0 })
                .sort({ _id: -1 }).limit(777).exec((err, trans) => {
                  callback(Object.assign({}, l.users[username], {
                    chatMsgs: chatMsgs.reverse(),
                    transactions: trans.reverse(),
                    users: {}
                  })
                )
              })
              ;
            } else {
              callback(Object.assign({}, l.users[toGuest()], {
                chatMsgs: chatMsgs.reverse(),
                transactions: [],
                users: {}
              }))
              ;
            }
          })
          ;
        })
        ;
        function toGuest() {
          return "#" + l.includes.md5(l.secure.secret + socket.handshake.address).slice(0, 8)
          ;
        }
        socket.on("lC.newChatMessage", data => {
          var message = data.message,
              date = new Date
          ;
          if(!message.trim())
            return
          ;
          if(username && message[0] === '/') {
            emitToUserSockets(username, "lS.newChatMessage", {
              username: 'leat.io',
              message: 'Processing... ',
              date
            })
            runCommand(username, message.slice(1), bot);
            return;
          }
          l.io.emit("lS.newChatMessage", {username: username || toGuest(), message, date})
          l.db.ChatMessages.create({
            username: username || toGuest(),
            message
          }, _=>0)
        })
        ;
        socket.on('disconnect', () => {
          username ?
            delete l.usernameToSockets[username][socket.id]
          :
            delete l.users[toGuest()]
          ;
        })
        ;
        // Logged in users only API
        if(!username)
          return
        ;
        socket.on("lC.isMiningFor", (user, callback) => {
          var match = { username: RegExp('^' + username + '$', 'i') }
            , query = { [user ? '$set' : '$unset']: { isMiningFor: user || 1} }
          ;
          user ? l.users[username].isMiningFor = user : delete l.users[username].isMiningFor
          ;
          l.db.Users.findOne({username: RegExp('^' + user + '$', 'i')}).then(found => {
            l.db.Users.findOneAndUpdate(match, query).exec();
            callback(!user || !!found)
          })
          ;
        })
        socket.on("lC.transfer", transferShares.bind(username))
        ;
        // Passes an aditional parameter allSessions specifying whether or not to log out all cookies.
        socket.on("lC.logout", logout.bind(null, username, socket, cookie))
        ;
        // debuging
        global.self.sock = socket;
        // debuging end
        socket.on("lC.enable2fa", (_, callback) => {
          // debuging
          console.log("Got request to enable tfa by " + username);
          // debuging end
          var tfa = l.usernameTo2fa[username] = l.includes.tfa.generateSecret({
            name: l.hostname + '/' + l.users[username].id + '/ :' + username,
            length: 37
          });
          //var token = TFA.totp({secret: tfa.base32, encoding: 'base32' });
          l.includes.qrcode.toDataURL(
            tfa.otpauth_url,
            (err, tfa_url) => callback(tfa_url || err)
          )
        })
        ;
        socket.on("lC.verify2fa", (tfa_token, callback) => {

          if(l.usernameTo2fa[username]) {
            l.includes.tfa.totp.verify({
              secret: l.usernameTo2fa[username].base32,
              encoding: 'base32',
              token: tfa_token

            }) ? setUser2fa(username, callback)
               : callback(false, "Incorrect code")
            ;
          } else {
            getUser2fa(username, tfa => callback(
              l.includes.tfa.totp.verify({
                secret: tfa,
                encoding: 'base32',
                token: tfa_token
              })
            ))
            ;
          }
        })
        ;
        function setUser2fa(username, callback) {
          l.db.Users.findOneAndUpdate(
          { username },
          {
            $set: {
              tfa: encrypt(l.usernameTo2fa[username].base32)
            }
          }
          , (err, user) => {
            callback(!!user, !user && "User not updated")
            delete l.usernameTo2fa[username];
          }
          )
        }
        function getUser2fa(username, callback) {
          l.db.Users.findOne(
            { username }
          , (err, user) => callback(decrypt(user.tfa)))
        }
      }
      )
      socket.on('lC.refreshStats', (_, callback) => {
        l.db.Users.find({
          username: { $exists: true },
          shares: { $gt: 0 }
        }, {
          username: 1, shares: 1, _id: 0
        }
        , (err, users) => {
          l.db.SharesFound.count({}, (err, count) => {
            var stats = leatProxy.getStats();
            var statsR = {};
            statsR.uptime = stats.uptime;
            statsR.clients = stats.miners.length;
            statsR.total_hashes = count;
            callback(users, statsR)
          })
          ;
        })
        ;
      })
      ;
      socket.on("lC.checkUsername", (username, callback) => {
        l.db.Users.findOne({
          username: RegExp('^' + username + '$','i')
        }, (err, user) => {
          if(err)
            return next(err)
          ;
          callback(!user)
          ;
        })
        ;
      })
      ;
      socket.on("lC.login", (logindata, callback) => {
        l.db.Users.findOne({
          'username': RegExp('^' + logindata.username + '$','i')
        }, (err, user) => {

          if(!user)
            return callback(false, "No such user.")
          ;
          argonp.verify(
            decrypt(decode(user.password)),
            ssalt(logindata.password),
            ARGON_PCONF
          ).then(correct => {
            if(!correct)
              return callback(false, "Bad password.")
            ;
            delete logindata.password
            ;
            // Create new login cookie.
            ;
            var cookie = encode(crypto.randomBytes(37).toString('hex'))
            ;
            l.db.Users.findOneAndUpdate({'username': user.username}, {$push:{loginCookies: cookie}}, (err, user)=>{
              if(!user) {
                return callback('');
              }
              user = user.toJSON();
              callback(cookie);
              l.cookieToUsername[cookie] = user.username;
              // Add socket or create sockets obj and add.
              l.usernameToSockets[user.username] ?
                l.usernameToSockets[user.username][socket.id] = socket
              :
                l.usernameToSockets[user.username] = {[socket.id]: socket}
              ;
              l.users[user.username] = user;
            })
            ;
          })
          ;
        })
        ;
      })
      ;
      socket.on("lC.createAccount", (acntdata, callback) => {

        if(/^_|[^a-zA-Z0-9_]/.test(acntdata.username)) {

          return callback({ error: 'Illegal name, try again.' })
        }

        acntdata.date = new Date
        ;
        l.db.Users.findOne({
          username: new RegExp('^' + acntdata.username + '$','i')
        }, (err, user) => {

          if(user)
            callback({ error: 'Username already exists.' })
          ;
          else
            argonp.hash(ssalt(acntdata.password), salt(), ARGON_PCONF).then(pass_hash => {

              acntdata.password = encode(encrypt(pass_hash))
              ;
              var cookie = encode(
                crypto.randomBytes(37).toString('hex')
              )
              ;
              exec('echo monerod getnewaddress', (error, stdout) => {

                l.db.Users.count({}, function(err, count) {

                  acntdata.id = count
                  ;
                  if(acntdata.ref === void 0 || acntdata.ref >= count) {

                    // Get random ID from logged in users.
                    let keys, rndIdx, rndKey
                    ;
                    // Filters out guests, their usernames start with "#".
                    keys = Object.keys(
                      l.users.filter(_ =>
                        _.slice(0, 1) !== "#"
                      )
                    )
                    ;
                    rndIdx = Math.floor(Math.random() * keys.length)
                    ;
                    rndKey = keys[rndIdx]
                    ;
                    acntdata.ref = l.users[rndKey] ? l.users[rndKey].id : 0
                    ;
                  }
                  acntdata.id <= l.seed_refs && delete acntdata.ref
                  ;
                  acntdata.loginCookies = [ cookie ]
                  ;
                  l.db.Users.create(acntdata, (err, user) => {

                    l.users[user.username] = user.toJSON()
                    ;
                    l.usernameToSockets[user.username] = {[socket.id]: socket}
                    ;
                    l.cookieToUsername[cookie] = user.username
                    ;
                    callback(cookie)
                    ;
                  })
                  ;
                })
                ;
              })
              ;
            })
          ;
        })
        ;
      })
      ;
    })
    ;
  }
  ;
  l.setUserPass = (user, pass, callback) => {
    argonp.hash(ssalt(pass), salt(), ARGON_PCONF).then(pass_hash => {
      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + user + '$','i')
      }, {
        $set: {
          password: encode(encrypt(pass_hash))
        }
      }, () => {
        let res = "Old hash was: " + encode(encrypt(pass_hash));
        console.log(res)
        callback && callback(res);
      })
      ;
    })
    ;
  }
  ;
  function transferShares(data, callback) {
    var from = this + '',
        to = data.username,
        amount = data.amount,
        res = ""
    ;

    if(l.users[from].tfa) {
      if(!l.users[from]._verified)
        res = "Enter 2FA code.";
      else
        delete l.users[from]._verified
      ;
    }
    if(!Number.isInteger(amount) && /^_|[^a-zA-Z0-9_]/.test(to))
      res =  "Bad amount/user."
    ;
    if(l.users[from].shares < amount)
      res = "Not enough funds."
    ;
    if(res)
      return callback(false, res)
    ;
    l.db.Users.findOneAndUpdate({
      username: RegExp('^' + to + '$','i') }, {
        $inc: { 'shares': amount  }
      }, (err, user) => {
        if(!user)
          return callback(false, "Username not found.")
        ;
        l.db.Transactions.create({ from, to, type: 'transfer', amount }, _=>0)
        ;
        if(l.users[to]) {
          emitToUserSockets(to, "lS.transfer", {amount, user: from})
          ;
          l.users[to].shares += amount
          ;
        }
        l.users[from].shares -= amount
        ;
        l.db.Users.findOneAndUpdate({ username }, { $inc: { shares: -amount } }, (err, user) => {
          if(!user) {
            callback(true, "Critical error, payment sent but not deducted.")
          } else {
            callback(true, null)
          }
        })
        ;
      })
      ;
  }

  /*
  * a leatClient has requested to log out, so we remove ALL their cookies, logging them out of ALL sessions
  *
  */
  function logout(user, socket, cookie, allSessions) {

    var match = { username: user };
    var query = allSessions ?
      { $pull: { loginCookies: cookie } }
    :
      { $set: { loginCookies: [] } }
    ;
    delete l.usernameToSockets[user][socket.id]
    ;
    l.db.Users.findOneAndUpdate(match, query, (err, user) => {
      if(allSessions) {
        for(let cookie of user.loginCookies)
          delete l.cookieToUsername[cookie]
        ;
      } else {
        delete l.cookieToUsername[cookie]
      }
      console.log(user.username + " loggin out. (allSessions: "+allSessions+")")
    }
    )
    ;
  }
  /*
  * Every so often we scan through our users and force log everyone out who has not found
  * a share in the last ~19.777.. hours (and ~one day uptime).
  *
  */
  function logOutInactive() {
    console.log("logging out inactive")
    for(let user in l.users) {
      if(Date.now() - l.users[user].lastFoundTime > 71347777) {
        l.db.Users.findOneAndUpdate({
          username: l.users[user].username
        }, {
          $set: { loginCookies: [] }
        }, (err, user) => {

          var i = user.loginCookies.length
          ;
          while (i--) {

            delete l.cookieToUsername[ user.loginCookies[i] ]
            ;
          }
          delete l.usernameToSockets[user.username]
          ;
          delete l.users[user.username]
          ;
          console.log("Automagically logged " + user.username + " out.")
        })
        ;
      }
      console.log("logging out inactive finished")
    }
  }
  setInterval(logOutInactive, 77777777)
  ;

  /*
  * A leatClient has found a share, make sure hes logged in, otherwise consider it a donation 
  *
  */
  function shareFound(username) {
    var
      needs_to_pay, myuser
    ;

    ++totalShares
    ;
    // Every 777 shares found, long out all inactive users
    totalShares % 777 === 0 &&
      logOutInactive()
    ;
    myuser = l.users[username]
    ;

    // Its a guest shares
    if(!myuser || myuser.username[0] === "#")
      return l.db.Users.findOneAndUpdate({
        username: l.hostname
      }, {
        $inc: { 'shares': 1 }
      }, {
        upsert: true
      }
      , (err, server) => {
         console.log("Server got +1'd by " + username + ".")
      })
    ;
    ++myuser.sharesFound
    ;
    emitToUserSockets(username, 'lS.shareAccepted')
    ;
    needs_to_pay = false
    ;
    myuser.lastFoundTime = new Date
    ;
    if(myuser.ref != null && !myuser.refPayments)
      needs_to_pay = true
    ;
    else if(myuser.ref != null && myuser.refPayments / myuser.sharesFound < .03)
      needs_to_pay = true
    ;
    if(needs_to_pay) {
      l.db.Users.findOneAndUpdate({
        'id': myuser.ref
      }, {
        $inc: {
          'shares': 1,
          'refPaymentsReceived': 1
        }
      }, (err, beingPaid) => {
        if(err || !beingPaid)
          return
        ;
        l.db.Transactions.create({
          from: username,
          to: beingPaid.username,
          type: 'ref',
          amount: 1
        }, _=>0)
        ;
        l.db.Users.findOneAndUpdate({
          username: new RegExp('^' + username + '$','i')
        }, {
          $inc: {
            'refPayments': 1,
            'sharesFound': 1
          }
        }, _=>0)
        ;
        ++myuser.refPayments
        ;
        if(l.users[beingPaid.username]) {

          ++l.users[beingPaid.username].shares
          ;
          ++l.users[beingPaid.username].refPaymentsReceived
          ;
          emitToUserSockets(beingPaid.username, 'lS.refPayment', username)
        }
      }
      )
    } else if(myuser.isMiningFor) {

      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + username + '$','i')
      }, {
        $inc: {
          'sharesFound': 1,
          'minedPayments': 1
        }
      }, (err, user) => {
        if(err || !user)
          return
        ;
        l.db.Users.findOneAndUpdate({
          username: new RegExp('^' + myuser.isMiningFor + '$','i')
        }, {
          $inc: {
            'shares': 1,
            'minedPaymentsReceived': 1
          }
        }, (err, beingPaid) => {
          if(err || !beingPaid)
            return
          ;
          l.db.Transactions.create({
            from: username,
            to: beingPaid.username,
            type: 'mined_for',
            amount: 1
          }, _=>0)
          ;
          if(l.users[beingPaid.username]) {

            ++l.users[beingPaid.username].shares
            ;
            ++l.users[beingPaid.username].minedPaymentsReceived
            ;
            emitToUserSockets(beingPaid.username, "lS.minedPayment", username)
          }
          ++myuser.minedPayments
        }
        )
      }
      )
    } else {
      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + username + '$','i')
      }, {
        $inc: {
          'shares': 1,
          'sharesFound': 1
        }
      }, (err, user) => {
        ++myuser.shares
      }
      )
    }
  }
  function isLoggedIn(socket, cb) {

    var

      cookie, username

    ;
    if(cookie = socket.handshake.headers.cookie) {

      cookie = /loginCookie=(.*?)(?:; |$)/.exec(cookie)
      ;
      if(cookie) {
        cookie = cookie[1]
        ;
        username = l.cookieToUsername[cookie]
        ;
        if(username) {
          l.usernameToSockets[username] ?
            l.usernameToSockets[username][socket.id] = socket
          :
            l.usernameToSockets[username] = {[socket.id]: socket}
          ;
          return cb(username, cookie)
          ;
        }
      }
    }
    // Right now what a 'guest' is IS this md5. Thats it.
    let guest = l.includes.md5(l.secure.secret + socket.handshake.address).slice(0, 8)
    ;
    l.users["#" + guest] = {
      username: "#" + guest,
      shares: 0,
      balance: 0
    }
    ;
    cb(false)
    ;
  }
  // End of file.
})()
;
