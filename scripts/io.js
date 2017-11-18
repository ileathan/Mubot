// Description:
//   Brings socket.io to mubot!
//
// Commands:
//   None.
//
// Author:
//   leathan
//
(function(){
const request      = require('request')
const exec         = require('child_process').exec; // Used to access monero daemon.
const randomstring = require('randomstring'); // Used for cookie generation.
const mongoose     = require('mongoose');
const argon        = require('argon2-ffi').argon2i;
const path         = require('path');

mongoose.Promise = global.Promise;
const conn = mongoose.createConnection('mongodb://localhost/gambler-api');

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
  'login_cookie': String,
  'password': String,
  'wallet': String,
  'balance': Number,
  'ref': Number,
  'mine_for_user': String,
  'ref_payments': Number,
  'ref_payments_received': Number,
  'mined_payments': Number,
  'mined_payments_received': Number,
  'id': Number,
  'shares': Number,
  'shares_found': Number,
  'mining_config': Object,
  'date': { type: Date, default: Date.now }
});
// Beautiful hack to allow hotreloading when models already exists.
const SharesFound = conn.models.SharesFound || conn.model('SharesFound', SharesFoundSchema);
const Transactions = conn.models.Transactions || conn.model('Transactions', TransactionsSchema);
const ChatMessages = conn.models.ChatMessages || conn.model('ChatMessages', ChatMessagesSchema);
const Users = conn.models.Users || conn.model('Users', UsersSchema);

