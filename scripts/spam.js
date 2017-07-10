// Description: 
//   Make hubot spam whatever you'd life.
//
// Commands:
//   hubot spam [<amount>] <text> - Spams the text 5 times or amount times.

module.exports = (robot) => {
  robot.respond(/spam (\d{1,3}) ?(.*)$/i, (msg) => {
    amount = msg.match[1] || 5
    if (amount > 25) { msg.send("Sorry the most I can span is 25 lines."); return }
    for (i=0; i<amount; i++) msg.send(msg.match[2])
  })
}