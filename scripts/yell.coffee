# Description: 
#   Make hubot yell whatever you'd life.
#
# Commands:
#   hubot yell <text> - Yells the text.

module.exports = (robot) ->
  robot.respond /YELL (.*)$/i, (msg) ->
    msg.send msg.match[1].toUpperCase()
