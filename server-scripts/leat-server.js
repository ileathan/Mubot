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
  // Debugging

  l.imports = {
     proxy: require('leat-stratum-proxy'),
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
  /*if(!l.config.secret) {
    throw new Error("Need to pass in a SECRET `export SECRET=\"someverylongsafesecret\" mubot`")
  }
  if(!l.config.encryption_key) {
    throw new Error("Need to pass in an ENCRYPTION_KEY `export ENCRYPTION_KEY=\"someverylongsafekey\"`")
  }
  if(l.config.encryption_key.length < 32) {
    throw new Error("Need to make your ENCRYPTION_KEY longer. (Min: 32chars)")
  }
  if(l.config.secret.length < 32) {
    throw new Error("Need to make your SECRET longer. (Min: 32chars)")
  }*/
  Object.assign(l, {
    hostname: 'leat.io',
    intervals: null,
    cached: {shares:{}},
    users: {},
    cookieToUsername: {},
    usernameToSockets: {},
    usernameTo2fa: {},
    config: {
      encryption_key: process.env.ENCRYPTION_KEY.slice(0, 32),
      secret: process.env.SECRET,
      path: '/../node_modules/mubot-server/public/',
      address: '44sHctzZQoZPyavKM5JyLGFgwZ36FXTD8LS6nwyMgdbvhj1yXnhSQokErvFKh4aNmsAGzMyDLXSBS5vGxz3G3T46KukLmyc',
      // first seed_refs users are except for life from ref fees.
      seed_refs: 77,
      legacy_endpoints: ['/chat', '/miner', '/gamble'],
      argon: {
        parallelism: 77,
        memoryCost: 7777,
        timeCost: 77
      },
      db: {
        endpoint: 'mongodb://localhost/gambler-api',
        DeletedContentSchema: new l.imports.mongoose.Schema({
          id: String,
        }),
        BlockChainSchema: new l.imports.mongoose.Schema({
          share: String,
          salt: String,
          previousBlockHash: String,
          hash: String,
        }),
        PokerGamesSchema: new l.imports.mongoose.Schema({
          status: Number,
          players: Object,
          config: Object,
          index: Number,
          // In the chain of shares that seaded game sequences.
          share: String,
        }),
        SharesFoundSchema: new l.imports.mongoose.Schema({
          workerId: String,
          result: String,
          username: String,
          jobid: String,
          nonce: String,
          date: { type: Date, default: Date.now() }
        }),
        TransactionsSchema: new l.imports.mongoose.Schema({
          from: String,
          to: String,
          amount: Number,
          type: String,
          date: { type: Date, default: Date.now() }
        }),
        ChatMessagesSchema: new l.imports.mongoose.Schema({
          username: String,
          message: String,
        }),
        UsersSchema: new l.imports.mongoose.Schema({
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
          altIds: Object,
          shares: { type: Number, default: 0 },
          sharesFound: { type: Number, default: 0 },
        })
      },
    }
  })


  l.db = { conn: l.imports.mongoose.createConnection(l.config.db.endpoint) };
  Object.assign(l, {
    db: {
      DeletedContent: l.db.conn.models.DeletedContent || l.db.conn.model('DeletedContent', l.config.db.DeletedContentSchema),
      BlockChain: l.db.conn.models.BlockChain || l.db.conn.model('BlockChain', l.config.db.BlockChainSchema),
      PokerGames: l.db.conn.models.PokerGames || l.db.conn.model('PokerGames', l.config.db.PokerGamesSchema),
      SharesFound: l.db.conn.models.SharesFound || l.db.conn.model('SharesFound', l.config.db.SharesFoundSchema),
      Transactions: l.db.conn.models.Transactions || l.db.conn.model('Transactions', l.config.db.TransactionsSchema),
      ChatMessages: l.db.conn.models.ChatMessages || l.db.conn.model('ChatMessages', l.config.db.ChatMessagesSchema),
      Users: l.db.conn.models.Users || l.db.conn.model('Users', l.config.db.UsersSchema)
    }
  })
  ;

  l.config.db.BlockChainSchema.options.toJSON =
  l.config.db.PokerGamesSchema.options.toJSON =
  l.config.db.TransactionsSchema.options.toJSON =
  l.config.db.ChatMessagesSchema.options.toJSON =
  l.config.db.DeletedContentSchema.options.toJSON = {
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
  l.config.db.UsersSchema.options.toJSON = {
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

  l.utils = {
    info: msg => console.log(`${l.hostname} INFO: ${msg}\n`),
    debug: msg => console.log(`${l.hostname} DEBUG: ${msg}\n`),
    encrypt: text => {
      if(text === null)
        return;
      // For AES, this is always 16.
      var salt = l.imports.crypto.randomBytes(16);
      // Open AES encryption stream (Current AES keys must be at most 256 bytes - 32 characters).
      var cipher = l.imports.crypto.createCipheriv('aes-256-cbc', Buffer.from(l.config.encryption_key), salt);
      var encrypted = cipher.update(text);
      // Close the stream and update encrypted.
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return Buffer.concat([salt, encrypted]).toString('hex');
    },
    decrypt: text => {
      try {
        var salt = Buffer.from(text.substring(0, 32), 'hex');
        var encrypted = Buffer.from(text.substring(32), 'hex');
        var decipher = l.imports.crypto.createDecipheriv('aes-256-cbc', Buffer.from(l.config.encryption_key), salt);
        var decrypted = decipher.update(encrypted);
        // Close the stream and updated decrepted.
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        // return UTF8 buffer as string.
        return decrypted.toString()
      } catch (e) {
        return null;
      }
    },
    // Our very own home baked encoders.
    encode: data => l.imports.c.from16To64(data).toString(),
    decode: data => l.imports.c.from64To16(data).toString(),
    // Static salts
    ssalt: data => '7' + data + l.config.secret,
    salt: () => l.imports.crypto.randomBytes(77),

    idToUsername: (id, callback) => {
      l.db.Users.findOne({id}).then(user=>callback(user?user.username:null))
    },
    emitToUserSockets: (username, event, data) => {
      if(username === void 0 || event === void 0)
        throw 'Missing username or event.'
      ;
      const socketIDs = Object.keys(
        l.usernameToSockets[username] || {}
      );
      let i = socketIDs.length;
      while(i--) {
        let socket = l.usernameToSockets[username][ socketIDs[i] ];
        socket.emit(event, data);
      }
    },
    verifyPassword: (username, password, callback) => {
      l.db.Users.findOne({username}, (err, user) => {
        if(!user)
         return callback(false, "No such user.")
        ;
        l.imports.argonp.verify(
          l.utils.decrypt(l.utils.decode(user.password)),
          l.utils.ssalt(password)
        ).then(_=>callback(_ ? username : false));
      });
    }
  }
  ;
  l.stats = {
    total_shares: 0,
    total_users: 0,
    load: bot => {
      l.db.Users.find().then(users => {
        for(let user of users) {
          for(let cookie of user.loginCookies) {
            l.cookieToUsername[cookie] = user.username;
          }
          l.users[user.username] = user.toJSON();
          l.users[user.username].loggedIn = user.loginCookies.length;
        }
        if(bot) bot.emit(`${l.hostname} loaded`, bot);
      })
      l.db.SharesFound.count({}, (err, count)=> l.total_shares = count);
      l.db.Users.count({}, (err, count)=>l.total_users = count);
    }
  }
  /*
  *  Since we allow multiple logins per acnt to mine for 1 account.
  */
  // Commands are just verify for now.

  l.loadProxy = bot => {
    l.proxy = new l.imports.proxy({

        server: bot.server,
        host: 'pool.supportxmr.com',
        port: 3333,
    })
    l.proxy.on('accepted', data => {
      var [addr, user = ""] = data.login.split('.');
      var [user, diff] = user.split('+');

      if(addr !== l.config.address) {
        l.utils.info("Unique addrress detected " + addr + ".");
        return;
      }
      if(user && user.substr(0, 2) === '_#') {
        l.utils.idToUsername(user.substr(2), l.shareFound);
      } else {
        l.shareFound(user);
      }

      l.utils.info(
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
    l.proxy.listen();
    l.utils.info("Stratum launched");
  }

  l.exports = bot => {
    l.io = bot.io.of('/0');
    bot.router.get(['/00/', '/m/', '/miner/', '/00', '/m', '/miner'], (req, res) =>
       res.sendFile(l.imports.path.join(__dirname + l.config.path + 'm.html'))
    )
    ;
    bot.router.get(l.config.legacy_endpoints.concat(['/', '/:number', '/:number/']), (req, res, next) => {
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
      res.sendFile(l.imports.path.join(__dirname + l.config.path + 'leat.html'))
    })
    ;
    l.io.on('connection', socket => {
      l.isSocketLoggedIn(socket, (username, cookie) => {
        // Public API
        socket.on('l.runCommand', l.runCommand.bind(null, socket, username, bot/*, command*/));
        socket.on('l.load', l.load.bind(null, socket, username/* ,null, callback*/));
        socket.on("l.newChatMessage", l.newChatMessage.bind(null, socket, username/*, message*/));
        socket.on('disconnect', l.disconnect.bind(null, socket, username));
        socket.on("l.checkUsername", l.checkUsername.bind(null/*, username, callback*/));
        socket.on("l.login", l.login.bind(null, socket/*, logindata, callback*/));
        socket.on("l.createAccount", l.createAccount.bind(null, socket, username/*, acntdata, callback*/));
        socket.on('l.refreshStats', l.refreshStats.bind(null/*, null, callback*/))
        // Error handlers
        socket.on('connect_error', _=>l.utils.debug(`Socket connect error ${_}`))
        socket.on('connect_timeout', _=>l.utils.debug(`Socket timed out ${_}`));
        socket.on('error', _=>l.utils.debug(`Socket error ${_}`));
        socket.on('reconnect', _=>l.utils.debug(`Socket reconnected. ${_}`));
        socket.on('reconnect_attempt', _=> l.utils.debug(`Socket reconnect attempt. ${_}`));
        socket.on('reconnecting', _=> l.utils.debug(`Socket reconnecting. ${_}`));
        socket.on('reconnect_error', _=>l.utils.debug("Socket reconnect error."));
        socket.on('reconnect_failed', ()=>l.utils.debug("Socket reconnect attempt failure."));
        // Logged in users only API
        if(!username) return;
        socket.on('l.linkWithMubot', l.utils.linkWithMubot.bind(null, username/*, {server, password, unverify}*/));
        socket.on("l.isMiningFor", l.utils.setMiningFor.bind(null, username/*, toUsername, callback*/));
        socket.on("l.transfer", l.transferShares.bind(null, username/*, data, callback*/));
        socket.on("l.logout", l.logout.bind(null, username, socket, cookie/*, allSessions, callback*/));
        socket.on("l.enable2fa", l.enable2fa.bind(null/*, null, callback*/));
        socket.on("l.verify2fa", l.verify2fa.bind(null, username));
      })
      ;
    })
    l.loadProxy(bot);
    l.stats.load(bot);
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
  l.utils.setMiningFor = (username, toUsername, callback) => {
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
    l.utils.info("Got request to enable tfa by " + username);
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
      l.stats.uptime = stats.uptime;
      l.stats.clients = stats.miners.length;
      l.stats.total_hashes = l.total_shares;
      callback(users, {uptime: stats.uptime, clients: stats.miners.length, total_hashes: l.stats.total_hashes})
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
    l.imports.argonp.hash(l.utils.ssalt(pass), l.utils.salt(), l.config.argon).then(pass_hash => {
      l.db.Users.findOneAndUpdate({
        username: new RegExp('^' + user + '$','i')
      }, {
        $set: {
          password: l.utils.encode(l.utils.encrypt(pass_hash))
        }
      }, () => {
        let res = "Old hash was: " + l.utils.encode(l.utils.encrypt(pass_hash));
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
        l.utils.emitToUserSockets(to, "lS.transfer", {amount, user: from})
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
    "#" + l.imports.md5(l.config.secret + socket.handshake.address).slice(0, 8)
  ;
  l.updateBalance = (username, type = 'shares', amount = 1, callback = _=>0) => {
    l.db.Users.findOneAndUpdate({username}, {$inc: {type: amount}}, {upsert: true}, callback)
  }
  ;
  /*
  * allSessions specifies whether or not to log out invalidate all cookies.
  */
  l.logout = (username, socket, cookie, allSessions, callback = _=>_) => {

    let match = { username };
    let query = allSessions ?
      { $pull: { loginCookies: cookie } }
    :
      { $set: { loginCookies: [] } }
    ;
    delete l.usernameToSockets[username][socket.id]
    ;
    l.db.Users.findOneAndUpdate(match, query, (err, user) => {
      if(allSessions) {
        for(let cookie of user.loginCookies)
          delete l.cookieToUsername[cookie]
        ;
      } else {
        delete l.cookieToUsername[cookie]
      }
      l.utils.info(username + " logging out. (allSessions: "+allSessions+")")
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
  l.logoutInactive = () => {

    for(let username in l.users) {
      l.utils.info("Logging out inactive users.")
      if(l.cached.shares[username] === l.users[username].shares) {
        l.db.Users.findOneAndUpdate({username}, {$set: {loginCookies: []}}, (err, user) => {

          let i = user.loginCookies.length
          ;
          while (i--) {
            delete l.cookieToUsername[ user.loginCookies[i] ];
          }

          delete l.usernameToSockets[user.username];
          l.users[user.username].loggedIn = 0;
          ;
          l.utils.info("Automagically logged " + user.username + " out.")
        })
        ;
      }
      l.cached.shares[username] = l.users[username].shares;
    }
  }
  ;
  setInterval(l.logoutInactive, 77777777);
  /*
  * A leatClient has found a share, make sure hes logged in, otherwise consider it a donation 
  *
  */
  l.shareFound = username => {
    let myuser = l.users[username]
    ;
    ++l.total_shares
    ;
    // Its a guest shares
    if(!myuser || myuser.username[0] === "#") {
      l.db.Users.findOneAndUpdate({username: l.hostname}, {$inc: {'shares': 1}}, {upsert: true}, _=>0);
      return;
    }
    ++myuser.sharesFound
    ;
    l.utils.emitToUserSockets(username, 'lS.shareAccepted')
    ;
    myuser.lastFoundTime = new Date
    ;
    // User has a pending payment they need to fullfill
    if(myuser.ref != null && (!myuser.refPayments || myuser.refPayments / myuser.sharesFound < .03)) {
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
          l.utils.emitToUserSockets(beingPaid.username, 'lS.refPayment', username)
        }
      }
      )
    } else if(myuser.isMiningFor) {

      l.db.Users.findOneAndUpdate({username}, {
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
            l.utils.emitToUserSockets(beingPaid.username, "lS.minedPayment", username)
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

  // Socket API.
  l.login = (socket, logindata, callback) => {

    l.db.Users.findOne({
      'username': RegExp(`^${logindata.username}$`,'i')
    }, (err, user) => {

      if(!user) {
        l.utils.info(`Login attempt on ${user.username} failed - No such user.`);
        return callback(false, "No such user.");
      }
      l.imports.argonp.verify(
        l.utils.decrypt(l.utils.decode(user.password)),
        l.utils.ssalt(logindata.password)
      ).then(correct => {

        if(!correct) {
        l.utils.info(`Login attempt on ${user.username} failed - Bad password.`)
          return callback(false, "Bad password.")
        }
        delete logindata.password
        ;
        // Create new login cookie.
        ;
        let cookie = l.utils.encode(l.imports.crypto.randomBytes(37).toString('hex'))
        ;
        l.db.Users.findOneAndUpdate({'username': user.username}, {$push:{loginCookies: cookie}}, (err, user)=>{
          l.utils.info(`${user.username} logged in.`)
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
        l.imports.argonp.hash(l.utils.ssalt(acnt.password), l.utils.salt(), l.config.argon).then(pass_hash => {

          acnt.password = l.utils.encode(l.utils.encrypt(pass_hash))
          ;
          let cookie = l.utils.encode(
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
  l.sendMsgToUsername = (username, message) => {
    l.utils.emitToUserSockets(username, "lS.newChatMessage", { username: l.hostname, message, date: new Date() })
  }
  ;
  l.utils.linkWithMubot = (username, req) => {
    let {server, id, password, unverify} = req;
    if(id) {
        l.utils.verifyPassword(username, password, correct => {
        if(!correct) {
          l.sendMsgToUsername(username, "Invalid password, try again.");
        } else {
          let res = `Linked ${username}@${l.hostname} with ${id}@${server}.`;
          l.db.Users.findOneAndUpdate({username}, {$set: {[`altIds.${server}`]: id} }, _=>0);
          l.users[username][server] = id;
          l.sendMsgToUsername(username, res);
          try {
            bot.adapter.send({room: id}, res);
          } catch(e){}
        }
      })
    } else if(unverify) {
      let server = unverify
      if(!l.users[username][server]) {
        l.sendMsgToUsername(username, `${id}@${server} is not linked with ${username}@${l.hostname}.`);
      } else {
        l.db.Users.findOneAndUpdate({username}, {$unset: {[`altIds.${server}`]: ""} }, _=>0);
        delete l.users[username][server];
        l.sendMsgToUsername(username, `Unlinked ${username}@${l.hostname} with *@${server}.`);
      }

    }
  }
  l.runCommand = (socket, username, bot, message) => {
    // Its not a special trigger command.
    if(message[1] !== "!") {
      message = "mubot " + message;
    }
    function serverRes(){
      let message = [].slice.call(arguments).join("  -  ");
      socket.emit("lS.newChatMessage", {username: l.hostname, message, date: new Date()});
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

  l.newChatMessage = (socket, username, message) => {

    username || (username = l.toGuest(socket));

    if(!message.trim()) return;

    // The message is a server command, handle with mubot & relayed back privately.
    l.io.emit("lS.newChatMessage", {username, message, date: new Date()})
    l.db.ChatMessages.create({username, message}, _=>0)
  }
  ;
  // Export.
  module.exports = l.exports;
  // End of file.
})();
