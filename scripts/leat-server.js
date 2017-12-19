// Commands:
//   None.
//
// Author:
//   leathan
//
(function() {
  const HOSTNAME = 'leat.io'
  ;
  // Our debug level (will depreciate for --inspect)
  const DEBUG = process.env.DEBUG || false
  ;
  // For users exempt for life from referals
  const SEED_REFS = 77;
  // For authy apps and such.
  const qrcode = require('qrcode')
  ;
  // 2fa
  const TFA = require('speakeasy')
  ;
  // Quick guest hash ip-auth
  const md5 = require('md5')
  ;
  const SERVER_ROOT = '/../node_modules/hubot-server/public/leat.html'
  ;
  const DATABASE_ENDPOINT = 'mongodb://localhost/gambler-api'
  ;
  // Used for storing cookie data on db.
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.slice(0, 32)
  ;
  // Depreciated, but still used in static salts.
  const SECRET = process.env.SECRET
  ;
  // These currently map to a random online user id.
  const LEGACY_ENDPOINTS = ['/chat', '/miner', '/gamble']
  ;
  const users = {}
    , cookieToUsername = {}
    , usernameToSockets = {}
    , usernameTo2fa = {}
  ;
  // Debugging
  global.self = {
    users,
    cookieToUsername,
    usernameToSockets,
    usernameTo2fa
  }
  ;
  global.self.argon = {}
  ;
  // Easy http requests.
  const request = require('request')
  ;
  // Used to access monero daemon.
  const exec = require('child_process').exec
  ;
  // Our db.
  const mongoose = require('mongoose')
  ;
  // OS independant path resolves.
  const path = require('path')
  ;
  // For encryption.
  const crypto = require('crypto')
  ;
  // Our password / data hashers.
  const argonp = require('argon2-ffi').argon2i
  ;
  const argond = require('argon2-ffi').argon2d
  ;
  // Our salter.
  const salt = () => crypto.randomBytes(77)
  ;
  // Infinite base encoder I made and maintain.
  const c = require('encode-x')()
  ;
  Object.assign(self, {c})
  ;
  // Debugging
  global.self.argonp = argonp
  ;
  /* 
  * $argon2i$v=19$m=7777,t=77,p=77$ 7+crypto.randomBytes+secret $ hash
  * Memory cost 7777 KiB (1024*7777), relative time cost, and the number 
  * of sustained concurrent threads needed.
  */
  const ARGON_PCONF = self.argon.conf = {
    parallelism: 77,
    memoryCost: 7777,
    timeCost: 77
  }
  ;
  /*
  * Begin mongoose schematic configuration.
  */
  mongoose.Promise = global.Promise
  ;
  const conn = mongoose.createConnection(DATABASE_ENDPOINT)
  
  , BlockChainSchema = new mongoose.Schema({
    'share': String,
    'salt': String,
    'previousBlockHash': String,
    'hash': String,
    "date": { type: Date, default: Date.now() }
  })
  , PokerGamesSchema = new mongoose.Schema({
    'status': Number,
    'players': Object,
    'config': Object,
    'index': Number,
    // In the chain of shares that seaded game sequences.
    'share': String,
    "date": { type: Date, default: Date.now() }
  })
  , SharesFoundSchema = new mongoose.Schema({
    'workerId': String,
    'result': String,
    'username': String,
    'jobid': String,
    'nonce': String,
    "date": { type: Date, default: Date.now() }
  })
  , TransactionsSchema = new mongoose.Schema({
    'from': String,
    'to': String,
    'amount': Number,
    'type': String,
    "date": { type: Date, default: Date.now() }
  })
  , ChatMessagesSchema = new mongoose.Schema({
    'username': String,
    'message': String,
  })
  , UsersSchema = new mongoose.Schema({
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
  TransactionsSchema.options.toJSON = ChatMessagesSchema.options.toJSON = {
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
  UsersSchema.options.toJSON = {
    transform: function(doc, ret, options) {
      ret._id && (
        ret.date = ret._id.getTimestamp()
      )
      ;
      delete ret._id; delete ret.__v, delete ret.password; delete ret.loginCookies
      ;
      return ret
      ;
    }
  }
  ;
  // Beautiful hack to allow hotreloading.
  const BlockChain = conn.models.BlockChain || conn.model('BlockChain', BlockChainSchema)
  ;
  const PokerGames = conn.models.PokerGames || conn.model('PokerGames', PokerGamesSchema)
  ;
  const SharesFound = conn.models.SharesFound || conn.model('SharesFound', SharesFoundSchema)
  ;
  const Transactions = conn.models.Transactions || conn.model('Transactions', TransactionsSchema)
  ;
  const ChatMessages = conn.models.ChatMessages || conn.model('ChatMessages', ChatMessagesSchema)
  ;
  const Users = conn.models.Users || conn.model('Users', UsersSchema)
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

/*  var leatProxy = global.self.leatProxy = require('leat-stratum-proxy');

  const fs = require('fs')



  leatProxy = new leatProxy({
    server = 
    host: 'pool.supportxmr.com',
    port: 3333,
    key: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/privkey.pem'),
    cert: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/cert.pem')
  })
  leatProxy.listen(3000);
  console.log("Stratum launched on port 3000.")
*/
  /*    -- Events -- 
  leatProxy.on('job', console.log)
  leatProxy.on('error', console.log)
  leatProxy.on('authed', console.log)
  leatProxy.on('open', console.log)
  leatProxy.on('close', console.log)
  */

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
    BlockChain.findOne().sort({
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
        BlockChain.create(block)
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
  Object.assign(global.self, {
    lS: lS
  })
  ;/*
  leatProxy.on('accepted', data => {
    shareFound(data.login.split(".")[1])
    ;
    console.log(
      "Work done by ("+data.login.split(".")[1]+"/"+cookieToUsername[data.cookie]+"). Total: "+data.hashes||0
    )
console.log(data.cookie)*/
    //lS.isBlockNeeded() && lS.mineBlock(data.result)
    //;


    //var user = data.login.split(".")[1]
    //;
    //shareFound(users[user] ? users[user].username : HOSTNAME) //, data.cookie)
    //;
    /*(if(!user) {
      if(DEBUG) console.log("Work done for server ("+data.cookie+") (No username)")
      ;
    }
    if(!data.cookie || data.login[0] === "#") {
      if(DEBUG) console.log("Work done for server (Guest miner).")
      ;
    } else {
      if(user = user[1]) {
        if(user !== cookieToUsername[data.cookie]) {
          if(DEBUG) console.log("Work done for server ("+user+") (Invalid cookie)")
          ;
          try {
            emitToUserSockets(user, 'lS.shareRejected', 'Invalid cookie.')
          } catch(e) {}
          ;
        } else
          console.log(
            "Work done by ("+user+"/"+cookieToUsername[data.cookie]+"). Total: "+data.hashes||0
          )
        ;
      }
    }
    shareFound(users[user].username || HOSTNAME, data.cookie || null)
    ;
    lS.isBlockNeeded() && lS.mineBlock(data.result)
    ;*/
  //})
  ;
/*  leatProxy.on('found', data => {

    /*if(!data.cookie || /#/.test(data.login))
      return
    ;
    var user = data.login.match(/\.(.+)$/)
    ;
    if(user)
      user = user[1]
    ;*//*
    SharesFound.create({
      workerId: data.id,
      username: data.login.split('.')[1] || '_anon',
      result: data.result,
      nonce: data.nonce,
      jobid: data.job_id
    }, _=>0)
    ;
  })
  ;*/
  function Player(name) {

    var user = users[name];

    if(!user)
      throw 'User not in memory.'
    if(!user.shares)
      throw 'No balance.'

    this.username = user.username;
    this.shares = user.shares;

    this.games = []

    Object.asign(this, {
      get luckyS() {
        let user = users[this.username];
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

    this.deck = md5(this.getLuckyStrings() + block.hash);

    for(let i = 0, l = this.players.length; i < l; ++i) {
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
    users[username] && emitToUserSockets(username, "lS.Poker.disconnect", reason);

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

  if(!SECRET) {
    throw new Error("Need to pass in a SECRET `SECRET=\"someverylongsafesecret\" mubot`")
  }
  if(!ENCRYPTION_KEY) {
    throw new Error("Need to pass in an ENCRYPTION_KEY `ENCRYPTION_KEY=\"someverylongsafekey\"`")
  }
  if(ENCRYPTION_KEY.length < 32) {
    throw new Error("Need to make your ENCRYPTION_KEY longer. (Min: 32chars)")
  }
  if(SECRET.length < 32) {
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
    return '7' + data + SECRET
  }
  var totalShares = 0;

  // #Load logged in users into memory.
  Users.find().then(all_users => {

    for(let i = 0, l = all_users.length; i < l; ++i) {
      let user = all_users[i]
      ;
      for(let i = 0, l = user.loginCookies.length; i < l; ++i) {
        let cookie = user.loginCookies[i]
        ;
        cookieToUsername[cookie] = user.username
        ;
      }
      users[user.username] = user.toJSON()
      ;
    }

  }
  )
  SharesFound.count({}, (err, count) => {
    totalShares = count;
  }
  )
  var leatProxy;
  module.exports = bot => {

    leatProxy = require('leat-stratum-proxy');
    const fs = require('fs')
    leatProxy = new leatProxy({
      server: bot.server,
      host: 'pool.supportxmr.com',
       port: 3333,
       key: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/privkey.pem'),
      cert: fs.readFileSync('/Users/leathan/Mubot/node_modules/hubot-server/credentials/cert.pem')
    })
    leatProxy.listen();
    console.log("Stratum launched on port 3000.")

    leatProxy.on('accepted', data => {
      shareFound(data.login.split(".")[1])
      ;
      console.log(
        "Work done by ("+data.login.split(".")[1]+"/"+cookieToUsername[data.cookie]+"). Total: "+data.hashes||0
      )
     console.log(data.cookie)
    })
    leatProxy.on('found', data => {
      SharesFound.create({
        workerId: data.id,
        username: data.login.split('.')[1] || '_anon',
        result: data.result,
        nonce: data.nonce,
        jobid: data.job_id
      }, _=>0)
      ;
    })
    ;
    // One time time out to let the server load all the data into memory
    setTimeout(main.bind(this, bot), 7);

    bot.router.get(LEGACY_ENDPOINTS.concat(['/', '/:number/']), (req, res, next) => {
      if(req.path === '/') {
        let keys = Object.keys(users)
        let rndIdx = Math.floor(Math.random() * keys.length);
        let rndKey = keys[rndIdx] | 0;
        // If no one is online keys[x] === undefined.
        req.params.number = users[rndKey] ? users[rndKey].id : 0;
      }
      if(/[^0-9]/.test(req.params.number))
        return next()
      if(req.cookies && !Number.isInteger(req.cookies.ref))
        res.cookie('ref', req.params.number)
      res.sendFile(path.join(__dirname + SERVER_ROOT))
    }
    )
  }
  ;
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
      usernameToSockets[username] || {}
    )
    ;
    var i = socketIDs.length
    ;
    while(i--) {
      let socket = usernameToSockets[username][ socketIDs[i] ]
      ;
      socket.emit(event, data)
      ;
    }
  }

  function main(bot) {

    const io = global.self.io = bot.io.of('/0');
    var guests = 0;

    global.self.Users = Users;

    io.on('connection', socket => {

      isLoggedIn(socket, (username, cookie) => {

        socket.on('lC.load', (_, callback) => {
          ChatMessages.find().sort({ _id: -1}).limit(20).exec(
          (err, chatMsgs) => {
            if(username) {
              Transactions.find({
                $or: [
                  { from: username }, { to: username }
                ]
              }, { __v: 0 }).sort({ _id: -1 }).limit(777).exec(
              (err, trans) => {
                  callback(Object.assign({}, users[username], {
                    chatMsgs: chatMsgs.reverse(),
                    transactions: trans.reverse(),
                    users: users
                  }
                  )
                )
              }
              )
            } else {
              callback(Object.assign({}, users[toGuest()], {
                chatMsgs: chatMsgs.reverse(),
                transactions: [],
                users: users
              }))
              ;
            }
          })
          ;
        })
        ;
        function toGuest() {
          return "#" + md5(SECRET + socket.handshake.address).slice(0, 8)
          ;
        }
        socket.on("lC.newChatMessage", data => {
          var message = data.message,
              date = new Date
          ;
          if(!message.trim())
            return
          ;
          io.emit("lS.newChatMessage", {username: username || toGuest(), message, date})
          ChatMessages.create({
            username: username || toGuest(),
            message
          }, _=>0)
        })
        ;
        socket.on('disconnect', () => {
          username ?
            delete usernameToSockets[username][socket.id]
          :
            delete users[toGuest()]
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
          user ? users[username].isMiningFor = user : delete users[username].isMiningFor
          ;
          callback(!!users[user])
          ;
          users[user] && Users.findOneAndUpdate(match, query).exec()
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
          var tfa = usernameTo2fa[username] = TFA.generateSecret({
            name: HOSTNAME + '/' + users[username].id + '/ :' + username,
            length: 37
          });
          //var token = TFA.totp({secret: tfa.base32, encoding: 'base32' });
          qrcode.toDataURL(
            tfa.otpauth_url,
            (err, tfa_url) => callback(tfa_url || err)
          )
        })
        ;
        socket.on("lC.verify2fa", (tfa_token, callback) => {

          if(usernameTo2fa[username]) {
            TFA.totp.verify({
              secret: usernameTo2fa[username].base32,
              encoding: 'base32',
              token: tfa_token

            }) ? setUser2fa(username, callback)
               : callback(false, "Incorrect code")
            ;
          } else {
            getUser2fa(username, tfa => callback(
              TFA.totp.verify({
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
          Users.findOneAndUpdate(
          { username },
          {
            $set: {
              tfa: encrypt(usernameTo2fa[username].base32)
            }
          }
          , (err, user) => {
            callback(!!user, !user && "User not updated")
            delete usernameTo2fa[username];
          }
          )
        }
        function getUser2fa(username, callback) {
          Users.findOne(
            { username }
          , (err, user) => callback(decrypt(user.tfa)))
        }
      }
      )
      socket.on('lC.refreshStats', (_, callback) => {
        Users.find({
          username: { $exists: true },
          shares: { $gt: 0 }
        }, {
          username: 1, shares: 1, _id: 0
        }
        , (err, users) => {
          SharesFound.count({}, (err, count) => {
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
        Users.findOne({
          username: RegExp('^' + username + '$','i')
        }, (err, user) => {
          if(err)
            return next(err)
          ;
          callback(!!user)
          ;
        })
        ;
      })
      ;
      socket.on("lC.login", (logindata, callback) => {
        Users.findOne({
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
            var cookie = encode(
              crypto.randomBytes(37).toString('hex')
            )
            ;
            Users.findOneAndUpdate({
              'username': user.username
            }, {
              $push: { loginCookies: cookie }
            }, (err, user) => {
              if(!user) return callback('')
              ;
              callback(cookie)
              ;
              cookieToUsername[cookie] = user.username
              ;
              // Add socket or create sockets obj and add.
              usernameToSockets[user.username] ?
                usernameToSockets[user.username][socket.id] = socket
              :
                usernameToSockets[user.username] = {[socket.id]: socket}
              ;
              users[user.username] = user.toJSON()
              ;
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
        Users.findOne({
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

                Users.count({}, function(err, count) {

                  acntdata.id = count
                  ;
                  if(acntdata.ref === void 0 || acntdata.ref >= count) {

                    // Get random ID from logged in users.
                    let keys, rndIdx, rndKey
                    ;
                    // Filters out guests, their usernames start with "#".
                    keys = Object.keys(
                      users.filter(_ =>
                        _.slice(0, 1) !== "#"
                      )
                    )
                    ;
                    rndIdx = Math.floor(Math.random() * keys.length)
                    ;
                    rndKey = keys[rndIdx]
                    ;
                    acntdata.ref = users[rndKey] ? users[rndKey].id : 0
                    ;
                  }
                  acntdata.id <= SEED_REFS && delete acntdata.ref
                  ;
                  acntdata.loginCookies = [ cookie ]
                  ;
                  Users.create(acntdata, (err, user) => {

                    users[user.username] = user.toJSON()
                    ;
                    usernameToSockets[user.username] = {[socket.id]: socket}
                    ;
                    cookieToUsername[cookie] = user.username
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
  global.self.setUserPass = (user, pass) => {
    argonp.hash(ssalt(pass), salt(), ARGON_PCONF).then(pass_hash => {
      Users.findOneAndUpdate({
        username: new RegExp('^' + user + '$','i')
      }, {
        $set: {
          password: encode(encrypt(pass_hash))
        }
      }, () => {
        console.log("Old hash was: " + encode(encrypt(pass_hash)))
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

    if(users[from].tfa) {
      if(!users[from]._verified)
        res = "Enter 2FA code.";
      else
        delete users[from]._verified
      ;
    }
    if(!Number.isInteger(amount) && /^_|[^a-zA-Z0-9_]/.test(to))
      res =  "Bad amount/user."
    ;
    if(users[from].shares < amount)
      res = "Not enough funds."
    ;
    if(res)
      return callback(false, res)
    ;
    Users.findOneAndUpdate({
      username: RegExp('^' + to + '$','i') }, {
        $inc: { 'shares': amount  }
      }, (err, user) => {
        if(!user)
          return callback(false, "Username not found.")
        ;
        Transactions.create({ from, to, type: 'transfer', amount }, _=>0)
        ;
        if(users[to]) {
          emitToUserSockets(to, "lS.transfer", {amount, user: from})
          ;
          users[to].shares += amount
          ;
        }
        users[from].shares -= amount
        ;
        Users.findOneAndUpdate({ username }, { $inc: { shares: -amount } }, (err, user) => {
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
    delete usernameToSockets[user][socket.id]
    ;
    Users.findOneAndUpdate(match, query, (err, user) => {
      if(allSessions) {
        for(let cookie of user.loginCookies)
          delete cookieToUsername[cookie]
        ;
      } else {
        delete cookieToUsername[cookie]
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
    for(let user in users) {
      if(Date.now() - users[user].lastFoundTime > 71347777) {
        Users.findOneAndUpdate({
          username: users[user].username
        }, {
          $set: { loginCookies: [] }
        }, (err, user) => {

          var i = user.loginCookies.length
          ;
          while (i--) {

            delete cookieToUsername[ user.loginCookies[i] ]
            ;
          }
          delete usernameToSockets[user.username]
          ;
          delete users[user.username]
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

    //if(cookieToUsername[cookie] !== username) {
    //  console.log("Cookie did not match username!")
    //  ;
    //  return
    //}

    ++totalShares
    ;
    // Every 777 shares found, long out all inactive users
    totalShares % 777 === 0 &&
      logOutInactive()
    ;
    myuser = users[username]
    ;
    // Its a guest shares
    if(!myuser || myuser.username[0] === "#")
      return Users.findOneAndUpdate({
        username: HOSTNAME 
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
      Users.findOneAndUpdate({
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
        Transactions.create({
          from: username,
          to: beingPaid.username,
          type: 'ref',
          amount: 1
        }, _=>0)
        ;
        Users.findOneAndUpdate({
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
        if(users[beingPaid.username]) {

          ++users[beingPaid.username].shares
          ;
          ++users[beingPaid.username].refPaymentsReceived
          ;
          emitToUserSockets(beingPaid.username, 'lS.refPayment', username)
        }
      }
      )
    } else if(myuser.isMiningFor) {

      Users.findOneAndUpdate({
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
        Users.findOneAndUpdate({
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
          Transactions.create({
            from: username,
            to: beingPaid.username,
            type: 'mined_for',
            amount: 1
          }, _=>0)
          ;
          if(users[beingPaid.username]) {

            ++users[beingPaid.username].shares
            ;
            ++users[beingPaid.username].minedPaymentsReceived
            ;
            emitToUserSockets(beingPaid.username, "lS.minedPayment", username)
          }
          ++myuser.minedPayments
        }
        )
      }
      )
    } else {
      Users.findOneAndUpdate({
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
        username = cookieToUsername[cookie]
        ;
        if(username) {
          usernameToSockets[username] ?
            usernameToSockets[username][socket.id] = socket
          :
            usernameToSockets[username] = {[socket.id]: socket}
          ;
          return cb(username, cookie)
          ;
        }
      }
    }
    // Right now what a 'guest' is IS this md5. Thats it.
    let guest = md5(SECRET + socket.handshake.address).slice(0, 8)
    ;
    users["#" + guest] = {
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
