// Description:
//   Allow mubot to save in memory code edits to disk
//
;(function(){
  const l = {}
  ;
  l.stacks = [];
  l.exports = bot => {
    bot.respond(/debug ?(config|load)/i, res=>{l.res = res; res.send("debug res var set.")});
    try {
      Object.defineProperty(l, 'stack', {
        get: function() {
          var orig = Error.prepareStackTrace;
          Error.prepareStackTrace = function(_, stack) {
            return stack;
          };
          var err = new Error;
          Error.captureStackTrace(err, arguments.callee);
          var stack = err.stack;
          Error.prepareStackTrace = orig;
          /*try {*/ l.stacks.push(stack); /*res.o = stack; bot.mubot.inspect(l.res); } catch(e){}*/
          return stack;
        },
        enumerable: true
      })
      ;
      Object.defineProperty(l, 'line', {
        get: function() {
          return bot.mubot.debug.stack[1].getLineNumber();
        },
        enumerable: true
      })
      ;
      Object.defineProperty(l, 'function', {
        get: function() {
          return bot.mubot.debug.stack[1].getFunctionName();
        },
        enumerable: true
      })
      ;
    } catch(e){}
    bot.mubot.debug = l;
  }
  ;
  Object.defineProperty(l, 'exports', {
    enumerable: false
  })
  ;
  module.exports = l.exports
  ;
}).call(this);
