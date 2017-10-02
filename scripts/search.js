// Commands:
//   search <link> [for <text>] - returns the link data, or the matching text
//
(function(){
  const request = require('request');
  module.exports = bot => {
    bot.hear(/^(?:search )(\S+)(?: for )?(.*)?$/, res => {
      var link = res.match[1], searchFor = res.match[2];
      if(!/^(https?:\/\/)/.test(link)) link = "http://" + link;
      request(link, (err, res, data) => {
        try {
          data = JSON.parse(data);
          if(!searchFor) {
            res.send(data)
          } else {
            res.send(data[searchFor] ? data[searchFor] : searchFor + " not found.")
          }
        } catch(e) {
          if(!searchFor) {
            res.send(data)
          } else {
            let re = new RegExp(".{0,60}" + searchFor + ".{0,60}", "gi");
            let myMatch = data.match(re);
            res.send(myMatch.length + " results found.\n" + "```" + myMatch.join('\n') + "```")
          }
        }
      })
    })
  }
}).call(this);
