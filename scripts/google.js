// Description:
//   A way to interact with the Google Web API.
//
// Commands:
//   hubot google|g <query> - Queries Google Web for <query> and returns the first result.

var cheerio = require('cheerio')
var scrape  = require('scrapeit')
var request = require('request')

module.exports = function (robot) {
  robot.respond(/(?:g|google) (?:me )?(.*)/i, function (msg) {
    try { index = msg.match[1].match(/([1-9]|1[1-8])$/)[1] } catch(e) { index = "" }
    query = msg.match[1].slice(0, msg.match[1].length - index.toString().length)
    googleMe(msg, index, query, function(url) {
      msg.send(url)
    })
  })
  robot.respond(/(?:image) (?:me )?(.*)/i, function (msg) {
    try { index = msg.match[1].match(/([1-9]|1[1-8])$/)[1] } catch(e) { index = "" }
    console.log(index)
    query = msg.match[1].slice(0, msg.match[1].length - index.toString().length)
    googleImgMe(robot, index, query, function(url) {
      msg.send(url)
    })
  })
}
function googleImgMe(robot, index, query, cb) {
  if (index == "") index = 1
  request("https://www.google.com/search?tbm=isch&q="+encodeURIComponent(query), function(err, res, html){ 
    c = cheerio.load(html)('div img')[+index+1].parent.attribs.href
    cb(decodeURIComponent(c.slice( 7, c.indexOf('&'))))
  })
}
function googleMe(msg, index, query, cb) {
  if (index == "") index = 1
  request("https://www.google.com/search?q="+encodeURIComponent(query),  function(e, r, html) {
    console.log(cheerio.load(html)('.r a')[index-1].attribs.href)
    console.log(cheerio.load(html)('.r a')[index].attribs.href)
    console.log(cheerio.load(html)('.r a')[index+1].attribs.href)
    console.log(cheerio.load(html)('.r a')[index+2].attribs.href)
    o = cheerio.load(html)('.r a')[index-1].attribs.href
    if (/^\/search\?/.test(o)) o = cheerio.load(html)('.r a')[index].attribs.href
    cb(decodeURIComponent(o.slice(7, o.indexOf('&'))))
  })
}
