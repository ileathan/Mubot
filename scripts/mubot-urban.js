/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Description:
//   Define terms via Urban Dictionary
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot what is <term>?         - Searches Urban Dictionary and returns definition
//   hubot urban me <term>         - Searches Urban Dictionary and returns definition
//   hubot urban define me <term>  - Searches Urban Dictionary and returns definition
//   hubot urban example me <term> - Searches Urban Dictionary and returns example
//
// Author:
//   Travis Jeffery
//   Robbie Trencheny
//   Benjamin Eidelman (not code)
//   leathan

module.exports = bot => {
  bot.respond(/what ?is ([^?]*)[?]*/i, res =>
    urbanDict(res, res.match[1], function(found, entry, sounds) {
      if (!found) {
        res.send(`I don't know what \"${res.match[1]}\" is`);
        return;
      }
      res.send(`${entry.definition}`);
    })
  );

  bot.respond(/(urban)( define)?( example)?( me)? (.*)/i, res =>
    urbanDict(res, res.match[5], function(found, entry, sounds) {
      if (!found) {
        res.send(`\"${res.match[5]}\" not found`);
        return;
      }
      if (res.match[3]) {
        res.send(`${entry.example}`);
      } else {
        res.send(`${entry.definition}`);
      }
      if (sounds && sounds.length) {
        return res.send(`${sounds.join(' ')}`);
      }
    })
  );
};

var urbanDict = (res, query, callback) =>
  bot.http(`http://api.urbandictionary.com/v0/define?term=${escape(query)}`, (err, response, body) => {
      const result = JSON.parse(body);
      if (result.list.length) {
        callback(true, result.list[0], result.sounds);
      } else {
        callback(false);
      }
  })
;
