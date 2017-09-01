// Description:
//   Allows sending messages over the max length for discord, also enforces power commands.
//
(function() {
  var POWER_COMMANDS = ['create.file', 'view.file', 'create.break', 'create.die'], POWER_USERS = ['183771581829480448', 'U02JGQLSQ'];
  module.exports = function(robot) {
    var adapter = robot.adapterName;
    robot.listenerMiddleware((context, next, done) => {
      if(POWER_COMMANDS.includes(context.listener.options.id)) {
        if(POWER_USERS.includes(context.response.message.user.id)) return next();
        else {
          context.response.send("I'm sorry, @" + context.response.message.user.name + ", but you don't have access to do that.");
          return done()
        }
      } else return next()
    });
    robot.responseMiddleware((context, next, done) => {
      if (!context.plaintext || !context.strings[0] || !context.strings[0].length) return done();
      function chunkAndQue(i) { // i is our iterator.
        // Pad the start of the message, and the end of the message.
        var epad = fpad = adapter === 'discord' ? "**" : "*";
        // m is our chunk
        var m;
        // only proceed if we need to break msg down to chunks.
        if(context.strings[i] && context.strings[i].length > 2000) {
          if(context.response.match[0].indexOf('view') === 0) {
            // The command is a view code command
            fpad = '```javascript\n';
            // so pad it with code markdown.
            epad = '```'
          }
          if(context.response.match[0].indexOf('search') === 0) {
            // The command is a search web command
            fpad = '```\n';
            // so pad it with code markdown.
            epad = '```'
          }
          // Try to get biggest chunk possible until newline char.
          m = context.strings[i].match(/^([\s\S]{0,1940}\n)/);
          if(!(m ? m[0] : void 0)) {
            // There was no newline, fallback to biggest chunk.
            m = context.strings[i].match(/^([\s\S]{0,1940})/)
          }
          // Apply the pad to large chunk, and que it.
          context.strings.push("" + fpad + context.strings[i].slice(m[1].length));
          // This is the garanteed small chunk. (first out of que)
          context.strings[i] = context.strings[i].slice(0, m[1].length) + epad;
          return chunkAndQue(++i)
        } else {
          context.strings[0] = fpad + context.strings[0] + epad
        }
      }
      chunkAndQue(0);
      return next()
    })
  }
}).call(this);
