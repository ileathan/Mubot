// Commands:
//   search <link> [for <text>] - returns the link data, or the matching text

r = require('request')
module.exports = function (bot) {
  bot.hear (/^(?:search )(\S+)(?: for )?(.*)?$/, function (m) {
    link = m.match[1]; searchFor = m.match[2]
    if (!/^(https?:\/\/)/.test(link)) link = "http://" + link
    r(link, function(e,r,h) {
      try {
        h = JSON.parse(h)
        if (!searchFor) {
          m.send(h)
        } else {
          try { m.send(h[searchFor]) } catch(e) { m.send(searchFor + " not found.") }
        }
      } catch (e) {
        if (!searchFor) {
          m.send(h)
        } else {
          re = new RegExp("(.{0,60}" + searchFor + ".{0,60})", "gi")
          ma = h.match(re)
          m.send(ma.length + " results found.\n" + "```" + ma.join('\n') + "```")
        }
      }
    })
  })
}
