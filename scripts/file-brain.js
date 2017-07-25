// Description:
//   Removes auto save from brain, and writes to disk on save event.
//
// Configuration:
//   FILE_BRAIN_PATH
//
// Commands:
//   None
//
// Author:
//   dustyburwell

(function() {
  var fs, path;
  fs = require('fs');
  path = require('path');

  module.exports = function(robot) {
    var brainPath, data, error;
    robot.brain.setAutoSave(false);
    brainPath = process.env.FILE_BRAIN_PATH || __dirname + '/../';
    brainPath = path.join(brainPath, 'brain-dump.json');
    try {
      data = fs.readFileSync(brainPath, 'utf-8');
      if (data) {
        robot.brain.mergeData(JSON.parse(data));
      }
    } catch (error1) {
      error = error1;
      if (error.code !== 'ENOENT') {
        console.log('Unable to read file', error);
      }
    }
    return robot.brain.on('save', function(data) {
      return fs.writeFileSync(brainPath, JSON.stringify(data), 'utf-8');
    });
  };

}).call(this);
