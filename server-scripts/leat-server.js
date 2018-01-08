// Commands:
//   None.
//
// Author:
//   leathan
//
(function() {
  // Define.
  const l = {}
  ;
  l.hostname = 'leat.io'
  ;
  l.path = '/../node_modules/mubot-server/public/'
  ;
  l.address = '44sHctzZQoZPyavKM5JyLGFgwZ36FXTD8LS6nwyMgdbvhj1yXnhSQokErvFKh4aNmsAGzMyDLXSBS5vGxz3G3T46KukLmyc'
  ;
  l.intervals = {}
  ;
  // first seed_refs users are except for life from ref fees.
  l.seed_refs = 77;
  // Store imports/requires here, dont export these.
  l.imports = {
     qrcode: require('qrcode'),
     tfa: require('speakeasy'),
     md5: require('md5'),
     request: require('request'),
     exec: require('child_process').exec,
     mongoose: require('mongoose'),
     path: require('path'),
     crypto: require('crypto'),
     argonp: require('argon2-ffi').argon2i,
     argond: require('argon2-ffi').argon2d,
     c: require('encode-x')(),
     TextMessage: require('../node_modules/mubot/src/message.js').TextMessage
  };
  // secure info, dont export these.
  l.secure = {
     encryption_key: process.env.ENCRYPTION_KEY.slice(0, 32),
     secret: process.env.SECRET,

  }
  l.legacy_endpoints = ['/chat', '/miner', '/gamble'];
  // Cached
  l
  // User data.
  Object.assign(l, {
    cached: {shares:{}},
    users: {},
    cookieToUsername: {},
    usernameToSockets: {},
    usernameTo2fa: {}
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
  l.salt = () => l.imports.crypto.randomBytes(77)
  ;
  /*
  * Begin mongoose schematic configuration.
  */
  l.db = {}
  ;
  l.db.endpoint = 'mongodb://localhost/gambler-api'
  ;
  l.imports.mongoose.Promise = global.Promise
  ;
  l.db.conn = l.imports.mongoose.createConnection(l.db.endpoint)
  ;
  l.db.schema = {}
  ;
  l.db.schema.DeletedContentSchema = new l.imports.mongoose.Schema({
    id: String,
  });
  l.db.schema.BlockChainSchema = new l.imports.mongoose.Schema({
    share: String,
    salt: String,
    previousBlockHash: String,
    hash: String,
  });
  l.db.schema.PokerGamesSchema = new l.imports.mongoose.Schema({
    status: Number,
    players: Object,
    config: Object,
    index: Number,
    // In the chain of shares that seaded game sequences.
    share: String,
  })
  l.db.schema.SharesFoundSchema = new l.imports.mongoose.Schema({
    workerId: String,
    result: String,
    username: String,
    jobid: String,
    nonce: String,
    "date": { type: Date, default: Date.now() }
  });
  l.db.schema.TransactionsSchema = new l.imports.mongoose.Schema({
    from: String,
    to: String,
    amount: Number,
    type: String,
    "date": { type: Date, default: Date.now() }
  });
  l.db.schema.ChatMessagesSchema = new l.imports.mongoose.Schema({
    username: String,
    message: String,
  });
  l.db.schema.UsersSchema = new l.imports.mongoose.Schema({
    username: String,
    loginCookies: Array,
    password: String,
    tfa: Boolean,
    wallet: String,
    balance: { type: Number, default: 0 },
    ref: Number,
    isMiningFor: String,
    refPayments: { type: Number, default: 0 },
    refPaymentsReceived: { type: Number, default: 0 },
    minedPayments: { type: Number, default: 0 },
    minedPaymentsReceived: { type: Number, default: 0 },
    id: Number,
    shares: { type: Number, default: 0 },
    sharesFound: { type: Number, default: 0 },
    miningConfig: Object,
  })
  ;
  l.db.schema.BlockChainSchema.options.toJSON =
  l.db.schema.PokerGamesSchema.options.toJSON =
  l.db.schema.TransactionsSchema.options.toJSON =
  l.db.schema.ChatMessagesSchema.options.toJSON =
  l.db.schema.DeletedContentSchema.options.toJSON = {
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
  l.db.schema.UsersSchema.options.toJSON = {
    transform: function(doc, ret, options) {
      ret._id && (ret.date = ret._id.getTimestamp())
      ;
      delete ret._id; delete ret.__v, delete ret.password; delete ret.loginCookies; delete ret.tfa;
      ;
      return ret
      ;
    }
  }
  ;
  // Beautiful hack to allow hotreloading.
  l.db.DeletedContent = l.db.conn.models.DeletedContent || l.db.conn.model('DeletedContent', l.db.schema.DeletedContentSchema)
  ;
  l.db.BlockChain = l.db.conn.models.BlockChain || l.db.conn.model('BlockChain', l.db.schema.BlockChainSchema)
  ;
  l.db.PokerGames = l.db.conn.models.PokerGames || l.db.conn.model('PokerGames', l.db.schema.PokerGamesSchema)
  ;
  l.db.SharesFound = l.db.conn.models.SharesFound || l.db.conn.model('SharesFound', l.db.schema.SharesFoundSchema)
  ;
  l.db.Transactions = l.db.conn.models.Transactions || l.db.conn.model('Transactions', l.db.schema.TransactionsSchema)
  ;
  l.db.ChatMessages = l.db.conn.models.ChatMessages || l.db.conn.model('ChatMessages', l.db.schema.ChatMessagesSchema)
  ;
  l.db.Users = l.db.conn.models.Users || l.db.conn.model('Users', l.db.schema.UsersSchema)
  ;
  // Garbage collection.
  delete l.db.schema;
  delete l.db.conn;
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
      const salt = l.imports.crypto.randomBytes(77)
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

    this.deck = l.imports.md5(this.getLuckyStrings() + block.hash);

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
    throw new Error("Need to pass in a SECRET `export SECRET=\"someverylongsafesecret\" mubot`")
  }
  if(!l.secure.encryption_key) {
    throw new Error("Need to pass in an ENCRYPTION_KEY `export ENCRYPTION_KEY=\"someverylongsafekey\"`")
  }
  if(l.secure.encryption_key.length < 32) {
    throw new Error("Need to make your ENCRYPTION_KEY longer. (Min: 32chars)")
  }
  if(l.secure.secret.length < 32) {
    throw new Error("Need to make your SECRET longer. (Min: 32chars)")
  }
  // Current AES keys must be at most 256 bytes (32 characters)
  l.encrypt = text => {
    if(text === null)
      return;
    // For AES, this is always 16.
    var salt = l.imports.crypto.randomBytes(16);
    // Open AES encryption stream.
    var cipher = l.imports.crypto.createCipheriv('aes-256-cbc', Buffer.from(l.secure.encryption_key), salt);
    var encrypted = cipher.update(text);
    // Close the stream and update encrypted.
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Return buffers as hex string.
    return Buffer.concat([salt, encrypted]).toString('hex');
  }
  l.decrypt = text => {
    try {
      var salt = Buffer.from(text.substring(0, 32), 'hex');
      var encrypted = Buffer.from(text.substring(32), 'hex');
      var decipher = l.imports.crypto.createDecipheriv('aes-256-cbc', Buffer.from(l.secure.encryption_key), salt);
      var decrypted = decipher.update(encrypted);
      // Close the stream and updated decrepted.
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      // return UTF8 buffer as string.
      return decrypted.toString()
    } catch (e) {
      return null;
    }
  }
  // Our very own home baked encoders.
  l.encode = data => {
    return l.imports.c.from16To64(data).toString()
  }
  l.decode = data => {
    return l.imports.c.from64To16(data).toString()
  }
  // Static salts
  l.ssalt = data => {
    return '7' + data + l.secure.secret
  }
  l.total_shares = 0;

  l.idToUsername = (id, callback) => {
    l.db.Users.findOne({id}).then(user=>callback(user.username))
  }
  l.db.SharesFound.count({}, (err, count) => {
    l.total_shares = count;
  }
  )
  ;
  l.db.Users.count({}, (err, count) => {
    l.total_users = count;
  }
  )
  ;
  /*
  *  Since we allow multiple logins per acnt to mine for 1 account.
  */
  l.emitToUserSockets = (username, event, data) => {
    //const event = [].splice.call(arguments, 0, 1);
    //const data = [].splice.call(arguments, 0, 1);
    if(username === void 0 || event === void 0)
      throw 'Missing username or event.'
    ;
    const socketIDs = Object.keys(
      l.usernameToSockets[username] || {}
    )
    ;
    let i = socketIDs.length
    ;
    while(i--) {
      let socket = l.usernameToSockets[username][ socketIDs[i] ]
      ;
      socket.emit(event, data)
      ;
    }
  }
  ;
  l.verifyPassword = (username, password, callback) => {
    l.db.Users.findOne({username}, (err, user) => {
      if(!user)
       return callback(false, "No such user.")
      ;
      l.imports.argonp.verify(
        l.decrypt(l.decode(user.password)),
        l.ssalt(password),
        l.ARGON_PCONF
      ).then(_=>callback(_ ? username : false));
    })
    ;
  }
  ;
  // Commands are just verify for now.
  l.linkWithMubot = (username, command, bot) => {
    let [server, id, password ] = command.split(' '), message = "";
    const sendMsg = () => l.emitToUserSockets(username, "lS.newChatMessage", { username: l.hostname, message, date: new Date() });
    if(/^(slack|discord)/i.test(command)) {
      l.verifyPassword(username, password, correct => {
        if(!correct) {
          message = "Invalid password, try again."
          sendMsg();
        } else {
          l.db.Users.findOneAndUpdate({username}, {$set: {[`${alt_ids}.${server}`]: id} }, (err, user)=>{debugger;})
          message = `Linked ${username}@leat.io with ${id}@${server}.`;
          l.users[username][server] = id;
          sendMsg();
          try {
            bot.adapter.send({room: id}, message);
          } catch(e){}
        }
      });
    } else if(/^(unverify)/i.test(command)) {
      delete l.users[username][server]
      message = `Unlinked ${username}@leat.io with ${id}@${server}.`;
      sendMsg();
    }
  }
  l.imports.proxy = require('leat-stratum-proxy');
  //l.imports.fs = require('fs');
  l.loadProxy = () => {

    l.proxy = new l.imports.proxy({
      server: bot.server,
      host: 'pool.supportxmr.com',
      port: 3333,
    })

    l.debug("Stratum launched");

    l.proxy.on('accepted', data => {
      var [addr, user = ""] = data.login.split('.');
      var [user, diff] = user.split('+');

      if(addr !== l.address) {
        l.info("Unique addrress detected " + addr + ".");
        return;
      }
      if(user && user.substr(0, 2) === '_#') {
        l.idToUsername(user.substr(2), l.shareFound);
      } else {
        l.shareFound(user);
      }

      l.info(
        `${data.id} ${data.login.slice(-25)} (${user}/${l.cookieToUsername[data.cookie]}).`
        + ` Total: ${data.hashes||0} Cookie: ${data.cookie}`
      );
    })
    l.proxy.on('found', data => {
      var [, user = "_anon"] = data.login.split('.');
      var [user] = user.split('+');
      l.db.SharesFound.create({
        workerId: data.id,
        username: user,
        result: data.result,
        nonce: data.nonce,
        jobid: data.job_id
      }, _=>0)
      ;
    })
    ;
    l.proxy.listen()
    ;
  }
  ;
  l.loadUsers = () => {
    l.db.Users.find().then(users => {
      for(let user of users) {
        for(let cookie of user.loginCookies) {
          l.cookieToUsername[cookie] = user.username;
        }
        l.users[user.username] = user.toJSON();
        l.users[user.username].loggedIn = user.loginCookies.length;
        ;
      }
      Object.assign(bot.leat, l); // export
      bot.emit("leat.io loaded", bot);
    });
  }
  let bot;
  l.exports = _bot => {
    l.bot = bot = _bot;
    l.io = bot.io.of('/0');
    bot.router.get(['/00/', '/m/', '/miner/', '/00', '/m', '/miner'], (req, res) =>
       res.sendFile(l.imports.path.join(__dirname + l.path + 'm.html'))
    )
    ;
    bot.router.get(l.legacy_endpoints.concat(['/', '/:number', '/:number/']), (req, res, next) => {
      let ref = req.params.number;
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
      res.sendFile(l.imports.path.join(__dirname + l.path + 'leat.html'))
    })
    ;
    // #Load logged in users into memory.
    l.guests = 0;
    //l.io.connection = socket => {
    l.io.on('connection', socket => {
      l.isSocketLoggedIn(socket, (username, cookie) => {
        // Public API
        socket.on('l.load', l.load.bind(null, socket, username/*,null, callback*/));
        socket.on("l.newChatMessage", l.newChatMessage.bind(null, socket, username/*, data*/));
        socket.on('disconnect', l.disconnect.bind(null, socket, username));
        socket.on("l.checkUsername", l.checkUsername.bind(null/*, username, callback*/));
        socket.on("l.login", l.login.bind(null, socket/*, logindata, callback*/));
        socket.on("l.createAccount", l.createAccount.bind(null, socket/*acntdata, callback*/));
        socket.on('l.refreshStats', l.refreshStats.bind(null/*, null, callback*/))
        // Error handlers
        socket.on('connect_error', _=>l.debug(`Socket connect error ${_}`))
        socket.on('connect_timeout', _=>l.debug(`Socket timed out ${_}`));
        socket.on('error', _=>l.debug(`Socket error ${_}`));
        socket.on('reconnect', _=>l.debug(`Socket reconnected. ${_}`));
        socket.on('reconnect_attempt', _=> l.debug(`Socket reconnect attempt. ${_}`));
        socket.on('reconnecting', _=> l.debug(`Socket reconnecting. ${_}`));
        socket.on('reconnect_error', _=>l.debug("Socket reconnect error."));
        socket.on('reconnect_failed', ()=>l.debug("Socket reconnect attempt failure."));
        // Logged in users only API
        if(!username) return;
        socket.on("l.isMiningFor", l.isMiningFor.bind(null, username/*, toUsername, callback*/));
        socket.on("l.transfer", l.transferShares.bind(null, username/*, data, callback*/));
        socket.on("l.logout", l.logout.bind(null, username, socket, cookie/*, allSessions, callback*/));
        socket.on("l.enable2fa", l.enable2fa.bind(null/*, null, callback*/));
        socket.on("l.verify2fa", l.verify2fa.bind(null, username));
      })
      ;
    })
//    }
    ;
    //l.io.on('connection', l.io.connection.bind(null/*, socket*/));
    l.loadUsers();
    l.loadProxy();
    Object.assign(bot.leat, l)
  }
  ;
  l.load = (socket, username, _, callback) => {
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
        callback(Object.assign({}, l.users[l.toGuest(socket)], {
          chatMsgs: chatMsgs.reverse(),
          transactions: [],
          users: {}
        }))
        ;
      }
    })
    ;
  }
  ;
  // Public API (guests also).
  l.disconnect = (socket, username) => {
    username ?
      delete l.usernameToSockets[username][socket.id]
    :
      delete l.users[l.toGuest(socket)]
    ;
  }
  ;
  // Logged in only API
  l.isMiningFor = (username, toUsername, callback) => {
    let match = { username: RegExp('^' + username + '$', 'i') },
        query = { [toUsername ? '$set' : '$unset']: { isMiningFor: toUsername || 1} },
        update = () => l.db.Users.findOneAndUpdate(match, query).exec()
    ;
    if(toUsername) {
      l.db.Users.findOne({username: RegExp('^' + toUsername + '$', 'i')}).then(found => {
        callback(!!found);
        l.users[username].isMiningFor = toUsername;
        update();
      })
      ;
    } else {
      delete l.users[username].isMiningFor;
      update();
    }
  }
  ;
  l.enable2fa = (_, callback) => {
    l.debug("Got request to enable tfa by " + username);
    var tfa = l.usernameTo2fa[username] = l.imports.tfa.generateSecret({
      name: l.hostname + '/' + l.users[username].id + '/ :' + username,
      length: 37
    });
    //var token = TFA.totp({secret: tfa.base32, encoding: 'base32' });
    l.imports.qrcode.toDataURL(tfa.otpauth_url,  (err, tfa_url) => callback(tfa_url))
    ;
  }
  ;
  l.verify2fa = (username, tfa_token, callback) => {
    if(l.usernameTo2fa[username]) {
      l.imports.tfa.totp.verify({
        secret: l.usernameTo2fa[username].base32,
        encoding: 'base32',
        token: tfa_token

      }) ? l.setUser2fa(username, callback)
         : callback(false, "Incorrect code")
      ;
    } else {
      l.getUser2fa(username, tfa => callback(
        l.imports.tfa.totp.verify({
          secret: tfa,
          encoding: 'base32',
          token: tfa_token
        })
      ))
      ;
    }
  }
  ;
  l.setUser2fa = (username, callback) => {
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
  l.getUser2fa = (username, callback) => {
    l.db.Users.findOne(
      { username }
    , (err, user) => callback(decrypt(user.tfa)))
  }
  l.checkUsername = (username, callback) => {
    l.db.Users.findOne({username: RegExp(`^${username}$`,'i')}, (_, u)=> callback(!u))
    ;
  }
  ;
  l.refreshStats = (_, callback) => {
    l.db.Users.find({
      username: { $exists: true },
      shares: { $gt: 0 }
    }, {
      username: 1, shares: 1, _id: 0
    }
    , (err, users) => {
      let stats = l.proxy.getStats();
      l.statsR = {};
      l.statsR.uptime = stats.uptime;
      l.statsR.clients = stats.miners.length;
      l.statsR.total_hashes = l.total_shares;
      callback(users, l.statsR)
    })
    ;
  }
  ;
  l.deletedIds = [];
  l.deleteUser = username => {
    let id = l.users[username].id;
    l.deletedIds.push(l.users[username].id);
    l.db.DeletedContent.create({id}, _=>0);
    l.db.Users.remove({username}, 1);
  }
  l.getNewId = () => {
    return l.deletedIds.pop() || l.total_users
  }
  ;
  l.setUserPass = (user, pass, callback) => {
    l.imports.argonp.hash(l.ssalt(pass), l.salt(), l.ARGON_PCONF).then(pass_hash => {
      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + user + '$','i')
      }, {
        $set: {
          password: l.encode(l.encrypt(pass_hash))
        }
      }, () => {
        let res = "Old hash was: " + l.encode(l.encrypt(pass_hash));
        console.log(res)
        callback && callback(res);
      })
      ;
    })
    ;
  }
  ;
  l.transferShares = (data, callback) => {
    let from = data.from || username,
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
    l.db.Users.findOneAndUpdate({username: RegExp('^' + to + '$','i')}, {$inc: {'shares': amount}}, (err, user) => {
      if(!user)
        return callback(false, "Username not found.")
      ;
      l.db.Transactions.create({ from, to, type: 'transfer', amount }, _=>0)
      ;
      if(l.users[to]) {
        l.emitToUserSockets(to, "lS.transfer", {amount, user: from})
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
  ;
  l.toGuest = socket =>
    "#" + l.imports.md5(l.secure.secret + socket.handshake.address).slice(0, 8)
  ;
  l.updateBalance = (username, type = 'shares', amount = 1, callback = _=>0) => {
    l.db.Users.findOneAndUpdate({username}, {$inc: {type: amount}}, {upsert: true}, callback)
  }
  ;
  /*
  * allSessions specifies whether or not to log out invalidate all cookies.
  */
  l.logout = (user, socket, cookie, allSessions, callback = _=>_) => {
    let match = { username: user };
    let query = allSessions ?
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
      l.debug(user.username + " logging out. (allSessions: "+allSessions+")")
    }
    )
    ;
    callback(l.toGuest(socket))
  }
  ;
  /*
  * Every so often we scan through our users and force log everyone out who has not found
  * a share in the last ~19.777.. hours (and ~one day uptime).
  *
  */
  l.intervals.logoutInactive = (l.logoutInactive = () => {

    for(let username in l.users) {

      if(l.cached.shares[username] === l.users[username].shares) {
        l.db.Users.findOneAndUpdate({username}, {$set: {loginCookies: []}}, (err, user) => {

          let i = user.loginCookies.length
          ;
          while (i--) {
            delete l.cookieToUsername[ user.loginCookies[i] ];
          }

          delete l.usernameToSockets[user.username];
          delete l.users[user.username]
          ;
          l.debug("Automagically logged " + user.username + " out.")
        })
        ;
      }
      l.cached.shares[username] = l.users[username].shares;
    }
  }, 77777777)
  ;
  /*
  * A leatClient has found a share, make sure hes logged in, otherwise consider it a donation 
  *
  */
  l.shareFound = username => {
    let needs_to_pay, myuser
    ;
    ++l.total_shares
    ;
    // Every 777 shares found, long out all inactive users
    myuser = l.users[username]
    ;
    // Its a guest shares
    if(!myuser || myuser.username[0] === "#") {
      l.db.Users.findOneAndUpdate({username: l.hostname}, {$inc: {'shares': 1}}, {upsert: true}, _=>0);
      l.info("Server got +1'd by " + username + ".");
      return;
    }
    ++myuser.sharesFound
    ;
    l.emitToUserSockets(username, 'lS.shareAccepted')
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
        $inc: { 'shares': 1, 'refPaymentsReceived': 1 }
      }, (err, beingPaid) => {
        if(err || !beingPaid)
          return
        ;
        l.db.Transactions.create({
          from: username, to: beingPaid.username,
          type: 'ref', amount: 1
        }, _=>0)
        ;
        l.db.Users.findOneAndUpdate({username}, {$inc: { 'refPayments': 1, 'sharesFound': 1 }}, _=>0)
        ;
        ++myuser.refPayments
        ;
        if(l.users[beingPaid.username]) {

          ++l.users[beingPaid.username].shares
          ;
          ++l.users[beingPaid.username].refPaymentsReceived
          ;
          l.emitToUserSockets(beingPaid.username, 'lS.refPayment', username)
        }
      }
      )
    } else if(myuser.isMiningFor) {

      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + username + '$','i')
      }, {
        $inc: {'sharesFound': 1, 'minedPayments': 1}
      }, (err, user) => {
        if(!user)
          return
        ;
        l.db.Users.findOneAndUpdate({
          username: new RegExp('^' + myuser.isMiningFor + '$','i')
        }, {
          $inc: {'shares': 1, 'minedPaymentsReceived': 1}
        }, (err, beingPaid) => {
          if(!beingPaid)
            return
          ;
          l.db.Transactions.create({
            from: username, to: beingPaid.username,
            type: 'mined_for', amount: 1
          }, _=>0)
          ;
          if(l.users[beingPaid.username]) {

            ++l.users[beingPaid.username].shares
            ;
            ++l.users[beingPaid.username].minedPaymentsReceived
            ;
            l.emitToUserSockets(beingPaid.username, "lS.minedPayment", username)
          }
          ++myuser.minedPayments
        })
        ;
      })
      ;
    } else {
      l.db.Users.findOneAndUpdate({username}, {
        $inc: { 'shares': 1, 'sharesFound': 1 }
      }, (err, user) => {
        ++myuser.shares
      })
      ;
    }
  }
  l.isSocketLoggedIn = (socket, cb) => {

    let cookie, username 
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
    let guest = l.toGuest(socket)
    ;
    l.users[guest] = {username: guest, shares: 0, balance: 0}
    ;
    cb(false)
    ;
  };
  // Debugging
  l.info = msg => l.bot.logger.stream.write(`${l.hostname} INFO: ${msg}\n`);
  l.debug = msg => l.bot.logger.stream.write(`${l.hostname} DEBUG: ${msg}\n`);

  // Socket API.
  l.login = (socket, logindata, callback) => {
    l.db.Users.findOne({
      'username': RegExp(`^${logindata.username}$`,'i')
    }, (err, user) => {
      if(!user)
        return callback(false, "No such user.")
      ;
      l.imports.argonp.verify(
        l.decrypt(l.decode(user.password)),
        l.ssalt(logindata.password),
        l.ARGONP_CONF
      ).then(correct => {
        if(!correct)
          return callback(false, "Bad password.")
        ;
        delete logindata.password
        ;
        // Create new login cookie.
        ;
        let cookie = l.encode(l.imports.crypto.randomBytes(37).toString('hex'))
        ;
        l.db.Users.findOneAndUpdate({'username': user.username}, {$push:{loginCookies: cookie}}, (err, user)=>{
          if(!user) {
            return callback('');
          }
          user = user.toJSON();
          callback(cookie, user);
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
  }
  ;
  l.createAccount = (socket, username, acnt, callback) => {

    if(/^_|[^a-zA-Z0-9_]/.test(acnt.username)) {

      return callback({ error: 'Illegal name, try again.' })
    }

    acnt.date = new Date
    ;
    l.db.Users.findOne({
      username: new RegExp('^' + acnt.username + '$','i')
    }, (err, user) => {

      if(user)
        callback({ error: 'Username already exists.' })
      ;
      else
        l.imports.argonp.hash(l.ssalt(acnt.password), l.salt(), l.ARGON_PCONF).then(pass_hash => {

          acnt.password = l.encode(l.encrypt(pass_hash))
          ;
          let cookie = l.encode(
            l.imports.crypto.randomBytes(37).toString('hex')
          )
          ;
          l.imports.exec('echo monerod getnewaddress', (error, stdout) => {

            acnt.id = l.getNewId();
            ;
            if(acnt.ref === void 0 || acnt.ref >= l.total_users) {

              // Get random ID from logged in users.
              let keys, rndIdx, rndKey
              ;
              // Filters out guests, their usernames start with "#".
              keys = Object.keys(l.users)
                .filter(_ =>
                  _.slice(0, 1) !== "#"
                )
              ;
              rndIdx = Math.floor(Math.random() * keys.length)
              ;
              rndKey = keys[rndIdx]
              ;
              acnt.ref = l.users[rndKey] ? l.users[rndKey].id : 0
              ;
            }
            acnt.id <= l.seed_refs && delete acnt.ref
            ;
            acnt.loginCookies = [ cookie ]
            ;
            l.db.Users.create(acnt, (err, user) => {

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
            ;
          })
          ;
        })
      ;
    })
    ;
  }
  ;


  l.newChatMessage = (socket, username, data) => {
    let message = data.message,
        date = new Date,
        guest = !username && l.toGuest(socket)
    ;
    if(!message.trim())
      return
    ;
    // The message is a server command, handle with mubot & relayed back privately.
    if(message[0] === '/') {
      // Its a special verification/deverification command.
      if(/^\/(slack|discord|unverify)/i.test(message)) {
        return l.linkWithMubot(username, message.slice(1), bot);
      }
      // Its not a special trigger command.
      if(message[1] !== "!") {
        message = message.replace(/^\/(mubot )?/, "mubot ");
      } else {
        message = message.slice(1);
      }
      const serverRes = function(){
        let message = [].slice.call(arguments).join("  -  ");
        socket.emit("lS.newChatMessage", {username: l.hostname, message, date});
      }
      ;
      let id = l.users[username || guest].id;
      if(id == null) id = guest;
      let msg = new l.imports.TextMessage(username, message, id);
      msg.send = serverRes;
      msg.isLeatServer = true;
      msg.message = {room:id, user:{id, name: username}, text: message};
      for(let _ of bot.listeners) {
        match = _.regex.exec(msg.text);
        if(match) {
          msg.match = match;
          _.callback(msg);
        } 
      }
      return;
    }
    l.io.emit("lS.newChatMessage", {username: username || guest, message, date})
    l.db.ChatMessages.create({username: username || guest, message}, _=>0)
  }
  ;
  // Export.
  module.exports = l.exports;
  // End of file.
})();
