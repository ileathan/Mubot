// Description:
//   A way to interact with the Google Web API.
//
// Commands:
//   mubot google|g <query> <index> - Queries google and returns result number <index>.
//   mubot image[ me] <query> - Queries google images and returns result number <index>.
//
var cheerio = require('cheerio')
var request = require('request')

module.exports = function (robot) {
  robot.respond(/(?:g|google) (?:me )?(.*)/i, function (msg) {
    try
      index = msg.match[1].match(/([1-9]|1[1-8])$/)[1]
     } catch(e) {
        index = ""
     }
    query = msg.match[1].slice(0, msg.match[1].length - index.toString().length)
    googleMe(msg, index, query, function(url) {
      msg.send(url)
    })
  })
  robot.respond(/(?:image) (?:me )?(.*)/i, function (msg) {
   try {
     index = msg.match[1].match(/([1-9]|1[1-8])$/)[1]
    } catch(e) {
      index = ""
    }
    query = msg.match[1].slice(0, msg.match[1].length - index.toString().length)
    googleImgMe(robot, index, query, function(url) {
      msg.send(url)
    })
  })
}
function googleImgMe(robot, index, query, cb) {
  if (index == "") index = 1
  request("https://www.google.com/search?tbm=isch&q="+encodeURIComponent(query), (err, res, html) => {
    c = cheerio.load(html)('div img')[+index+1].parent.attribs.href
    cb(decodeURIComponent(c.slice( 7, c.indexOf('&'))))
  })
}
function googleMe(msg, index, query, cb) {
  if (index == "") index = 1
  request("https://www.google.com/search?q="+encodeURIComponent(query), (e, r, html) => {
    o = cheerio.load(html)('.r a')[index-1].attribs.href
    if (/^\/search\?/.test(o)) o = cheerio.load(html)('.r a')[index].attribs.href
    cb(decodeURIComponent(o.slice(7, o.indexOf('&'))))
  })
}
