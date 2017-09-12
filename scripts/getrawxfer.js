// Description:
//   Returns the JSON of a raw btc tx id.
//
// Commands:
//   mubot getrawtransfer <txid> - Returns JSON format of txid.
//
// Author:
//   leathan
//
// Dependencies:
//   execSync (should be preinstalled)
//
(function(){
  const execSync = require('child_process').execSync;

  module.exports = bot => {
    bot.respond(/getrawtransfer (.*)$/i, res => {
      var stdout = execSync('bitmarkd getrawtransaction ' + res.match[1] + ' 1');
      stdout = JSON.parse(stdout.toString('utf8').replace(/(\n|\\)/, ''));
      res.send(JSON.stringify(stdout, null, 2))
    })
  }
}).call(this);
