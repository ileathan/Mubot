// Description:
//   None
//
// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//
// Configuration:
//   MUBOT_9GAG_NO_GIFS (optional, skips GIFs if defined; default is undefined)
//
// Commands:
//   mubot meme - Returns a random meme image
//
// Author:
//   EnriqueVidal
//
// Contributors:
//   dedeibel (gif support)

(function() {
  var escape_html_characters, get_meme_image, get_meme_title, select_element;
  const Select = require("soupselect").select,
        HTMLParser = require("htmlparser");

  module.exports = bot => {
    bot.respond(/meme(?: me)?$/i, msg => {
      sendMeme(message, false, (title, src) => {
        msg.send(title, src);
      })
    })
  };

  function sendMeme(message, location, response_handler) {
    var meme_domain, url;
    meme_domain = "http://9gag.com";
    location || (location = "/random");
    if(location.substr(0, 4) !== "http") {
      url = meme_domain + location;
    } else {
      url = location;
    }
    message.http(url).get()((error, response, body) => {
      var img_src, img_title, selectors;
      if(error) {
        response_handler("Sorry, something went wrong");
      }
      if(response.statusCode === 302) {
        location = response.headers.location;
        sendMeme(message, location, response_handler);
      }
      selectors = ["a img.badge-item-img"];
      if(!process.env.MUBOT_9GAG_NO_GIFS) {
        selectors.unshift("div.badge-animated-container-animated img")
      }
      img_src = getMemeImage(body, selectors);
      if(img_src.substr(0, 4) !== "http") {
        img_src = "http:" + img_src;
      }
      img_title = escapeHtmlChars(getMemeTitle(body, [".badge-item-title"]));
      response_handler(img_title, img_src);
    })
  };
  function selectElement(body, selectors) {
    const html_handler = new HTMLParser.DefaultHandler(()=>{}, { ignoreWhitespace: true }),
          html_parser = new HTMLParser.Parser(html_handler);
    html_parser.parseComplete(body);
    for(let i = 0, len = selectors.length; i < len; ++i) {
      let selector = selectors[i];
      let img_container = Select(html_handler.dom, selector);
      if(img_container && img_container[0]) {
        return img_container[0];
      }
    }
  }
  function getMemeImage(body, selectors) {
    return selectElement(body, selectors).attribs.src;
  }
  function getMemeTitle(body, selectors) {
    return selectElement(body, selectors).children[0].raw;
  }
  function escapeHtmlChars(text) {
    var replacements = [[/&/g, '&amp;'], [/</g, '&lt;'], [/"/g, '&quot;'], [/'/g, '&#039;']];
    for(let i = 0, len = replacements.length; i < len; ++i) {
      let ref = replacements[i];
      text = text.replace(ref[0], ref[1])
    }
    return text
  }
}).call(this);
