# Description:
#   Returns the URL of the first bing hit for a query
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot bing me <query> - Queries Bing and returns first link
#
# Author:
#   leathan

module.exports = (robot) ->
  robot.respond /(bing)( me)? (.*)/i, (msg) ->
    bingMe msg, msg.match[3], (url) ->
      msg.send url

bingMe = (msg, query, cb) ->
  msg.http('http://www.bing.com/search')
    .query(q: query)
    .get() (err, res, body) ->
      cb body.match(/<li class="b_algo"><h2><a href="([^"]*)"/)?[1] || "Sorry, Bing had zero results for '#{query}'"
