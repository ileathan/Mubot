// Description:
//   Get a meme from http://memecaptain.com/
//
// Dependencies:
//   None
//
// Commands:
//   hubot Y U NO <text> - Generates the Y U NO GUY with the bottom caption of <text>
//   hubot I don't always <something> but when i do <text> - Generates The Most Interesting man in the World
//   hubot <text> (SUCCESS|NAILED IT) - Generates success kid with the top caption of <text>
//   hubot <text> ALL the <things> - Generates ALL THE THINGS
//   hubot <text> TOO DAMN <high> - Generates THE RENT IS TOO DAMN HIGH guy
//   hubot Yo dawg <text> so <text> - Generates Yo Dawg
//   hubot All your <text> are belong to <text> - All your <text> are belong to <text>
//   hubot If <text>, <word that can start a question> <text>? - Generates Philosoraptor
//   hubot <text>, BITCH PLEASE <text> - Generates Yao Ming
//   hubot <text>, COURAGE <text> - Generates Courage Wolf
//   hubot ONE DOES NOT SIMPLY <text> - Generates Boromir
//   hubot IF YOU <text> GONNA HAVE A BAD TIME - Ski Instructor
//   hubot IF YOU <text> TROLLFACE <text> - Troll Face
//   hubot Aliens guy <text> - Aliens guy weighs in on something
//   hubot Brace yourself <text> - Ned Stark braces for <text>
//   hubot Iron Price <text> - To get <text>? Pay the iron price!
//   hubot Not sure if <something> or <something else> - Generates a Futurama Fry meme
//   hubot <text>, AND IT'S GONE - Bank Teller
//   hubot WHAT IF I TOLD YOU <text> - Morpheus What if I told you
//   hubot WTF <text> - Picard WTF
//   hubot IF <text> THAT'D BE GREAT - Generates Lumberg
//   hubot MUCH <text> (SO|VERY) <text> - Generates Doge
//   hubot <text> EVERYWHERE - Generates Buzz Lightyear
//
// Author:
//   bobanj, ericjsilva

