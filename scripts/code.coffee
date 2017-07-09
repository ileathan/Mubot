# Description:
#   Create / view files from the chatroom
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   view <file> - Displays contents of file.
#   \`\`\`#file <data>\`\`\` - Creates file with data
#
# Author:
#   leathan
#

fs = require('fs');
counter = 0;

module.exports = (robot) ->

  robot.hear /^```#(\w )?(.*?)\n((.|\s)+)```$/, id: 'create.file', (msg) ->
    return unless msg.message.user.name == 'leathan'
    if msg.match[1] is 'a '
      fs.appendFile __dirname + "/" + msg.match[2], "\n#{msg.match[3]}", (err) ->
        if err
          msg.send err
          return
        Send "Appended to ```#{msg.match[2]}``` Content ```coffeescript\n#{msg.match[3]}```" , msg
    else
      fs.writeFile __dirname + "/" + msg.match[2], msg.match[3], (err) ->
        if err
          msg.send err
          return
        Send "Created ```#{msg.match[2]}``` Content ```coffeescript\n#{msg.match[3]}```" , msg

  Send = (data, msg) ->
    if data.length > 2000
      m = data.toString().match(/^((?:.|\s){0,1920}\n)/)
      edata = "```coffeescript\n" + data.slice(m[1].length)
      setTimeout () ->
        msg.send data.toString().slice(0, m[1].length) + "```"
      , counter
      counter += 200;
      if edata.length > 2000
        Send edata, msg
      else
        setTimeout () ->
          msg.send edata
        , counter
    else
      msg.send data

  robot.hear /^view (.+)$/, id: 'view.file', (msg) ->
    return unless msg.message.user.name == 'leathan'
    fs.readFile __dirname + "/" + msg.match[1], (err, data) ->
      if err
        msg.send err
        return
      data = data.toString().replace(/`/g, '\\\`')
      Send "Viewing ```#{msg.match[1]}```Contents ```coffeescript\n#{data}```", msg
