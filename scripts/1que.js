// Description:
//   Allows sending messages over the max length for discord, also enforces power commands.
//

(function() {
  var POWER_COMMANDS = ['create.file', 'view.file', 'create.break', 'create.die'],
      POWER_USERS    = ['183771581829480448', 'U02JGQLSQ'];

  module.exports = function(robot) {
    robot.listenerMiddleware((context, next, done) => {
      if (POWER_COMMANDS.indexOf(context.listener.options.id) >= 0) {
        if (POWER_USERS.indexOf(context.response.message.user.id) >= 0) return next();
        else {
          context.response.send("I'm sorry, @" + context.response.message.user.name + ", but you don't have access to do that.");
          return done();
        }
      } else return next();
    });
    robot.responseMiddleware((context, next, done) => {
      if (!context.plaintext) return
      if (context.strings[0].length < 1) return done()
      function chunkAndQue(i) { // i is our iterator.
        var epad = fpad = "**", m; // m is our chunk
        if (context.strings[i] && context.strings[i].length > 2000) { // only proceed if we need to break msg down to chunks.
          if (context.response.match[0].indexOf('view') === 0) {
            fpad = '```javascript\n'; // The command is a view code command
            epad = '```';             // so pad it with code markdown.
          }
          if (context.response.match[0].indexOf('search') === 0) {
            fpad = '```\n';  // The command is a search web command
            epad = '```';    // so pad it with code markdown.
          }
          m = context.strings[i].match(/^([\s\S]{0,1940}\n)/); // Try to get biggest chunk possible until newline char.
          if (!(m ? m[0] : void 0)) {
            m = context.strings[i].match(/^([\s\S]{0,1940})/); // There was no newline, fallback to biggest chunk.
          }
          context.strings.push("" + fpad + context.strings[i].slice(m[1].length)); // Apply the pad to large chunk, and que it.
          context.strings[i] = context.strings[i].slice(0, m[1].length) + epad; // This is the garanteed small chunk. (first out of que)
          i++;
          return chunkAndQue(i);
        } else {
          context.strings[0] = `**${context.strings[0]}**`; 
        }
      }
      chunkAndQue(0);
      return next();
    })
  };
}).call(this);
