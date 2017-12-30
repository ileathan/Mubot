// Description:
//   None
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   imubot abs|abstract <topic> - Prints a nice abstract of the given topic
//
// Author:
//   tantalor
//
(function() {
  module.exports = bot => {
    bot.respond(/(?:abs|abstract) (.+)/i, msg => {
      var abstract_url = "http://api.duckduckgo.com/?format=json&q=" + encodeURIComponent(msg.match[1]);
      msg.send(abstract_url);
      msg.http(abstract_url).header('User-Agent', 'Hubot Abstract Script').get()((err, req, body) => {
        var data, topic;
        if(err) {
          return msg.send("Sorry, the tubes are broken.")
        }
        data = JSON.parse(body.toString("utf8"));
        if(!data) return;
        if(data.RelatedTopics && data.RelatedTopics.length) {
          topic = data.RelatedTopics[0]
        }
        if(data.AbstractText) {
          msg.send(data.AbstractText);
          if(data.AbstractURL) {
            msg.send(data.AbstractURL)
          }
        } else if(topic && !/\/c\//.test(topic.FirstURL)) {
          msg.send(topic.Text);
          msg.send(topic.FirstURL)
        } else if(data.Definition) {
          msg.send(data.Definition);
          if(data.DefinitionURL) {
            msg.send(data.DefinitionURL)
          }
        } else {
          msg.send("I don't know anything about that.")
        }
      })
    })
  }
}).call(this);
