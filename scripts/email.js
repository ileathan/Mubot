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

  module.exports = function(robot) {
    var emailTime, sendEmail;
    emailTime = null;
    sendEmail = function(recipients, subject, msg, from) {
      var mailArgs, p;
      mailArgs = ['-s', subject, '-a', "From: " + from, '--'];
      mailArgs = mailArgs.concat(recipients);
      p = child_process.execFile('mail', mailArgs, {}, function(error, stdout, stderr) {
        util.print('stdout: ' + stdout);
        return util.print('stderr: ' + stderr);
      });
      p.stdin.write(msg + "\n");
      return p.stdin.end();
    };
    return robot.respond(/email (.*) -s (.*) -m (.*)/i, function(msg) {
      sendEmail(msg.match[1].split(" "), msg.match[2], msg.match[3], msg.message.user.id);
      return msg.send("email sent");
    });
  };

}).call(this);