module.exports = bot => {
  const io = bot.io.of('/0');
  bot.router.get(['/chat', '/miner', '/gamble'], (req, res) => res.sendFile(path.join(__dirname + '/../node_modules/hubot-server/public/io.html')));
  bot.router.get('/:number/', (req, res, next) => {
    if(/[^0-9]/.test(req.params.number)) return next()
    if(req.cookies && !req.cookies.ref) res.cookie('ref', req.params.number)
    res.sendFile(path.join(__dirname + '/../node_modules/hubot-server/public/io.html'))
  })
  function shareFound(username, data, callback) {
    if(!username) return callback(false, "No username provided")
    SharesFound.findOneAndUpdate({'result': data.result}, {$set:{'miner': username,'mined_for': data.mineForUser || '_self','hashes': data.hashes,'hashesPerSecond': data.hashesPerSecond}},(err,share)=>{
      if(err || !share) return callback(false, err || "Share not found");
      var needs_to_pay = false;
      var myuser = usersOnline[username];
      ++myuser.shares_found;
      if(myuser.ref != null && !myuser.ref_payments) needs_to_pay = true;
      else if(myuser.ref != null && myuser.ref_payments / myuser.shares_found < .03) needs_to_pay = true;
      if(needs_to_pay) {
        Users.findOneAndUpdate({'id': myuser.ref }, {$inc: {'shares': 1, 'ref_payments_received': 1 } }, (err, userBeingPaid) => {
          if(err || !userBeingPaid) return callback(false, err || "User being paid via ref not found.");
          Transactions.create({from: username, to: userBeingPaid.username, type: 'ref', amount: 1}, ()=>{})
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'ref_payments': 1, 'shares_found': 1 } }, ()=>{})
          if(usersOnline[userBeingPaid.username]) {
            ++usersOnline[userBeingPaid.username].shares;
            ++usersOnline[userBeingPaid.username].ref_payments_received
            USER_SOCKETS[userBeingPaid.username].emit("ref payment", username);
          }
          ++myuser.ref_payments;
          callback(userBeingPaid.username, null)
        })
      } else if(data.mineForUser) {
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'shares_found': 1, 'mined_payments': 1 } }, (err, user) => {
          if(err || !user) return callback(false, err || "Error user not found.");
          Users.findOneAndUpdate({username: new RegExp('^' + data.mineForUser + '$', 'i') }, {$inc: {'shares': 1, 'mined_payments_received': 1 } }, (err, userBeingPaid)=>{
            if(err || !userBeingPaid) return callback(false, err || "User being paid via mining not found.");
            Transactions.create({from: username, to: userBeingPaid.username, type: 'mined_for', amount: 1}, ()=>{})
            if(usersOnline[userBeingPaid.username]) {
              ++usersOnline[userBeingPaid.username].shares;
              ++usersOnline[userBeingPaid.username].mined_payments_received;
              USER_SOCKETS[userBeingPaid.username].emit("mined for payment", username)
            }
            ++myuser.mined_payments;
            callback(userBeingPaid.username, null)
          })
        })
      } else {
        Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i') }, {$inc: {'shares': 1, 'shares_found': 1 } }, (err, user) => {
          ++myuser.shares;
          if(user) callback(user.username, null)
          else callback(false, "No user found: " + err)
        })
      }
    })
  }
  bot.router.get(['/gambler/api/:jobid/:result/:nonce/:hash', '/0/api/:jobid/:result/:nonce/:hash'], (req, res) => {
    // Close the connection immediatly, so client doesnt wait.
    res.end('1');
    // Verify that the hash is not fabricated.
    for(let param in req.params) req.params[param] = decodeURIComponent(req.params[param]);
    //req.params.hash = decodeURIComponent(req.params.hash)
    argon.verify(req.params.hash, req.params.jobid + req.params.result + req.params.nonce + process.env.SECRET_SECRET || "secret_secret").then(correct => {
      if(correct) SharesFound.findOne({result: req.params.result}, (err, share) => {
        if(!share) SharesFound.create(req.params, (err, share) => void 0);
      })
    }, incorrect => console.log("HASH AUTHENTICATION FAILURE!"));
  });
  io.on("connection", socket => {
    isLoggedIn(socket, username => {
      socket.on("whoami", (_, callback) => {
        ChatMessages.find({}, {_id: 0, __v: 0}).sort({'date': -1}).limit(20).exec((err, chatMsgs)=> {
          if(username) {
            let userRegex = new RegExp('^' + username + '$', 'i');
            Transactions.find({ $or:[ {from: userRegex}, {to: userRegex} ]}, {_id: 0, __v: 0}, (err, trans)=> callback(usersOnline[username], chatMsgs.reverse(), trans));
          }
          else callback({"username": false, "shares": 0, "balance": 0}, chatMsgs.reverse(), []);
        })
      });
      // Client is sending a new chat message.
      socket.on("chat message", msg => {
        io.emit("chat message", (username || "Guest User") + ": " + msg)
        ChatMessages.create({username: username || "Guest User", message: msg}, ()=>{})
      })
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
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $set: {'mine_for_user': user} }, (err, user0) => {
            if(user0) usersOnline[username].mine_for_user = user;
            callback(!!user0, err || !user0 && "User not found")
          })
        } else {
          delete usersOnline[username].mine_for_user;
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'mine_for_user': 1} }, (err, user) => callback(!!user, err))
        }
      })
      socket.on("update mining configuration", (config, callback) => {
        if(config) {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $set: {'mining_config': config} }, (err, user) => {
            if(user) usersOnline[username].mining_config = config;
            callback(!!user, err)
          })
        } else {
          Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $unset: {'mining_config': 1} }, (err, user) => {
            if(user) delete usersOnline[username].mining_config;
            callback(!!user, err)
          })
        }
      })
      socket.on("transfer", (data, callback) => {
        if(data) {
          let toUser = data.username;
          let amount = data.amount;
          if(!Number(amount) && (!toUser || toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser))) return callback(false, "Amount / User invalid.");
          if(!Number(amount)) return callback(false, "Amount wasnt a number.");
          if(toUser === 'false' || /^_|[^a-zA-Z0-9_]/.test(toUser)) return callback(false, "Not a valid name.");
          if(usersOnline[username].shares < amount) return callback(false, "Not enough funds.");
          Users.findOneAndUpdate({username: new RegExp('^' + toUser + '$', 'i')}, { $inc: {'shares': amount} }, (err, user) => {
            if(!user) return callback(false, "Username not found.");
            Transactions.create({from: username, to: toUser, type: 'transfer', amount: amount}, ()=>{})
            if(usersOnline[user.username]) {
              usersOnline[user.username].shares += amount;
              USER_SOCKETS[user.username].emit("transfer payment", amount, username);
            }
            usersOnline[username].shares -= amount;
            Users.findOneAndUpdate({username: new RegExp('^' + username + '$', 'i')}, { $inc: {'shares': -amount} }, (err, user) => {
              if(!user) {
                console.log("CRITICAL ERROR!! PAYMENT SENT BUT BALANCE NOT DEDUCTED!" + err);
                console.log(user);
                callback(true, "CRITICAL ERROR")
              } else {
                callback(true, null)
              }
            })
          })
        } else {
          callback(false, "No data provided.")
        }
      })
      socket.on("log out", () => logout(username));
      socket.on("share found", (data, callback) => shareFound(username, data, callback));
    })
    socket.on('share totals', (_, callback) => {
      Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => {
        if(users) {
          SharesFound.count({}, function(err, count) {
            request({uri: 'https://localhost:3000/stats', strictSSL: false}, (err, res, data)=> {
              data = JSON.parse(data);
              // temporary fix - remove hardcoded 1500 later
              data.total_hashes = count + 1500;
              callback(users, data)
            })
          })
        }
      })
    });
    // Client is checknnig to see if a username is available.
    socket.on("check username", (username, callback) => {
      Users.findOne({username: new RegExp('^' + username + '$', 'i') }, (err, user) => {
        if(err) return next(err);
        callback(Boolean(!user));
      })
    })
    socket.on("log in", (data, callback) => {
      var login_cookie = randomstring.generate();
      Users.findOne({'username': new RegExp('^' + data.username + '$', 'i'), 'password': data.password, "login_cookie": {$exists: true, $ne: 'logged-out'} },  {'login_cookie': login_cookie},  (err, user) => {
        if(user) return callback(user['login_cookie'])
        Users.findOneAndUpdate({'username': data.username, 'password': data.password  },  {$set:{'login_cookie': login_cookie}},  (err2, user2) => {
          callback(user2 ? login_cookie : false)
        })
      })
    })
    socket.on("create account", (data, callback) => {
      if(!data.username || data.username === 'false' || /^_|[^a-zA-Z0-9_]/.test(data.username)) return callback({error: 'Illegally name, try again.'});
      Users.findOne({username: new RegExp('^' + data.username + '$', 'i') }, (err, user) => {
        if(err) return next(err);
        if(user) callback({error: 'Username already exists.'});
        else {
          exec('echo monerod getnewaddress', (error, stdout) => {
            data.login_cookie = randomstring.generate();
            data.wallet = "";
            data.balance = 0;
            data.shares = 0;
            data.shares_found = 0;
            data.ref_payments = 0;
            data.ref_payments_received = 0;
            data.mined_payments = 0;
            data.mined_payments_received = 0;
            data.password = data.password.replace(/\\/g, '\\');
            //data.username = data.username.toLowerCase();
            Users.count({}, function(err, count) {
              if(err || !count) return callback({error: err || 'no count'});
              data.id = count;
              if(data.id > 20) data.ref = data.ref || 0;
              else delete data.ref;
              Users.create(data, (err, user) => {
                if(err) return callback({error: err});
                callback(data.login_cookie);
              })
            })
          })
        }
      })
    })
  })

  function logout(user) {
    Users.findOneAndUpdate({'username': new RegExp('^' + user + '$', 'i') }, { 'login_cookie': 'logged-out' }, (err, user) => {
      delete logged[user['login_cookie']]
    });
    USER_SOCKETS[user].broadcast.emit('user logged out', user);
    delete usersOnline[user];
    delete USER_SOCKETS[user]
  }
  // Save every users socket, by user.
  const usersOnline = {}, logged = {}, USER_SOCKETS = {};
  function isLoggedIn(socket, cb) {
    if(socket.handshake.headers.cookie) {
      let cookie;
      if(cookie = /login_cookie=(\w{32})/.exec(socket.handshake.headers.cookie)) cookie = cookie[1];
      else return cb(false);
      if(logged[cookie]) {
        USER_SOCKETS[logged[cookie]] = socket;
        return cb(logged[cookie])
      }
      // If this is our first time seeing the user, query database and build shortcut hashes.
      Users.findOne({ 'login_cookie': cookie }, (err, user) => {
        if(err) throw new Error('Error @ Users.findOne({ "login_cookie": cookie }, (err, user) => {');
        if(!user) return cb(false); // Bad cookie.
        let cleanedUser = {
          balance:      user.balance,
          shares:       user.shares,
          shares_found: user.shares_found,
          username:     user.username,  // make sure sensitive info isn't sent.
          status:       'online',
          address:      user.wallet,
          ref:          user.ref,
          id:           user.id,
          updated_at:   user.updated_at,
          ref_payments: user.ref_payments,
          ref_payments_received: user.ref_payments_received,
          mined_payments: user.mined_payments,
          mined_payments_received: user.mined_payments_received
        };
        if(user.mine_for_user) cleanedUser.mine_for_user = user.mine_for_user;
        if(user.mining_config) cleanedUser.mining_config = user.mining_config;
        io.emit('user logged in', cleanedUser);
        logged[cookie] = user.username;
        usersOnline[user.username] = cleanedUser; // shortcut hashes
        USER_SOCKETS[user.username] = socket;
        cb(user.username)
      })
    } else {
      // Guest logged in/out.
      cb(false)
    }
  }
}
}).call(this);
