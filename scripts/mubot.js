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
//   + <times> <user> <reason>        -   Marks the specified user.
//   withdraw <address> <amount>      -   withdraw to address amount.
//   marks [user]                     -   Balance for a user or self.
//
// Author:
//   Project Bitmark
//
(function() {
  var adapter, exec, symbol, keys;
  exec = require('child_process').exec;
  symbol = '₥';
  module.exports = bot => {
    adapter = bot.adapterName;
    bot.brain.on('loaded', () => keys = bot.brain.data.keys || (bot.brain.data.keys = {}));
    bot.respond(/withdraw\s+(\w{34})\s+(.*)\s*$/i, res => withdraw_marks(res, res.match[1], res.match[2]))
    bot.respond(/marks\s*$/i, res => {
      try { var bal = keys[res.message.user.id].bitmark.balance } catch(e) { var bal = 0 }
      res.send('You have ' + bal + symbol + '.');
    });
    if(adapter === 'discord') {
      bot.hear(/marks\s+@? (.*)#(\d{4})/i, res => {
        var arr = bot.brain.usersForFuzzyName(res.match[1])
        if(arr.length === 1 && keys[arr[0].id] && keys[arr[0].id].bitmark) {
          return res.send(res.match[1] + ' has ' + keys[arr[0].id].bitmark.balance + symbol + '.')
        } else if(arr.length > 1)  {
          for(let i = 0, l = arr.length; i < l; ++i) {
            if(arr[i].discriminator === res.match[2]) {
              try { var bal = keys[arr[i].id].bitmark.balance } catch(e) { var bal = 0 }
              return res.send(res.match[1] + ' has ' + bal + symbol + '.')
            }
          }
        } else if(arr.length < 1) return res.send('User ' + res.match[1] + ' was not found.')
       res.send(res.match[1] + ' has 0' + symbol + '.')
      })
      bot.hear(/marks\s+<@?!?(\d+)>$/i, res => {
       var user = bot.brain.userForId(res.match[1]);
       if(user) {
          try { var bal = keys[res.match[1]].bitmark.balance } catch(e) { var bal = 0 }
          res.send(user.name + ' has ' + bal + symbol + '.')
        } else {
          res.send("Sorry, I can't find that user.")
        }
      })
      bot.hear(/^\+(\d+)\s+<@?!?(\d+)>\s*(.*)?$/i, res => {
        if(res.match[2] === bot.client.user)  return res.send("Sorry but I am currently unmarkable.");
        if(res.match[2] === res.message.user.id) return res.send("Sorry but you cannot mark yourself.");
        if(res.match[1] <= 100) transfer_marks(res, res.match[2], res.match[1], res.match[3]);
        else res.send('Max is +100')
      })
      bot.hear(/\+(\d+)\s+@ (.*)#(\d{4}) ?(.*)/i, res => {
        var rec, arr = bot.brain.usersForFuzzyName(res.match[2]);
        if(arr.length === 1) rec = arr[0].id;
        else if(arr.length > 1)  {
          for (let i = 0, l = arr.length; i < l; ++i) if(arr[i].discriminator === res.match[3]) rec = arr[i].id;
        }
        else if(arr.length < 1) { return res.send('User ' + res.match[2] + ' was not found.') }
        if(res.match[3] === bot.client.user.discriminator) return res.send("Sorry but I am currently unmarkable.");
        if(rec === res.message.user.id) return res.send("Sorry but you cannot mark yourself.");
        if(res.match[1] <= 100) transfer_marks(res, rec, res.match[1], res.match[4]);
        else res.send('Max is +100')
      })
    } else if(adapter == 'slack') {
      bot.react(res => {
        if(res.message.type === 'added' && res.message.reaction === 'mh') {
          transfer_marks(res, res.message.item_user.id, 1, "reaction")
        }
      })
      bot.hear(/marks\s*@? ?(\w+)$/i, res => {
        var user = bot.brain.userForName(res.match[1]);
        if(!user) return res.send("Sorry but I cant find that user.");
        try { var bal = keys[user.id].bitmark.balance } catch(e) { var bal = 0 }
        res.send(res.match[1] + ' has ' + bal + symbol + '.')
      })
      bot.hear(/\+(\d+)\s+@? ?(\w+)\s*(.*)?$/i, res => {
        var rec = bot.brain.userForName(res.match[2]);
        if(!rec) return res.send("Sorry but I cant find that user.");
        if(rec.id === bot.adapter.self.id) return res.send("Sorry but I am currently unmarkable.");
        if(rec.id === res.message.user.id) return res.send("Sorry but you cannot mark yourself.");
        if(res.match[1] <= 100) transfer_marks(res, rec.id, res.match[1], res.match[3]);
        else res.send('Max is +100')
      })
    }
  }
  function transfer_marks(res, recipient, amount, why_context) {
    var bot = res.robot, uid = res.message.user.id;
    if(!keys[uid] || !keys[uid].bitmark) return res.send("Sorry but you dont have an account, use the crypto me bitmark command.");
    if(!why_context) why_context = "N/A";
    if(keys[uid].bitmark.balance >= parseFloat(amount)) {
      if(!keys[recipient]) {
        // User has no base key, create one
        bot.emit("createMeEvent", recipient, res);
        bot.emit("cryptoMeEvent", recipient, 'bitmark', parseFloat(amount), res);
      } else if(!keys[recipient].bitmark) {
        bot.emit("cryptoMeEvent", recipient, 'bitmark', parseFloat(amount), res)
      } else {
        keys[recipient].bitmark.balance += parseFloat(amount);
        keys[uid].bitmark.balance -= parseFloat(amount)
      }
      bot.brain.save()
      res.send(res.message.user.name + ' has marked ' + bot.brain.userForId(recipient).name + ' ' + amount + symbol + '. ( ' + why_context + ' )')
    } else {
      res.send('Sorry, but you dont have enough marks. Try depositng.')
    }
  }
  function withdraw_marks(res, address, amount) {
    if(keys[res.message.user.id].bitmark.balance >= parseFloat(amount)) {
      var command = 'bitmarkd sendtoaddress ' + address + ' ' + (parseFloat(amount) / 1000.0);
      exec(command, (error, stdout, stderr) => {
        keys[res.message.user.id].bitmark.balance -= parseFloat(amount);
        res.robot.brain.save();
        res.send(stdout)
      })
    } else {
      res.send('Sorry, you have not been marked that many times yet.')
    }
  }
}).call(this);
