// Commands:
//   search <link> [for <text>] - returns the link data, or the matching text

const request = require('request');
module.exports = bot => {
  bot.hear(/^(?:search )(\S+)(?: for )?(.*)?$/, m => {
    var link = m.match[1], searchFor = m.match[2];
    if(!/^(https?:\/\/)/.test(link)) link = "http://" + link;
    request(link, (err, res, data) => {
      try {
        data = JSON.parse(data);
        if (!searchFor) {
          m.send(data)
        } else {
          m.send(data[searchFor] ? data[searchFor] : searchFor + " not found.")
        }
      } catch (e) {
        if (!searchFor) {
          m.send(data)
        } else {
          let re = new RegExp(".{0,60}" + searchFor + ".{0,60}", "gi");
          let myMatch = data.match(re);
          m.send(myMatch.length + " results found.\n" + "```" + myMatch.join('\n') + "```")
        }
      }
    })
  })
}
