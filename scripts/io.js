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
const exec         = require('child_process').exec; // Used to access monero daemon.
const randomstring = require('randomstring'); // Used for cookie generation.
const mongoose = require('mongoose');
const argon = require('argon2-ffi').argon2i;

mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost/gambler-api', { useMongoClient: true })
//  .then(() => console.log('[mongoose] Gambler connection succesful.'))
//  .catch(err => console.log('[mongoose GAMBLER ERROR] ' + err));
// Set up database.
// The above code kept connecting to bitmark-api so i did the bellow
var conn = mongoose.createConnection('mongodb://localhost/gambler-api');

const SharesFoundSchema = new mongoose.Schema({
  'hashes': String,
  'hashesPerSecond': String,
  'miner': String,
  'jobid': String,
  'result': String,
  'nonce': String,
  'date': { type: Date, default: Date.now }
});
const UsersSchema = new mongoose.Schema({
  'username': String,
  'login-cookie': String,
  'password': String,
  'wallet': String,
  'balance': Number,
  'shares': Number,
  'date': { type: Date, default: Date.now }
});
// Beautiful hack to allow hotreloading when models already exists.
const SharesFound = conn.models.SharesFound || conn.model('SharesFound', SharesFoundSchema);
const Users = conn.models.Users || conn.model('Users', UsersSchema);

module.exports = bot => {
  const io = bot.io.of('/chat');

  bot.router.post('/gambler/api', (req, res) => {
    console.log("[/gambler/api/]: " + JSON.stringify(req.body))
    SharesFound.findOneAndUpdate({'result':req.body.result,'nonce':req.body.nonce,'jobid':req.body.job_id},{$set:{'miner':req.body.username,'hashes':req.body.hashes,'hashesPerSecond':req.body.hashesPerSecond}},(err,share)=>{
      if(err) return res.end(err);
      Users.findOneAndUpdate({'username': req.body.username }, { $inc: {'shares': 1 } }, (err, user) => {
        usersOnline[req.body.username].shares += 1;
        if(share && user) return res.end("Okay")
        return res.end("Error")
      })
    })
  });

  bot.router.get('/gambler/api/:jobid/:result/:nonce/:hash', (req, res) => {
    // Close the connection immediatly, so client doesnt wait.
    res.end('1');
    // Verify that the hash is not fabricated.
    argon.verify(req.params.hash, req.params.jobid + req.params.result + req.params.nonce + process.env.SECRET_SECRET || "secret_secret").then(correct => {
      if(correct) SharesFound.create(req.params, (err, share) => !console.log("Share added to db") && console.log(share))
    }, incorrect => console.log("HASH FAILURE!"));
  });

  io.on("connection", socket => {
    isLoggedIn(socket, username => {
      socket.on("whoami", (_, callback) => {
        if(username) callback({"username": username, "shares": usersOnline[username].shares, "balance": usersOnline[username].balance})
        else callback({"username": false, "shares": 0, "balance": 0})
      });
      // Client is sending a new chat message.
      socket.on("chat message", data => io.emit("chat message", (username || "Guest User") + ": " + data))
      // Logged in users only API
      if(!username) return; // Its a guest, dont allow entry.
      socket.on("log out", () => logout(username));
      socket.on('share totals', (_, callback) => {
        Users.find({username: {$exists: true}, shares: {$gt: 0} }, {username: 1, shares: 1, _id: 0}, (err, users) => callback(users || {}));
      });
    })
    // Client is checknnig to see if a username is available.
    socket.on("check username", (username, callback) => {
      Users.findOne({username: new RegExp('^' + username + '$', 'i') }, (err, user) => {
        if(err) return next(err);
        callback(Boolean(!user));
      })
    })
    socket.on("log in", (data, callback) => {
      var login_cookie = randomstring.generate();
      Users.findOneAndUpdate({'username': new RegExp('^' + data.username + '$', 'i'), 'password': data.password },  {'login-cookie': login_cookie},  (err, user) => {
        if(err) return next(err);
        // Set their login cookie.
        callback(user ? login_cookie : false)
      })
    })
    socket.on("create account", (data, callback) => {
     if(/^_|[^a-zA-Z0-9_]/.test(data.username)) return callback({error: 'Illegally formatted name'});
      Users.findOne({username: data.username }, (err, user) => {
        if(err) return next(err);
        if(user) callback({error: 'Username already exists.'});
        else {
          exec('echo monerod getnewaddress', (error, stdout) => {
            data['login-cookie'] = randomstring.generate();
            data.wallet = "";
            data.balance = 0;
            data.shares = 0;
            Users.create(data, (err, user) => {
              if(err) return next(err);
              console.log("Account created")
              console.log(user)
              callback(data['login-cookie']);
            })
          })
        }
      })
    })
  })

  function logout(user) {
    Users.findOneAndUpdate({'username': user }, { 'login-cookie': 'logged-out' }, (err, user) => {
      delete logged[user['login-cookie']]
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
      if(cookie = /login-cookie=(\w{32})/.exec(socket.handshake.headers.cookie)) cookie = cookie[1];
      else return cb(false);
      if(logged[cookie]) {
        USER_SOCKETS[logged[cookie]] = socket;
        return cb(logged[cookie])
      }
      // If this is our first time seeing the user, query database and build shortcut hashes.
      Users.findOne({ 'login-cookie': cookie }, (err, user) => {
        if(err) throw new Error('Error @ Users.findOne({ "login-cookie": cookie }, (err, user) => {');
        if(!user) return cb(false); // Bad cookie.
        let cleanedUser = {
          balance:    user.balance,
          shares:     user.shares,
          username:   user.username,  // make sure sensitive info isn't sent.
          status:     'online',
          address:    user.wallet,
          updated_at: user.updated_at
        };
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
