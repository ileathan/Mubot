// Description:
//   Make hubot say whatever you like with alternating case.
//
// Commands:
//   hubot hax <text> - Displays text with alternate capitalization.

module.exports = function(robot) {
  robot.respond(/HAX (.*)$/i, function (msg) {
    var str = ""
    var txt = msg.match[1]
    for (var i=0; i<txt.length; i++) {
      var ch = String.fromCharCode(txt.charCodeAt(i));
      if (i % 2 == 1) {
        ch = ch.toUpperCase();
      } else {
        ch = ch.toLowerCase();
      }
      str =  str.concat(ch);
    }
    msg.send(str);
  })
}
