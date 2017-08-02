// Description:
//   Allows Mubot to know many languages.
//
// Commands:
//   mubot translate me <phrase> - Searches for a translation for the <phrase> and then prints that bad boy out.
//   mubot translate me from <source> into <target> <phrase> - Translates <phrase> from <source> into <target>. Both <source> and <target> are optional
//
(function() {
  var getCode, languages;

  languages = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "ar": "Arabic",
    "az": "Azerbaijani",
    "eu": "Basque",
    "bn": "Bengali",
    "be": "Belarusian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "zh-CN": "Simplified Chinese",
    "zh-TW": "Traditional Chinese",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "tl": "Filipino",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "iw": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "is": "Icelandic",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "kn": "Kannada",
    "ko": "Korean",
    "la": "Latin",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "mk": "Macedonian",
    "ms": "Malay",
    "mt": "Maltese",
    "no": "Norwegian",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sr": "Serbian",
    "sk": "Slovak",
    "sl": "Slovenian",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "yi": "Yiddish"
  };

  getCode = function(language, languages) {
    var code, lang;
    for (code in languages) {
      lang = languages[code];
      if (lang.toLowerCase() === language.toLowerCase()) {
        return code;
      }
    }
  };

  module.exports = function(robot) {
    var _, language, language_choices, pattern;
    language_choices = ((function() {
      var results;
      results = [];
      for (_ in languages) {
        language = languages[_];
        results.push(language);
      }
      return results;
    })()).sort().join('|');
    pattern = new RegExp('translate(?: me)?' + ("(?: from (" + language_choices + "))?") + ("(?: (?:in)?to (" + language_choices + "))?") + '(.*)', 'i');
    return robot.respond(pattern, function(msg) {
      var origin, ref, target, term;
      term = "\"" + ((ref = msg.match[3]) != null ? ref.trim() : void 0) + "\"";
      origin = msg.match[1] !== void 0 ? getCode(msg.match[1], languages) : 'auto';
      target = msg.match[2] !== void 0 ? getCode(msg.match[2], languages) : 'en';
      return msg.http("https://translate.google.com/translate_a/single").query({
        client: 't',
        hl: 'en',
        sl: origin,
        ssel: 0,
        tl: target,
        tsel: 0,
        q: term,
        ie: 'UTF-8',
        oe: 'UTF-8',
        otf: 1,
        dt: ['bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't', 'at']
      }).header('User-Agent', 'Mozilla/5.0').get()(function(err, res, body) {
        var parsed;
        if (err) {
          msg.send("Failed to connect to GAPI");
          robot.emit('error', err, res);
          return;
        }
        try {
          if (body.length > 4 && body[0] === '[') {
            parsed = eval(body);
            language = languages[parsed[2]];
            parsed = parsed[0] && parsed[0][0] && parsed[0][0][0];
            parsed && (parsed = parsed.trim());
            if (parsed) {
              if (msg.match[2] === void 0) {
                return msg.send(term + " is " + language + " for " + parsed);
              } else {
                return msg.send("The " + language + " " + term + " translates as " + parsed + " in " + languages[target]);
              }
            }
          } else {
            throw new SyntaxError('Invalid JS code');
          }
        } catch (error) {
          err = error;
          msg.send("Failed to parse GAPI response");
          return robot.emit('error', err);
        }
      });
    });
  };

}).call(this);
