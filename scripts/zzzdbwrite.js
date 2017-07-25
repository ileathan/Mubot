// Description:
//   Removes auto save from brain, and writes to disk on save event.
//
// Author:
//   leathan
(function() {
  var fs = require('fs'), path = require('path');
  module.exports = function(robot) {
    var data;
    robot.brain.setAutoSave(false);
    try {
      data = fs.readFileSync(path.join(__dirname, '/../brain.json') 'utf-8');
      if (data) robot.brain.mergeData(JSON.parse(data));
    } catch (err) { if (err.code !== 'ENOENT') console.log(error); }
    return robot.brain.on('save', function(data) {
      fs.writeFile(brainPath, JSON.stringify(data), 'utf-8', ()=>{});
    });
  };
}).call(this);
