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
//   hubot abs|abstract <topic> - Prints a nice abstract of the given topic
//
// Author:
//   tantalor

(function() {
  module.exports = function(robot) {
    return robot.respond(/(abs|abstract) (.+)/i, function(msg) {
      var abstract_url;
      msg.send("http://api.duckduckgo.com/?format=json&q=" + (encodeURIComponent(msg.match[2])));
      abstract_url = "http://api.duckduckgo.com/?format=json&q=" + (encodeURIComponent(msg.match[2]));
      return msg.http(abstract_url).header('User-Agent', 'Hubot Abstract Script').get()(function(err, _, body) {
        var data, topic;
        if (err) {
          return msg.send("Sorry, the tubes are broken.");
        }
        data = JSON.parse(body.toString("utf8"));
        if (!data) {
          return;
        }
        if (data.RelatedTopics && data.RelatedTopics.length) {
          topic = data.RelatedTopics[0];
        }
        if (data.AbstractText) {
          msg.send(data.AbstractText);
          if (data.AbstractURL) {
            return msg.send(data.AbstractURL);
          }
        } else if (topic && !/\/c\//.test(topic.FirstURL)) {
          msg.send(topic.Text);
          return msg.send(topic.FirstURL);
        } else if (data.Definition) {
          msg.send(data.Definition);
          if (data.DefinitionURL) {
            return msg.send(data.DefinitionURL);
          }
        } else {
          return msg.send("I don't know anything about that.");
        }
      });
    });
  };

}).call(this);
