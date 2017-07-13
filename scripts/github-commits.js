// Description:
//   An HTTP Listener for notifications on github pushes
//
// Dependencies:
//   "url": ""
//   "querystring": ""
//   "gitio2": "2.0.0"
//
// Configuration:
//   Just put this url <HUBOT_URL>:<PORT>/hubot/gh-commits?room=<room> into you'r github hooks
//   HUBOT_GITHUB_COMMITS_ONLY -- Only report pushes with commits. Ignores creation of tags and branches.
//
// Commands:
//   None
//
// URLS:
//   POST /hubot/gh-commits?room=<room>[&type=<type]
//
// Authors:
//   nesQuick

(function() {
  var gitio, querystring, url;

  url = require('url');

  querystring = require('querystring');

  gitio = require('gitio');

  module.exports = function(robot) {
    robot.router.post("/hubot/gh-commits", function(req, res) {
      var commit, commitWord, error, i, len, push, query, ref, results, user;
      query = querystring.parse(url.parse(req.url).query);
      res.sendStatus(200);
      user = {};
      if (query.room) {
        user.room = query.room;
      }
      if (query.type) {
        user.type = query.type;
      }
      if (req.body.zen != null) {
        return;
      }
      push = req.body;
      try {
        if (push.commits.length > 0) {
          commitWord = push.commits.length > 1 ? "commits" : "commit";
          robot.send(user, "Got " + push.commits.length + " new " + commitWord + " from " + push.commits[0].author.name + " on " + push.repository.name);
          ref = push.commits;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            commit = ref[i];
            results.push((function(commit) {
              return gitio(commit.url, function(err, data) {
                return robot.send(user, "  * " + commit.message + " (" + (err ? commit.url : data) + ")");
              });
            })(commit));
          }
          return results;
        } else if (!process.env.HUBOT_GITHUB_COMMITS_ONLY) {
          if (push.created) {
            if (push.base_ref) {
              robot.send(user, push.pusher.name + " created: " + push.ref + ": " + push.base_ref);
            } else {
              robot.send(user, push.pusher.name + " created: " + push.ref);
            }
          }
          if (push.deleted) {
            return robot.send(user, push.pusher.name + " deleted: " + push.ref);
          }
        }
      } catch (error1) {
        error = error1;
        return console.log("github-commits error: " + error + ". Push: " + push);
      }
    });
  };

}).call(this);
