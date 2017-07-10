# Description:
#   None
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot ddg|duck|s <topic> - Prints a nice abstract of the given topic
#   
# Author:
#   tantalor

module.exports = (robot) ->
  robot.respond /(abs|abstract) (.+)/i, (msg) ->
    msg.send "http://api.duckduckgo.com/?format=json&q=#{encodeURIComponent(msg.match[2])}"
    abstract_url = "http://api.duckduckgo.com/?format=json&q=#{encodeURIComponent(msg.match[2])}"
    msg.http(abstract_url)
      .header('User-Agent', 'Hubot Abstract Script')
      .get() (err, _, body) ->
        return msg.send "Sorry, the tubes are broken." if err
        data = JSON.parse(body.toString("utf8"))
        return unless data
        topic = data.RelatedTopics[0] if data.RelatedTopics and data.RelatedTopics.length
        if data.AbstractText
          # hubot abs numerology
          # Numerology is any study of the purported mystical relationship between a count or measurement and life.
          # http://en.wikipedia.org/wiki/Numerology
          msg.send data.AbstractText
          msg.send data.AbstractURL if data.AbstractURL
        else if topic and not /\/c\//.test(topic.FirstURL)
          # hubot abs astronomy
          # Astronomy is the scientific study of celestial objects.
          # http://duckduckgo.com/Astronomy
          msg.send topic.Text
          msg.send topic.FirstURL
        else if data.Definition
          # hubot abs contumacious
          # contumacious definition: stubbornly disobedient.
          # http://merriam-webster.com/dictionary/contumacious
          msg.send data.Definition
          msg.send data.DefinitionURL if data.DefinitionURL
        else
          msg.send "I don't know anything about that."
