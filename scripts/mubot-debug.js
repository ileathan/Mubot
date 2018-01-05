// Description:
//   Allow mubot to save in memory code edits to disk
//
;(function(){

  module.exports = bot => {

    try {
      Object.defineProperty(bot.mubot, '__stack', {
        get: function() {
          var orig = Error.prepareStackTrace;
          Error.prepareStackTrace = function(_, stack) {
            return stack;
          };
          var err = new Error;
          Error.captureStackTrace(err, arguments.callee);
          var stack = err.stack;
          Error.prepareStackTrace = orig;
          return stack;
        }
      })
      ;
      Object.defineProperty(bot.mubot, '__line', {
        get: function() {
          return bot.mubot.__stack[1].getLineNumber();
        }
      })
      ;
      Object.defineProperty(bot.mubot, '__function', {
        get: function() {
          return bot.mubot.__stack[1].getFunctionName();
        }
      })
      ;
    } catch(e){}
  }
}).call(this);
