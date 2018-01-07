// Description:
//   Allows sending messages over the max length for discord, also enforces power commands.
//
(function() {
  const POWER_COMMANDS = ['create.file', 'view.file', 'create.eval', 'create.break', 'create.die'], POWER_USERS = ['183771581829480448', 'U02JGQLSQ'];
  module.exports = bot => {
    const ADAPTER = bot.adapterName;
    bot.listenerMiddleware((context, next, done) => {
      // If its a powerful commnad being issued make sure the user is a power user.
      if(POWER_COMMANDS.includes(context.listener.options.id)) {
        if(POWER_USERS.includes(context.response.message.user.id)) next();
        else {
          context.response.send("I'm sorry, @" + context.response.message.user.name + ", but you don't have access to do that.");
          done()
        }
      } else next()
    });
    bot.responseMiddleware((context, next, done) => {
      if(!context.plaintext || !context.strings[0] || !context.strings[0].length) return done();
      // i is our iterator representing que position of msg chunk.
      (function chunkAndQue(i) {
        // Pad the start of the message, and the end of the message.
        var fpad, epad;
        fpad = ADAPTER === 'discord' ? "**" : "*";
        epad = ADAPTER === 'discord' ? " **" : " *";
        // our msg chunk
        var chunk;
        // only proceed if we need to break msg down to chunks.
        if(context.strings[i] && context.strings[i].length > 2000) {
          if(/view|search/i.test(context.response.match[0].split(' ')[1])) {
            // The command is a view or code command, so pad it with code markdown.
            fpad = '```javascript\n';
            epad = '```'
          } else {
            ADAPTER === 'slack' && (context.strings[i] = context.strings[i].replace(/\n/g, '*\n*'));
          }
          // Try to get biggest chunk possible until newline char.
          if(!chunk) {
            // There was no newline, fallback to biggest chunk.
            chunk = context.strings[i].match(/^[\s\S]{0,1940}/)
          }
          // Apply the pad to large chunk, and que it.
          context.strings.push(fpad + context.strings[i].slice(chunk[0].length));
          // This is the garanteed small chunk. (first out of que)
          context.strings[i] = context.strings[i].slice(0, chunk[0].length) + epad;
          chunkAndQue(++i)
        } else {
debugger;
          context.strings[i].split('```').length > 1 || 
            ADAPTER === 'slack' && (context.strings[i] = context.strings[i].trim().replace(/\n/g, '*$&*'));
          ;
          context.strings[0] = fpad + context.strings[0] + epad
        }
      })(0);
      next();
    });
  }
}).call(this);