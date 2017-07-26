execSync = require('child_process').execSync

module.exports = bot => {
  bot.respond(/getrawtransfer (.*)$/i, res => {
    stdout = execSync('bitmarkd getrawtransaction ' + res.match[1] + ' 1')
    stdout = JSON.parse(stdout.toString('utf8').replace(/(\n|\\)/, ''))
    res.send(JSON.stringify(stdout, null, 2))
  })
}