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
//   mubot view <file> - Displays contents of file.
//   mubot create [mode] <file> <contents> - Creates file with with specified contents.
//
// Author:
//   leathan
//

(function() {
  const fs = require('fs');
  const path = require('path');
  module.exports = bot => {

    bot.respond(/create(?: me)? (\w )?(.+)(?:\s+)```([\s\S]+)```$/i, { id: 'create.file' }, msg => {
      if(msg.match[1] === 'a ') {
        fs.appendFile(path.resolve(__dirname + "/" + msg.match[2])
        , "\n" + msg.match[3]
        , err => {
            msg.send(err || "Appended to ```" + msg.match[2] + "``` Content ```javascript\n" + msg.match[3] + "```")
        })
      } else {
        fs.writeFile(path.resolve(__dirname + "/" + msg.match[2])
        , msg.match[3]
        , err => {
          msg.send(err || "Created ```" + msg.match[2] + "``` Content ```javascript\n" + msg.match[3] + "```")
        })
      }
    });
    bot.respond(/view (.+)$/i, { id: 'view.file' }, msg => {
      // If there's no extension add default .js.
      var file = /\.[^.]+$/.test(msg.match[1]) ? msg.match[1] : msg.match[1] + '.js';
      fs.readFile(path.resolve(__dirname + "/" + file), (err, data) => {
        if(err) return msg.send(err);
        data = data.toString().replace(/`/g, '\\\`');
        msg.send("Viewing ```" + msg.match[1] + "```Contents ```javascript\n" + data + "```")
      })
    })
  }
}).call(this);
