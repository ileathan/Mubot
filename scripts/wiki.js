// Description:
//   Searches wikipedia.
//
// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//   "underscore": "1.3.3"
//   "underscore.string": "2.3.0"
//
// Configuration:
//   None
//
// Commands:
//   mubot wiki me <query> - Searches for <query> on Wikipedia.
//
// Author:
//   h3h

(function() {
  var HTMLParser, Select, _, _s, childrenOfType, findBestParagraph, makeArticleURL, makeTitleFromQuery, parseHTML, strCapitalize, wikiMe;

  _ = require("underscore");

  _s = require("underscore.string");

  Select = require("soupselect").select;

  HTMLParser = require("htmlparser");

  module.exports = function(bot) {
    return bot.respond(/(wiki)( me)? (.*)/i, function(msg) {
      return wikiMe(bot, msg.match[3], function(text, url) {
        msg.send(text);
        if (url) {
          return msg.send(url);
        }
      });
    });
  };

  wikiMe = function(bot, query, cb) {
    var articleURL;
    articleURL = makeArticleURL(makeTitleFromQuery(query));
    return bot.http(articleURL).header('User-Agent', 'Hubot Wikipedia Script').get()(function(err, res, body) {
      var bodyText, paragraphs;
      if (err) {
        return cb("Sorry, the tubes are broken.");
      }
      if (res.statusCode === 301) {
        return cb(res.headers.location);
      }
      if (/does not have an article/.test(body)) {
        return cb("Wikipedia has no idea what you're talking about.");
      }
      paragraphs = parseHTML(body, "p");
      bodyText = findBestParagraph(paragraphs) || "Have a look for yourself:";
      return cb(bodyText, articleURL);
    });
  };

  childrenOfType = function(root, nodeType) {
    var child, ref;
    if ((root != null ? root.type : void 0) === nodeType) {
      return [root];
    }
    if ((root != null ? (ref = root.children) != null ? ref.length : void 0 : void 0) > 0) {
      return (function() {
        var i, len, ref1, results;
        ref1 = root.children;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          child = ref1[i];
          results.push(childrenOfType(child, nodeType));
        }
        return results;
      })();
    }
    return [];
  };

  findBestParagraph = function(paragraphs) {
    var childs, text, textNode;
    if (paragraphs.length === 0) {
      return null;
    }
    childs = _.flatten(childrenOfType(paragraphs[0], 'text'));
    text = ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = childs.length; i < len; i++) {
        textNode = childs[i];
        results.push(textNode.data);
      }
      return results;
    })()).join('');
    text = text.replace(/\s*\([^()]*?\)/g, '').replace(/\s*\([^()]*?\)/g, '');
    text = text.replace(/\s{2,}/g, ' ');
    text = text.replace(/\[[\d\s]+\]/g, '');
    text = _s.unescapeHTML(text);
    if (text.replace(/[^a-zA-Z]/g, '').length < 35) {
      return findBestParagraph(paragraphs.slice(1));
    } else {
      return text;
    }
  };

  makeArticleURL = function(title) {
    return "https://en.wikipedia.org/wiki/" + (encodeURIComponent(title));
  };

  makeTitleFromQuery = function(query) {
    return strCapitalize(_s.trim(query).replace(/[ ]/g, '_'));
  };

  parseHTML = function(html, selector) {
    var handler, parser;
    handler = new HTMLParser.DefaultHandler((function() {}), {
      ignoreWhitespace: true
    });
    parser = new HTMLParser.Parser(handler);
    parser.parseComplete(html);
    return Select(handler.dom, selector);
  };

  strCapitalize = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  };

}).call(this);