(function() {
  var getDataPayload, getDataPayloadAdv, memeGenerator, memeGeneratorAdv, memeGeneratorUrl;

  module.exports = function(bot) {
    bot.hear(/^help meme$/i, function(msg) {
      return bot.send({
        room: msg.envelope.user.id
      }, "Y U NO <text> - Generates the Y U NO GUY with the bottom caption of <text>\n" + "I don't always <something> but when i do <text> - Generates The Most Interesting man in the World\n" + "<text> (SUCCESS|NAILED IT) - Generates success kid with the top caption of <text>\n" + "<text> ALL the <things> - Generates ALL THE THINGS\n" + "<text> TOO DAMN <high> - Generates THE RENT IS TOO DAMN HIGH guy\n" + "Yo dawg <text> so <text> - Generates Yo Dawg\n" + "All your <text> are belong to <text> - All your <text> are belong to <text>\n" + "If <text>, <word that can start a question> <text>? - Generates Philosoraptor\n" + "<text>, BITCH PLEASE <text> - Generates Yao Ming\n" + "<text>, COURAGE <text> - Generates Courage Wolf\n" + "ONE DOES NOT SIMPLY <text> - Generates Boromir\n" + "IF YOU <text> GONNA HAVE A BAD TIME - Ski Instructor\n" + "IF YOU <text> TROLLFACE <text> - Troll Face\n" + "Aliens guy <text> - Aliens guy weighs in on something\n" + "Brace yourself <text> - Ned Stark braces for <text>\n" + "Iron Price <text> - To get <text>? Pay the iron price!\n" + "Not sure if <something> or <something else> - Generates a Futurama Fry meme\n" + "<text>, AND IT'S GONE - Bank Teller\n" + "WHAT IF I TOLD YOU <text> - Morpheus What if I told you\n" + "WTF <text> - Picard WTF\n" + "IF <text> THAT'D BE GREAT - Generates Lumberg\n" + "MUCH <text> (SO|VERY) <text> - Generates Doge\n" + "<text> EVERYWHERE - Generates Buzz Lightyear\n");
    });
    bot.respond(/Y U NO (.+)/i, function(msg) {
      return memeGenerator(msg, 'NryNmg', 'Y U NO', msg.match[1], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/iron price (.+)/i, function(msg) {
      return memeGenerator(msg, 'q06KuA', msg.match[1], 'Pay the iron price', function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/aliens guy (.+)/i, function(msg) {
      return memeGenerator(msg, 'sO-Hng', msg.match[1], '', function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/brace yourself (.+)/i, function(msg) {
      return memeGenerator(msg, '7KY5sQ', 'Brace Yourself', msg.match[1], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*) (ALL the .*)/i, function(msg) {
      return memeGenerator(msg, 'cKjh_w', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(I DON'?T ALWAYS .*) (BUT WHEN I DO,? .*)/i, function(msg) {
      return memeGenerator(msg, 'V8QnRQ', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*)(SUCCESS|NAILED IT.*)/i, function(msg) {
      return memeGenerator(msg, 'AbNPRQ', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*) (\w+\sTOO DAMN .*)/i, function(msg) {
      return memeGenerator(msg, 'RCkv6Q', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(NOT SURE IF .*) (OR .*)/i, function(msg) {
      return memeGenerator(msg, 'CsNF8w', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(YO DAWG .*) (SO .*)/i, function(msg) {
      return memeGenerator(msg, 'Yqk_kg', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(All your .*) (are belong to .*)/i, function(msg) {
      return memeGenerator(msg, 'Ss_hXw', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*)\s*BITCH PLEASE\s*(.*)/i, function(msg) {
      return memeGenerator(msg, 'jo9J0Q', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*)\s*COURAGE\s*(.*)/i, function(msg) {
      return memeGenerator(msg, 'IMQ72w', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/ONE DOES NOT SIMPLY (.*)/i, function(msg) {
      return memeGenerator(msg, 'da2i4A', 'ONE DOES NOT SIMPLY', msg.match[1], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(IF YOU .*\s)(.* GONNA HAVE A BAD TIME)/i, function(msg) {
      return memeGenerator(msg, 'lfSVJw', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*)TROLLFACE(.*)/i, function(msg) {
      return memeGenerator(msg, 'dGAIFw', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(IF .*), ((ARE|CAN|DO|DOES|HOW|IS|MAY|MIGHT|SHOULD|THEN|WHAT|WHEN|WHERE|WHICH|WHO|WHY|WILL|WON\'T|WOULD)[ \'N].*)/i, function(msg) {
      return memeGenerator(msg, '-kFVmQ', msg.match[1], msg.match[2] + (msg.match[2].search(/\?$/) === (-1) ? '?' : ''), function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(.*)(AND IT\'S GONE.*)/i, function(msg) {
      return memeGenerator(msg, 'uIZe3Q', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/WHAT IF I TOLD YOU (.*)/i, function(msg) {
      return memeGenerator(msg, 'fWle1w', 'WHAT IF I TOLD YOU', msg.match[1], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/WTF (.*)$/i, function(msg) {
      return memeGenerator(msg, 'z8IPtw', 'WTF', msg.match[1], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(IF .*)(THAT'?D? BE GREAT)/i, function(msg) {
      return memeGenerator(msg, 'q1cQXg', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    bot.respond(/(MUCH .*) ((SO|VERY) .*)/i, function(msg) {
      return memeGenerator(msg, 'AfO6hw', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
    return bot.respond(/(.*)(EVERYWHERE.*)/i, function(msg) {
      return memeGenerator(msg, 'yDcY5w', msg.match[1], msg.match[2], function(url) {
        return msg.send(url);
      });
    });
  };

  memeGeneratorUrl = 'http://memecaptain.com/gend_images';

  getDataPayload = function(imageName, topText, botText) {
    var data;
    data = getDataPayloadAdv(imageName, topText, botText, 0.05, 0, 0.9, 0.25, 0.05, 0.75, 0.9, 0.25);
    return data;
  };

  getDataPayloadAdv = function(imageName, topText, botText, topX, topY, topW, topH, botX, botY, botW, botH) {
    var data;
    data = {
      src_image_id: imageName,
      "private": true,
      captions_attributes: [
        {
          text: topText,
          top_left_x_pct: topX,
          top_left_y_pct: topY,
          width_pct: topW,
          height_pct: topH
        }, {
          text: botText,
          top_left_x_pct: botX,
          top_left_y_pct: botY,
          width_pct: botW,
          height_pct: botH
        }
      ]
    };
    return JSON.stringify(data);
  };

  memeGenerator = function(msg, imageName, topText, botText, callback) {
    var processResult;
    processResult = function(err, res, body) {
      var timer;
      if (err) {
        return msg.send(err);
      }
      if (res.statusCode === 303) {
        callback(res.headers.location);
      }
      if (res.statusCode === 202) {
        timer = setInterval(function() {
          return msg.http(res.headers.location).get()(function(err, res, body) {
            if (res.statusCode === 303) {
              callback(res.headers.location);
              return clearInterval(timer);
            }
          });
        }, 2000);
      }
      if (res.statusCode > 300) {
        msg.reply("Sorry, I couldn't generate that meme. Unexpected status from memecaptain.com: " + res.statusCode);
      }
    };
    return msg.http(memeGeneratorUrl).header("Content-Type", "application/json").header("Accept", "application/json").post(getDataPayload(imageName, topText, botText))(processResult);
  };

  memeGeneratorAdv = function(msg, imageName, topText, botText, topX, topY, topW, topH, botX, botY, botW, botH, callback) {
    var processResult;
    processResult = function(err, res, body) {
      var timer;
      if (err) {
        return msg.send(err);
      }
      if (res.statusCode === 303) {
        callback(res.headers.location);
      }
      if (res.statusCode === 202) {
        timer = setInterval(function() {
          return msg.http(res.headers.location).get()(function(err, res, body) {
            if (res.statusCode === 303) {
              callback(res.headers.location);
              return clearInterval(timer);
            }
          });
        }, 2000);
      }
      if (res.statusCode > 300) {
        msg.reply("Sorry, I couldn't generate that meme. Unexpected status from memecaptain.com: " + res.statusCode);
      }
    };
    return msg.http(memeGeneratorUrl).header("Content-Type", "application/json").header("Accept", "application/json").post(getDataPayloadAdv(imageName, topText, botText, topX, topY, topW, topH, botX, botY, botW, botH))(processResult);
  };

}).call(this);
