// Description:
//   Removes auto save from brain, and writes to disk on save event.
//
// Configureation:
//   set robot.brain.setAutoSave(false) to true, for more writes.
//   currently its set to save just when user balances change.
//
// Author:
//   leathan
(function() {
  var fs = require('fs'), Path = require('path');
  var path = Path.join(__dirname, '/../brain.json')
  module.exports = function(robot) {
    robot.brain.setAutoSave(false);
    try {
      var data = fs.readFileSync(path, 'utf-8');
      if (data) robot.brain.mergeData(JSON.parse(data));
    } catch (err) { if (err.code !== 'ENOENT') console.log(err); }
    robot.brain.on('save', write)
    robot.brain.on('close', write)
    robot.brain.on('shutdown', write)
    robot.brain.on('shutdown', write)
    const write =  data => fs.writeFile(path, JSON.stringify(data), 'utf-8', ()=>{});
  };
}).call(this);
