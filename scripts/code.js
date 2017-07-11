// Description:
//   Create / view files from the chatroom
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   view <file> - Displays contents of file.
//   \`\`\`//file <data>\`\`\` - Creates file with data
//
// Author:
//   leathan
//


(function() {
  var counter, fs;

  fs = require('fs');

  counter = 0;

  module.exports = function(robot) {
    var Send;
    robot.hear(/^```#(\w )?(.*?)\n((.|\s)+)```$/, {
      id: 'create.file'
    }, function(msg) {
      if (msg.message.user.name !== 'leathan') {
        return;
      }
      if (msg.match[1] === 'a ') {
        return fs.appendFile(__dirname + "/" + msg.match[2], "\n" + msg.match[3], function(err) {
          if (err) {
            msg.send(err);
            return;
          }
          return Send("Appended to ```" + msg.match[2] + "``` Content ```coffeescript\n" + msg.match[3] + "```", msg);
        });
      } else {
        return fs.writeFile(__dirname + "/" + msg.match[2], msg.match[3], function(err) {
          if (err) {
            msg.send(err);
            return;
          }
          return Send("Created ```" + msg.match[2] + "``` Content ```coffeescript\n" + msg.match[3] + "```", msg);
        });
      }
    });
    Send = function(data, msg) {
      var edata, m;
      if (data.length > 2000) {
        m = data.toString().match(/^((?:.|\s){0,1920}\n)/);
        edata = "```coffeescript\n" + data.slice(m[1].length);
        setTimeout(function() {
          return msg.send(data.toString().slice(0, m[1].length) + "```");
        }, counter);
        counter += 200;
        if (edata.length > 2000) {
          return Send(edata, msg);
        } else {
          return setTimeout(function() {
            return msg.send(edata);
          }, counter);
        }
      } else {
        return msg.send(data);
      }
    };
    return robot.hear(/^view (.+)$/, {
      id: 'view.file'
    }, function(msg) {
      if (msg.message.user.name !== 'leathan') {
        return;
      }
      return fs.readFile(__dirname + "/" + msg.match[1], function(err, data) {
        if (err) {
          msg.send(err);
          return;
        }
        data = data.toString().replace(/`/g, '\\\`');
        return Send("Viewing ```" + msg.match[1] + "```Contents ```coffeescript\n" + data + "```", msg);
      });
    });
  };

}).call(this);
