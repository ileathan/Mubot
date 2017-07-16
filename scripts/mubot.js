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
  var adapter, deposit_marks, exec, from_URI, irc_server, last, marks, secret, slack_team, symbol, to_URI, transfer_marks, why_context, withdraw_marks;
  exec = require('child_process').exec;
  symbol = '₥';
  last = 'Mubot';
  why_context = '';

  function to_URI(name) { return id }   // Pending future API creation
  function from_URI(URI) { return URI } // ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  function deposit_marks(msg, URI, amount, robot) { } // Will add when needed

  function transfer_marks(msg, recipient, amount, robot, why_context) {
    if (why_context == null) why_context = "N/A"
    if (marks[msg.message.user.id] >= parseFloat(amount)) {
      if (marks[recipient] == null) marks[recipient] = 0
      marks[recipient] += parseFloat(amount);
      marks[msg.message.user.id] -= parseFloat(amount);
      return msg.send(msg.message.user.name + ' has marked ' + robot.brain.userForId(recipient).name + ' ' + amount + symbol + '. ( ' + why_context + ' )');
    } else {
      return msg.send('Sorry, but you dont have enough marks. Try the deposit command or get marked more.');
    }
  };

  function withdraw_marks(msg, address, amount, robot) {
    var command;
    if (robot.brain.data.marks[to_URI(msg.message.user.name)] >= parseFloat(amount)) {
      command = 'bitmark-cli sendtoaddress ' + address + ' ' + (parseFloat(amount) / 1000.0);
      return exec(command, function(error, stdout, stderr) {
        robot.brain.data.marks[to_URI(msg.message.user.name)] -= parseFloat(amount);
        return msg.send(stdout);
      });
    } else {
      return msg.send('Sorry, you have not been marked that many times yet.');
    }
  };

  module.exports = robot => {
    adapter = robot.adapterName;
    if (robot.brain.data.marks == null) robot.brain.data.marks = {}
    marks = robot.brain.data.marks
    if(marks['183771581829480448'] == null) marks['183771581829480448'] = 12000
    if(marks['U02JGQLSQ'] == null) marks['U02JGQLSQ'] = 12000

    if(adapter == 'discord') {
      robot.hear(/^\+(\d+)\s+<@?!?(\d+)>\s*(.*)?$/i, msg => {
        if (msg.match[2] === robot.client.user)   return msg.send("Sorry but I am currently unmarkable.");
        if (msg.match[2] === msg.message.user.id) return msg.send("Sorry but you cannot mark yourself.");
        if (msg.match[1] <= 100) { return transfer_marks(msg, msg.match[2], msg.match[1], robot, msg.match[3]) } else { return msg.send('Max is +100') }
      })
      robot.hear(/\+(\d+)\s+@ (.*)#(\d{4}) ?(.*)/i, r => {
        var rec;
        var arr = robot.brain.usersForFuzzyName('Mubot') //r.match[2])
      if (arr.length == 1) {
        rec = arr[0].id
      } else if (arr.length > 1)  {
        for (i=0; i<arr.length; i++) if (arr[i].discriminator == r.match[3]) rec = arr[i].id
      } else if (arr.length < 1) { return r.send('User ' + r.match[2] + ' was not found.') }
        if ((r.match[2].toLowerCase() == robot.name.toLowerCase()) && r.match[3] == robot.client.user.discriminator) return r.send("Sorry but I am currently unmarkable.");
        if (rec === r.message.user.id) return r.send("Sorry but you cannot mark yourself.");
        if (r.match[1] <= 100) { return transfer_marks(r, rec, r.match[1], robot, r.match[4]) } else { return r.send('Max is +100') }
      })
    } else {
      robot.respond(/\+(\d+)\s+@? ?(\w+)\s*(.*)?$/i, function(msg) {
        if (robot.brain.userForName(msg.match[2]) == null) return msg.send("Sorry but I cant find that user.");
        if (robot.brain.userForName(msg.match[2]).id == robot.adapter.self.id)  return msg.send("Sorry but I am currently unmarkable.");
        if (robot.brain.userForName(msg.match[2]).id == msg.message.user.id) return msg.send("Sorry but you cannot mark yourself.");
        if (msg.match[1] <= 100) { return transfer_marks(msg, robot.brain.userForName(msg.match[2]).id, msg.match[1], robot, msg.match[3]) } else { return msg.send('Max is +100') }
      })
    }
    robot.hear(/withdraw\s+([\w\S]+)\s+(\d+)\s*$/i, function(msg) {
      var destination;
      destination = msg.match[1];
      return withdraw_marks(msg, destination, msg.match[2], robot);
    });
    robot.hear(/marks\s+@? (.*)#(\d{4})/i, r => {
      arr = robot.brain.usersForFuzzyName(r.match[1])
      if (arr.length == 1 && marks[arr[0].id]) {
        return r.send(r.match[1] + ' has ' + marks[arr[0].id] + symbol + '.')
      } else if (arr.length > 1)  {
        for (i=0; i<arr.length; i++) if (arr[i].discriminator == r.match[2])  return r.send(r.match[1] + ' has ' + marks[arr[i].id] + symbol + '.')
      } else if (arr.length < 1) { return r.send('User ' + r.match[1] + ' was not found.') }
      return r.send(r.match[1] + ' has 0' + symbol + '.')
    })

    robot.hear(/marks\s+<@?!?(\d+)>$/i, function(msg) {
     if (robot.brain.data.users[msg.match[1]]) {
        if (marks[msg.match[1]]  == null) marks[msg.match[1]] = 0
        return msg.send(robot.brain.data.users[msg.match[1]] + ' has ' + marks[msg.match[1]] + symbol + '.');
      } else {
        return msg.send("Sorry, I can't find that user.");
      }
    });
    robot.hear(/marks\s*$/i, function(msg) {
      if (marks[msg.message.user.id] == null) marks[msg.message.user.id] = 0;
      msg.send('You have ' + marks[msg.message.user.id] + symbol + '.');
    });
    return robot.router.get("/" + robot.name + "/marks", function(req, res) {
      return res.end(robot.brain.data.marks);
    });
  };

}).call(this);
