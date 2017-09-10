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
  const fs = require('fs');
  module.exports = bot => {
    bot.hear(/^```#(\w )?(.*?)\n((.|\s)+)```$/, { id: 'create.file' }, msg => {
      // $1 = mode, $2 = filename, $3 = content
      if(msg.match[1] === 'a ') {
        fs.appendFile(__dirname + "/" + msg.match[2], "\n" + msg.match[3], err => {
          msg.send(err || "Appended to ```" + msg.match[2] + "``` Content ```coffeescript\n" + msg.match[3] + "```", msg)
        })
      } else {
        fs.writeFile(__dirname + "/" + msg.match[2], msg.match[3], function(err) {
          msg.send(err || "Created ```" + msg.match[2] + "``` Content ```coffeescript\n" + msg.match[3] + "```", msg)
        })
      }
    });
    bot.hear(/^view (.+)$/, { id: 'view.file' }, msg => {
      fs.readFile(__dirname + "/" + msg.match[1], function(err, data) {
        if(err) return msg.send(err);
        data = data.toString().replace(/`/g, '\\\`');
        msg.send("Viewing ```" + msg.match[1] + "```Contents ```coffeescript\n" + data + "```", msg)
      })
    })
  }
}).call(this);
