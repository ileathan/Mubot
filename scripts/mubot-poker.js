// Description:
//  Allow Mubot to be a poker server.
//
//debugger;
;(function(){

  const l = {};
  const argond = require('argon2-ffi').argon2d;

  l.Engine = function(){
    this.games = [];
    return this;
  }
  Object.assign(l.Engine, require('leat-poker').Poker)


  l.Engine.prototype.quickJoin = function(username) {
debugger;
    var player = new Player(username);

    if(this.games.map(getOpenSeats).pop()) {

      return this.games[0] = new l.Table
    }

    var openGames = this.games.filter(getOpenSeats);

    var randomGame = Math.floor(Math.random() * openGames.length)

    openGames[randomGame].connectPlayer(player)
  }
  ;


debugger;
  /* 
  * Check if games need a block
  *
  * Returns true or false
  */
  l.Engine.prototype.isBlockNeeded = function(games = this.games) {
debugger;
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
  l.Engine.prototype.mineBlock = share => {
debugger;
    const GENESIS = l.hostname
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

  l.Player = function(name) {
debugger;
      var user = bot.leat.users[name];

      if(!user)
        return 'User not a leat user.';
      if(!user.shares > 10)
        return "User doesn't have enough balance.";

      this.username = user.username;
      this.shares = user.shares;

      this.games = []

      this.luckyStr = () => user.luckyStr && user.luckyStr.length >= 4 ?
        user.luckyStr.slice(0, 4)
      :
        crypto.randomBytes(4).toString('utf8')
      ;
      return this;
    }

  const MAX_PLAYERS = 10
    , BIG_BLIND = 10
    , SMALL_BLIND = 5;

  l.Table = function() {

debugger;
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
  l.Table.prototype.stop = ()=>null;

  l.Table.prototype.start = () => {
debugger;
    if(this.betRound !== null || this.cardRound !== null)
      throw 'Ongoing game.'

    if(this.players.length < 2)
      throw 'Not enough players.'

    this.betRound = 0;
    this.cardRound = 0;

    this.on("block found", this.deal)
    return this;
  }
  ;

  l.Table.prototype.deal = function(block) {
debugger;
    this.deck = l.imports.md5(this.getLuckyStrings() + block.hash);

    for(let i = 0, len = this.players.length; i < len; ++i) {
    }

  }
  ;

  l.Table.prototype.getLuckyStrings = (usernames, callback) => {
debugger;
    return this.players.map(_=>_.luckyS).join(' ');
  }
  ;

  l.Table.prototype.getOpenSeats = function(game = this) {
debugger;
    return game.seats - game.players.length + game.que.length
  }

  l.Table.prototype.isBlockNeeded = function() {
debugger;
    this.cardRound === null
  }

  l.Table.prototype.disconnectPlayer = function(username, reason) {
debugger;
    if(this.betturn || this.cardTurn)
      throw 'Cant disconnect carded user.'

    delete this.players[username]
    l.users[username] && emitToUserSockets(username, "lS.Table.disconnect", reason);

  }
  ;

  l.Table.prototype.sitUser = function(player) {
debugger;
    player.wager(this, this.small_blind)
  }
  ;

  l.Table.prototype.connectPlayer = function(player) {
debugger;
    if(this.getOpenSeats() < 1)
      throw 'Table full.'

    player.games.push(Object.assign(this, {
      _seat: this.players.length + this.que.length
    }));

    this.que.push(player)

  }
  ;




  l.imports = {argond}

  l.exports = _bot => {
    bot = _bot;
    l.db = {};

    bot.on("leat.io loaded", ()=>{
debugger;
       l.db.BlockChain = bot.leat.db.BlockChain;

    })
   
    bot.respond(/(play|join) poker/i, l.createUser)

    Object.assign(bot.mubot, {poker: l})
  }
  ;
  l.createUser = res => {
    let player = new l.Player(username);
    debugger;
  }
  ;

  Object.defineProperties(l, {
    exports: {enumerable: false},
    imports: {enumerable: false},
    db: {enumerable: false}
  });

  module.exports = l.exports;

}).call(this);