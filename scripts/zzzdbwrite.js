// Description:
//   Removes auto save from brain, and writes to disk on save event.
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
    return robot.brain.on('save', function(data) {
      fs.writeFile(path, JSON.stringify(data), 'utf-8', ()=>{});
    });
  };
}).call(this);
