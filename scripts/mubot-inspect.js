// Description:
//   Inspects objects
//
// Commands:
//
//   Mubot nest level 2 - Sets the inspecting depth to 2
//   Mubot array length 7 - Sets the array length to be shown.
//   Mubot message 30 - Sets the max characters to be shown for each command.
//
// Author:
//   leathan
//
module.exports = bot =>
// Configure inspector.
  bot.respond(/(?:set )?(?:nest level|level|nest|depth)(?: me)?(?: (.+))?/i, res => {
    l.setDepth(res.match[1] || 0);
    res.send("Inspects nesting level set to " + l.depth + ".");
  });
  bot.respond(/(?:set )?(?:arr(?:ay)?)?(?: length)?(?: (.+))?/i, res => {
    l.maxArrayLength(res.match[1] || 1);
    res.send("Inspects array maxArrayLength set to " + l.maxArrayLength + ".")
  });
  bot.respond(/(?:set )?(?:message length|message|max)(?: (.+))?/i, res => {
    l.setMaxMessageLength(res.match[1] || 1917);
    res.send("Inspects max length set to " + l.maxArrayLength + ".");
  });
  // Export
  Object.assign(bot.mubot, {inspect: l});
}
;
const {inspect} = require('util')
;
const l = o => {
  // Reuse opts variable for the formating options.
  let opts = {
    depth: l.depth || 0,
    maxArrayLength: l.maxArrayLength || 1
  };
  // Allow 83 chars for res/oLen display.
  let oLen = 0;
  try {
    if(inspect(o) === '[Function]') {
      oLen = (o + "").length;
      if(o > l.maxMessageLength) {
        oLen = 'Msg trimmed > 2000 ' + oLen + ''
      }
    } else {
      o || (o = 'void 0');
      o = inspect(o, opts);
    }
  } catch(e) {
    o = inspect(e);
  }
  o = o.slice(0, l.maxMessageLength || 1917);
  return o ? '# Output [' + oLen + '] ```' + o + '```' : null;

}
l.setMaxMessageLength = _ => l.maxMessageLength = _ | 0;
l.setMaxArrayLength = _ => l.maxArrayLength = _ | 0;
l.setDepth = _ => l.depth = _ | 0;
