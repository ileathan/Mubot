// Description:
//   Email from hubot to any address
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot email <user@email.com> -s <subject> -m <message> - Sends email with the <subject> <message> to address <user@email.com>
//
// Author:
//   earlonrails
//
// Additional Requirements
//   unix mail client installed on the system

(function() {
  var child_process, util;
  util = require('util');
  child_process = require('child_process');

  function sendEmail(recipients, subject, msg, from) {
    child_process.exec('echo ' + msg + ' | mail -s "' + subject + ' (From: ' + from + ')" ' + recipients, function(error, stdout, stderr) {
      stdout && console.log('stdout: ' + stdout);
      stderr && console.log('stderr: ' + stderr)
    })
  }

  module.exports = bot => {
    bot.respond(/email (.*) -s (.*) -m (.*)/i, function(msg) {
      sendEmail(msg.match[1].split(" "), msg.match[2], msg.match[3], msg.message.user.id);
      msg.send("email sent")
    })
  };

}).call(this);
