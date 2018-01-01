// Description:
//   Shorten URLs with bit.ly & expand detected bit.ly URLs
//
// Dependencies:
//   None
//
// Configuration:
//   MUBOT_BITLY_ACCESS_TOKEN
//
// Commands:
//   mubot (bitly|shorten) (me) <url> - Shorten the URL using bit.ly
//   http://bit.ly/[hash] - looks up the real url
//
// Author:
//   leathan
//   sleekslush
//   drdamour
//   johnwyles

(function() {
  module.exports = bot => {
    bot.respond(/(?:bitly|shorten)(?: me)? (.+)$/i, msg => {
      return msg.http("https://api-ssl.bitly.com/v3/shorten").query({
        access_token: process.env.MUBOT_BITLY_ACCESS_TOKEN,
        longUrl: msg.match[1],
        format: "json"
      }).get()(function(err, res, body) {
        var response;
        response = JSON.parse(body);
        msg.send(response.status_code === 200 ? response.data.url : response.status_txt)
      })
    });
    bot.hear(/(?:https?:\/\/(bit\.ly|yhoo\.it|j\.mp|pep\.si|amzn\.to)\/[0-9a-z\-]+)/ig, msg => {
      msg.http("https://api-ssl.bitly.com/v3/expand").query({
        access_token: process.env.MUBOT_BITLY_ACCESS_TOKEN,
        shortUrl: msg.match
      }).get()((err, res, body) => {
        var ref, parsedBody = JSON.parse(body);
        if(parsedBody.status_code === !200) {
          return msg.send("Lookup failed " + response.status_txt)
        }
        ref = parsedBody.data.expand;
        for(let i = 0, len = ref.length; i < len; ++i) {
          ref = ref[i];
          msg.send(ref.short_url + " is " + ref.long_url)
        }
      })
    })
  }
}).call(this);
