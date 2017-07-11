// Description:
//   "Simple path to have Hubot echo out anything in the message querystring for a given room."
//
// Dependencies:
//   "querystring": "0.1.0"
//
// Configuration:
//   None
//
// Commands:
//   None
//
// URLs:
//   GET /hubot/say?message=<message>[&room=<room>&type=<type>]
//
// Author:
//   ajacksified

(function() {
  var querystring;

  querystring = require('querystring');

  module.exports = function(robot) {
    return robot.router.get("/hubot/say", function(req, res) {
      var envelope, query;
      query = querystring.parse(req._parsedUrl.query);
      envelope = {};
      envelope.user = {};
      if (query.room) {
        envelope.user.room = envelope.room = query.room;
      } else {
        query.room = '328708919746887682';
      }
      envelope.user.type = query.type || 'groupchat';
      robot.send(envelope, query.message);
      return res.end("Said " + query.message);
    });
  };

}).call(this);
