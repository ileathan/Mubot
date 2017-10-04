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
  module.exports = bot => {
    bot.respond(/create(?:me )? (\w )?(.*?)(?:\s|\n)(.|\s)+```$/, { id: 'create.file' }, msg => {
      // $1 = mode, $2 = filename, $3 = content
      if(msg.match[1] === 'a ') {
        fs.appendFile(__dirname + "/" + msg.match[2], "\n" + msg.match[3], err => {
          msg.send(err || "Appended to ```" + msg.match[2] + "``` Content ```javascript\n" + msg.match[3] + "```", msg)
        })
      } else {
        fs.writeFile(__dirname + "/" + msg.match[2], msg.match[3], err => {
          msg.send(err || "Created ```" + msg.match[2] + "``` Content ```javascript\n" + msg.match[3] + "```", msg)
        })
      }
    });
    bot.respond(/view (.+)$/, { id: 'view.file' }, msg => {
      var file = /\./.test(data) ? msg.match[1] : msg.match[1] + '.js';
      fs.readFile(__dirname + "/" + file, (err, data) => {
        if(err) return msg.send(err);
        data = data.toString().replace(/`/g, '\\\`');
        // If there's no extension add default .js.
        msg.send("Viewing ```" + msg.match[1] + "```Contents ```javascript\n" + data + "```")
      })
    })
  }
}).call(this);
