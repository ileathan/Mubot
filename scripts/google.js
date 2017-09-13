// Description:
//   A way to interact with the Google Web API.
//
// Commands:
//   mubot google|g <query> <index> - Queries google and returns result number <index>.
//   mubot image[ me] <query> - Queries google images and returns result number <index>.
//
(function(){
  const cheerio = require('cheerio');
  const request = require('request');

  module.exports = bot => {
    bot.respond(/(g|google|image) (?:me )?(.*)/i, msg => {
      var index, query;
      index = msg.match[2].match(/[1-9]|1[1-8]$/) && index = index[1];
      query = msg.match[2].slice(0, -index.length);
      msg.match[1] === 'image' ?
        googleImgMe(bot, index, query, url => msg.send(url))
      :
        googleMe(msg, index, query, url => msg.send(url))
    })
  }
  function googleImgMe(bot, index, query, cb) {
    !index && (index = 1);
    request("https://www.google.com/search?tbm=isch&q="+encodeURIComponent(query), (err, res, html) => {
      var ref = cheerio.load(html)('div img')[+index + 1].parent.attribs.href;
      cb(decodeURIComponent(ref.slice( 7, ref.indexOf('&'))))
    })
  }
  function googleMe(msg, index, query, cb) {
    !index && (index = 1);
    request("https://www.google.com/search?q="+encodeURIComponent(query), (err, res, html) => {
      var ref = cheerio.load(html)('.r a')[index-1].attribs.href;
      if(/^\/search\?/.test(ref)) ref = cheerio.load(html)('.r a')[index].attribs.href;
      cb(decodeURIComponent(ref.slice(7, ref.indexOf('&'))))
    })
  }
}).call(this);
