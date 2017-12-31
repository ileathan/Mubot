// Description:
//   grep and replace text in files, scripts folder by default.
//
// Commands:
//   Mubot grep grep.js "/grep/salad/i"

module.exports = bot => {
  const exec = require('child_process').exec;

  bot.respond(/grep (?:(.+) )?`((?:\\.|[^`])+)`/i, msg => {
    let [, filename, regex] = msg.match;
    if(!regex) {
      return msg.send("No regex entered, cant continue");
    }
    if(!filename) {
      filename = bot.mubot && bot.mubot.lastErrorFile;
      if(!filename) {
        return msg.msend("Cannot compute filename.")
      }
    }
    let old_word = "";
    let reData = regex.splut(' ');
    if(reData.length) {
      regex = 's/' + reData[1] + '/' + reData[2] + '/g'
      old_word = reData[1];
    } else {
      let left = regex.split('/').shift() || "";
      let flags = regex.split('/').pop() || "";
      let old = regex.slice(left.length + 1);
      old_word = old.match(/((?:\\.|[^/])+)[/]/)[1];
    }

    exec(`grep -ilr ${old_word} ${filename} | xargs -I@ sed -i '' ${regex} @`, (err, stdout, stderr) => {
      msg.send("Grep completed.");
      msg.send(stdout);
    });
  });
};
