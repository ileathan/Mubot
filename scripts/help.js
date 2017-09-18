// Description:
//   Generates help commands for Hubot.
//
// Commands:
//   hubot help - Displays all of the help commands that this bot knows about.
//   hubot help <query> - Displays all help commands that match <query>.
//
// URLS:
//   /hubot/help
//
// Configuration:
//   HUBOT_HELP_REPLY_IN_PRIVATE - if set to any avlue, all `mubot help` replies are sent in private
//   HUBOT_HELP_DISABLE_HTTP - if set, no web entry point will be declared
//   HUBOT_HELP_HIDDEN_COMMANDS - comma-separated list of commands that will not be displayed in help
//
// Notes:
//   These commands are grabbed from comment blocks at the top of each file.
//

(function() {
  function helpContents(name, commands) {
     return "<!DOCTYPE html>\n<html>\n  <head>\n  <meta charset=\"utf-8\">\n  <title>" + name + " Help</title>\n  <style type=\"text/css\">\n    body {\n      background: #d3d6d9;\n"
     + " color: #636c75;\n      text-shadow: 0 1px 1px rgba(255, 255, 255, .5);\n      font-family: Helvetica, Arial, sans-serif;\n    }\n    h1 {\n      margin: 8px 0;\n      padding: 0;\n"
     + "    }\n    .commands {\n      font-size: 13px;\n    }\n    p {\n      border-bottom: 1px solid #eee;\n      margin: 6px 0 0 0;\n      padding-bottom: 5px;\n    }\n    p:last-child {\n"
     + "      border: 0;\n    }\n  </style>\n  </head>\n  <body>\n    <h1>" + name + " Help</h1>\n    <div class=\"commands\">\n      " + commands + "\n    </div>\n  </body>\n</html>"
  }
  function getHelpCommands(bot) {
    var help_commands = bot.helpCommands();
    if(hiddenCommandsPattern()) {
      help_commands = help_commands.filter(command => !hiddenCommandsPattern().test(command))
    }
    help_commands = help_commands.map(command => command.replace(/^(hubot|mubot)/i, bot.alias || bot.name));
    return help_commands.sort()
  }
  function hiddenCommandsPattern() {
    var hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS;
    if(hiddenCommands) {
      return new RegExp("^(hubot|mubot) (?:" + hiddenCommands.replace(/,/g, '|') + ") - ")
    }
  }
  module.exports = bot => {
    bot.respond(/help(?:\s+(.*))?$/i, msg => {
      var cmds, replyText, filter;
      cmds = getHelpCommands(bot);
      filter = msg.match[1];
      if(filter) {
        cmds = cmds.filter(cmd => new RegExp(filter, 'i').test(cmd));
        if(cmds.length === 0) {
          return msg.send("No available commands match " + filter)
        }
        replyText = cmds.join('\n');
        msg.send(replyText);
      } else {
        let room = msg.message.user.id
        bot.adapter.send({room: msg.message.user.id}, replyText)
      }
    });
    if(!process.env.HUBOT_HELP_DISABLE_HTTP) {
      bot.router.get("/" + bot.name + "/help", (req, res) => {
        var cmds, replyText;
        cmds = renamedHelpCommands(bot).map(cmd => cmd.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        if(req.query.q != null) {
          cmds = cmds.filter(cmd => cmd.match(new RegExp(req.query.q, 'i')))
        }
        replyText = "<p>" + cmds.join('</p><p>') + "</p>";
        replyText = replyText.replace(new RegExp(bot.name, 'ig'), "<b>" + bot.name + "</b>");
        res.setHeader('content-type', 'text/html');
        res.end(helpContents(bot.name, replyText))
      })
    }
  }
}).call(this);
