// Description:
//   Sets a break point in the code allowing  live inspections and manipulations.
//
// Commands:
//   imubot break|halt|freeze - halts the bot code.
//

module.exports = function(bot) {
  bot.respond(/(freeze|halt|break)/i, {id: 'create.break'}, function(r) {
    r.send("Completely halting for live callstack and direct code manipulation")
    setTimeout(function(){
      debugger;
      r.send("Resuming normal functions.");
    },1000)
  })
}

