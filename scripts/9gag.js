// Description:
//   None
//
// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//
// Configuration:
//   HUBOT_9GAG_NO_GIFS (optional, skips GIFs if defined; default is undefined)
//
// Commands:
//   hubot meme - Returns a random meme image
//
// Author:
//   EnriqueVidal
//
// Contributors:
//   dedeibel (gif support)

(function() {
  var HTMLParser, Select, escape_html_characters, get_meme_image, get_meme_title, select_element, send_meme;

  Select = require("soupselect").select;

  HTMLParser = require("htmlparser");

  module.exports = function(robot) {
    return robot.respond(/meme( me)?$/i, function(message) {
      return send_meme(message, false, function(title, src) {
        return message.send(title, src);
      });
    });
  };

  send_meme = function(message, location, response_handler) {
    var meme_domain, url;
    meme_domain = "http://9gag.com";
    location || (location = "/random");
    if (location.substr(0, 4) !== "http") {
      url = meme_domain + location;
    } else {
      url = location;
    }
    return message.http(url).get()(function(error, response, body) {
      var img_src, img_title, selectors;
      if (error) {
        return response_handler("Sorry, something went wrong");
      }
      if (response.statusCode === 302) {
        location = response.headers['location'];
        return send_meme(message, location, response_handler);
      }
      selectors = ["a img.badge-item-img"];
      if (process.env.HUBOT_9GAG_NO_GIFS == null) {
        selectors.unshift("div.badge-animated-container-animated img");
      }
      img_src = get_meme_image(body, selectors);
      if (img_src.substr(0, 4) !== "http") {
        img_src = "http:" + img_src;
      }
      img_title = escape_html_characters(get_meme_title(body, [".badge-item-title"]));
      return response_handler(img_title, img_src);
    });
  };

  select_element = function(body, selectors) {
    var html_handler, html_parser, i, img_container, len, selector;
    html_handler = new HTMLParser.DefaultHandler((function() {}), {
      ignoreWhitespace: true
    });
    html_parser = new HTMLParser.Parser(html_handler);
    html_parser.parseComplete(body);
    for (i = 0, len = selectors.length; i < len; i++) {
      selector = selectors[i];
      img_container = Select(html_handler.dom, selector);
      if (img_container && img_container[0]) {
        return img_container[0];
      }
    }
  };

  get_meme_image = function(body, selectors) {
    return select_element(body, selectors).attribs.src;
  };

  get_meme_title = function(body, selectors) {
    return select_element(body, selectors).children[0].raw;
  };

  escape_html_characters = function(text) {
    var i, len, r, replacements;
    replacements = [[/&/g, '&amp;'], [/</g, '&lt;'], [/"/g, '&quot;'], [/'/g, '&#039;']];
    for (i = 0, len = replacements.length; i < len; i++) {
      r = replacements[i];
      text = text.replace(r[0], r[1]);
    }
    return text;
  };

}).call(this);
