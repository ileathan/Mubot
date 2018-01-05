// Description:
//   A Marking U Bot.
//
// Dependencies:
//   bitmarkd must be running
//   bitmark-cli must be in path
//   wallet must be funded
//
// Configuration:
//
//
// Commands:
//   + <times> <user> <reason>        -   transfers coins the specified user.
//   withdraw <address> <amount>      -   Withdraw amount to address (Just Bitmark supported).
//   marks [user]                     -   Balance for a user or self.
//   Mubot mode                       -   Sets the coin to be transfered upon +'ing.
//
// Author:
//   Project Bitmark
//
(function() {
  const {exec} = require('child_process');
  /************************
  *    _    Mubot   _     *
  *   | |          | |    *
  *   | | ___  __ _| |_   *
  *   | |/ _ \/ _` | __|  *
  *   | |  __/ (_| | |_   *
  *   |_|\___|\__,_|\__|  *
  *                       *
  *          API          *
  ************************/
  const l = {}
  ;
  l.load = bot => {
    // Import from scripts/leat-server.js
    Object.assign(l, bot.leat);
    l.verifiedNameById = {};
    for(let name in l.verifiedAcnts) {
      for(let id in l.verifiedAcnts[name].ids) {
        l.verifiedNameById[id] = name;
      }
    }
  }
  ;
  l.idToName = id => l.verifiedNameById[id] || l.bot.brain.userForId(id).name || "_unverified";
  ;
  l.symbols = {marks: '₥', bits: 'ɱɃbits', shares: 'shares'}
  ;
  l.idToAccount = id => l.users[l.idToName(id)] || (l.users[l.idToName(id)] = {})
  ;
  // Returns: balance object containing every coin specified.
  l.idToBalances = (id, coins) => {
    const name = l.idToName(id);
    const account = l.idToAccount(id);
    coins || (coins = Object.keys(l.symbols));
    let res = {};
    for(let coin of coins) {
      res[coin] = account[coin] || 0;
    }
    return res;
  }
  ;
  l.balance = res => {
    let [, userID, coins ] = res.match;
    if(!userID) {
      userID = res.message.user.id;
    }
    if(coins) {
      coins = coins.split(/(\s+|\s*[,-|/~]\s*)/);
      coins = Object.keys(l.symbols);
    }
    res.send(JSON.stringify(l.idToBalances(userID, coins)))
  }
  ;
  l.balanceByName = res => {
    let [, name, coins] = res.match,
        userId = l.bot.brain.userForName(name).id
    ;
    if(!userId) {
      return res.send("Sorry but I cant find that user.");
    }
    res.match = [, userId, coins]
    l.balance(res);
  }
  ;
  l.transferByName = res => {
    let [, amount, name, context] = res.match,
        recipientId = l.bot.brain.userForName(name).id
    ;
    if(!recipientId) {
       return res.send("Sorry but I cant find that user.");
    }
    res.match[3] = recipientId;
    l.transfer(res)
  }

  l.transferSlackReaction = res => {
    let {type, reaction} = res.message
        recipientId = res.message.item_user.id
    ;
    if(type === 'added' && reaction === 'mh') {
      res.match = [ recipientId, 1, "reaction" ]
      l.transfer(res)
    }
  }
  ;
  // discord allows multiple people to have the same display name, so we match against names and check the  discriminator.
  l.transferDiscordFuzzy = res => {
    let recipientId = null,
        [, amount, recipientName, discriminator, context ] = res.match,
        matchedUsers = l.bot.brain.usersForFuzzyName(recipientName)
    ;
    if(matchedUsers.length === 1) {
      recipientId = matchedUsers[0].id;
    }
    else if(matchedUsers.length > 1)  {
      for(let i = 0, l = matchedUsers.length; i < l; ++i) {
        matchedUsers[i].discriminator === discriminator && (recipientId = matchedUsers[i].id);
      }
    }
    else {
     return res.send('User ' + recipientName + ' was not found.')
    }
    res.match = [, amount, recipientId, context];
    l.transfer(res);
  }
  ;
  l.transfer = res => {
    let senderId = res.message.user.id;
    // recipient may contain ID or username.
    let [, amount, recipientId, context ] = res.match;
    if(!l.updateBalance(senderId, -amount)) {
      return res.send("You dont have enough " + coin + ".");
    }
    // Coerce username to ID.
    if(l.bot.adapterName === 'discord') {
      recipientName = l.bot.brain.userForId(recipientId).name;
      recipientId = user.id;
    } else {
      recipientName = recipientId;
      recipientId = l.bot.brain.userForName(recipientName).id;
    }
    // Check if user is real (this may break some adapters compatibility? [irc?])
    if(!recipientId && !recipientName) {
      return res.send("Receiving user not found.");
    }
    l.updateBalance(recipientId, amount);
    let msg = coin === 'marks' ? ' has marked ' : ' has awarded '
    /// Exmaple output: leathan has awarded john 10 shares. (  ).
    res.send(res.message.user.name + msg + " " + recipientName + " " + amount + symbol + '. ( ' + context + ' )')
  }
  ;
  l.updateBalance = (id, amount, coin) => {
    let recipientAcnt = l.idToAccount(id);
    let newBalance = recipientAcnt[coin] ? recipientAcnt[coin] + amount : amount
    if(newBalance < 0) {;
      return false;
    }
    recipientAcnt[coin] = newBalance;
    return true;
  }
  ;
  l.withdrawMarks = res => {
    let address = res.match[1],
        amount = res.match[2],
        userId = res.message.user.id
    ;
    if(l.updateBalance(userId, amount)) {
      let command = 'bitmarkd sendtoaddress ' + address + ' ' + parseFloat(amount / 1000);
      exec(command, (error, stdout) => res.send(stdout));
    } else {
      res.send("Sorry, you don't have enough marks.");
    }
  }
  ;
  l.imports = {exec};
  Object.defineProperty(l, 'imports', {enumerable: false})
  l.exports = bot => {
    let adapter = bot.adapterName;
    global[adapter+"Bot"] = bot;
    // Emitted by Mubot/scripts/leat-server.js.
    bot.on("leat.io loaded", l.load);
    // All adapters.
    bot.respond(/.*withdraw\s+(\w{34})\s+(.+)$/i, l.withdrawMarks);
    bot.respond(/.*\s+balances?(?:\s+(.*))?$/i, l.balance);
    //
    if(adapter === 'discord') {
      bot.respond(/bal(?:ances?)?\s+<@?!?(\d+)(?:\s+(.+))?>$/i, l.balance);
      bot.hear(/\+(\d+)\s+<@?!?(\d+)>(?:\s+(.+))?$/i, l.transfer);
      bot.hear(/\+(\d+)\s+@ (.*)#(\d{4})(?:\s+(.+))?$/i, l.transferDiscordFuzzy);
    }
    else {
      bot.respond(/bal(?:ances?)?\s+@?\s*(\w+)(?: (.+))?$/i, l.balanceByName);
      bot.hear(/\+(\d+)\s+@?\s*(\w+)(?:\s+(.+))?$/i, l.transferByName);
      adapter === 'slack' && bot.react(l.transferSlackReaction);
    }
  }
  Object.defineProperty(l, 'exports', { enumerable: false })
  ;
  module.exports = l.exports
  ;
}).call(this);
