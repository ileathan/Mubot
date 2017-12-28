// Description:
//   Hubot embeds for discord.
//
// Dependencies:
//   Must be using discord adapter, and must edit the sendMessage line, delete ', {split: true}'.
//
// Commands:
//   embed [<link>] <title> - <message> [- <footer>]  -   Creates an embed.
//
// Author:
//   leathan
//

module.exports = function(robot) {
  robot.respond(/embed (http[^ ]+)? ?([^-]+)\s*-\s*([^-]+?)(?:\s*-\s*(.+))?$/i, function(msg) {
debugger;
    color = "" + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1) + Math.floor((Math.random() * 9) + 1)   
    color = parseInt(color)
    var data = {
      embed: {
        color: color,
        author: {
          name: msg.message.user.name,
          icon_url: "https://images-na.ssl-images-amazon.com/images/I/31PZ5sMI95L.jpg"
        },
        fields: [
          {
            name: msg.match[2],
            value: msg.match[3]
          }
        ],
        timestamp: new Date(),
      }
    }
    if(msg.match[4]) { data.embed.footer = {}; data.embed.footer.text = msg.match[4] }
    if(msg.match[1]) { data.embed.url = msg.match[1]; data.embed.title = "Link" }
    msg.send(data)
  })
}
