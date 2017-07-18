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
  var adapter, deposit_marks, exec, marks, symbol, why_context
  exec = require('child_process').exec;
  symbol = '₥';
  function to_URI(name) { return id }               // Pending future API
  function from_URI(URI) { return URI }             // Pending future API
  function deposit_marks(r, URI, amount, robot) { } // Will add when needed
  function transfer_marks(r, recipient, amount, robot, why_context) {
    if (why_context == null) why_context = "N/A"
    if (marks[r.message.user.id] >= parseFloat(amount)) {
      if (marks[recipient] == null) marks[recipient] = 0
      marks[recipient] += parseFloat(amount);
      marks[r.message.user.id] -= parseFloat(amount);
      robot.brain.save()
      return r.send(r.message.user.name + ' has marked ' + robot.brain.userForId(recipient).name + ' ' + amount + symbol + '. ( ' + why_context + ' )');
    } else {
      return r.send('Sorry, but you dont have enough marks. Try the deposit command or get marked more.');
    }
  }
  function withdraw_marks(r, address, amount, robot) {
    if (robot.brain.data.marks[r.message.user.id] >= parseFloat(amount)) {
      var command = 'bitmark-cli sendtoaddress ' + address + ' ' + (parseFloat(amount) / 1000.0);
      return exec(command, (error, stdout, stderr) => {
        robot.brain.data.marks[r.message.user.id] -= parseFloat(amount);
        return r.send(stdout);
      });
    } else {
      return r.send('Sorry, you have not been marked that many times yet.');
    }
  }
  module.exports = robot => {
    adapter = robot.adapterName;
    robot.brain.on('loaded', ()=>{
      if (robot.brain.data.marks == null) robot.brain.data.marks = {}; marks = robot.brain.data.marks;
      if(marks['183771581829480448'] == null) marks['183771581829480448'] = 12000
      if(marks['U02JGQLSQ']          == null) marks['U02JGQLSQ']          = 12000
    })
    robot.hear(/withdraw\s+([\w\S]+)\s+(\d+)\s*$/i, r => {
      withdraw_marks(r, r.match[1], r.match[2], robot);
    });
    robot.hear(/marks\s*$/i, r => {
      if (marks[r.message.user.id] == null) marks[r.message.user.id] = 0;
      r.send('You have ' + marks[r.message.user.id] + symbol + '.');
    });
    robot.router.get("/api/marks", (req, res) => {
      res.json(robot.brain.data.marks);
    });
    if(adapter == 'discord') {
      robot.hear(/marks\s+@? (.*)#(\d{4})/i, r => {
        arr = robot.brain.usersForFuzzyName(r.match[1])
        if (arr.length == 1 && marks[arr[0].id]) {
          return r.send(r.match[1] + ' has ' + marks[arr[0].id] + symbol + '.')
        } else if (arr.length > 1)  {
          for (i=0; i<arr.length; i++) if (arr[i].discriminator == r.match[2])  return r.send(r.match[1] + ' has ' + marks[arr[i].id] + symbol + '.')
        } else if (arr.length < 1) { return r.send('User ' + r.match[1] + ' was not found.') }
        return r.send(r.match[1] + ' has 0' + symbol + '.')
      })
      robot.hear(/marks\s+<@?!?(\d+)>$/i, r => {
       if (robot.brain.data.users[r.match[1]]) {
          if (marks[r.match[1]]  == null) marks[r.match[1]] = 0
          return r.send(robot.brain.data.users[r.match[1]] + ' has ' + marks[r.match[1]] + symbol + '.');
        } else {
          return r.send("Sorry, I can't find that user.");
        }
      })
      robot.hear(/^\+(\d+)\s+<@?!?(\d+)>\s*(.*)?$/i, r => {
        if (r.match[2] === robot.client.user)   return r.send("Sorry but I am currently unmarkable.");
        if (r.match[2] === r.message.user.id) return r.send("Sorry but you cannot mark yourself.");
        if (r.match[1] <= 100) { return transfer_marks(r, r.match[2], r.match[1], robot, r.match[3]) } else { return r.send('Max is +100') }
      })
      robot.hear(/\+(\d+)\s+@ (.*)#(\d{4}) ?(.*)/i, r => {
        var rec; var arr = robot.brain.usersForFuzzyName(r.match[2])
        if (arr.length == 1) { rec = arr[0].id }
        else if (arr.length > 1)  {
          for (i=0; i<arr.length; i++) if (arr[i].discriminator == r.match[3]) rec = arr[i].id }
        else if (arr.length < 1) { return r.send('User ' + r.match[2] + ' was not found.') }
        if ((r.match[2].toLowerCase() == robot.name.toLowerCase()) && r.match[3] == robot.client.user.discriminator) return r.send("Sorry but I am currently unmarkable.");
        if (rec === r.message.user.id) return r.send("Sorry but you cannot mark yourself.");
        if (r.match[1] <= 100) transfer_marks(r, rec, r.match[1], robot, r.match[4]); else r.send('Max is +100')
      })
    } else if(adapter == 'slack') {
      robot.react(r => {
        if(r.message.type==='added' && r.message.reaction==='mh') {
          var senderID=r.message.user.id; receiverID=r.message.item_user.id
          transfer_marks(r, r.message.item_user.id, 1, robot, "reaction")
        }
      })
      robot.hear(/marks\s*@? ?(\w+)$/i, r => {
        var user = robot.brain.userForName(r.match[1]);
        if (user == null) return r.send("Sorry but I cant find that user.");
        if (marks[user.id] == null) marks[user.id] = 0
        r.send(r.match[1] + ' has ' + marks[user.id] + symbol + '.');
      })
      robot.hear(/\+(\d+)\s+@? ?(\w+)\s*(.*)?$/i, r => {
        var rec = robot.brain.userForName(r.match[2])
        if (  rec  ==  null  )                return r.send("Sorry but I cant find that user.");
        if (rec.id == robot.adapter.self.id)  return r.send("Sorry but I am currently unmarkable.");
        if (rec.id == r.message.user.id)      return r.send("Sorry but you cannot mark yourself.");
        if (r.match[1] <= 100) transfer_marks(r, rec.id, r.match[1], robot, r.match[3]); else return r.send('Max is +100')
      })
    }
  };
}).call(this);
