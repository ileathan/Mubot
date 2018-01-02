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
;(function(){
// Default config
let maxArrayLength = 1,
    maxMessageLength = 1917,
    depth = 0;
;
module.exports = bot => {
// Configure inspector.
 bot.respond(/(?:set )?(?:nest level|level|nest|depth)(?: me)?(?: (.+))?/i, res => {
    l.depth = res.match[1]|0;
    res.send("Inspects nesting level set to " + depth + ".");
  });
  bot.respond(/(?:set )?(?:arr(?:ay)?)(?: length)?(?: (.+))?/i, res => {
    l.maxArrayLength = res.match[1]|0;
    res.send("Inspects array maxArrayLength set to " + maxArrayLength + ".")
  });
  bot.respond(/(?:set )?(?:message length|message|max)(?: (.+))?/i, res => {
    l.maxMessageLength = res.match[1]|0;
    res.send("Inspects max length set to " + maxArrayLength + ".");
  });
  // Export
  Object.assign(bot.mubot, {inspect: l});
}
;
const {inspect} = require('util')
;
const l = {}
;
l.run = (o = null, opts) => {
  // Reuse opts variable for the formating options.
  opts || (opts = {
    depth, maxArrayLength
  });
  // Allow 83 chars for res/oLen display.
  let oLen = 0;
  try {
    if(inspect(o) === '[Function]') {
      oLen = (o + "").length;
      if(o > maxMessageLength) {
        oLen = 'Msg trimmed > 2000 ' + oLen + ''
      }
    } else {
      o || (o = 'void 0');
      o = inspect(o, opts);
    }
  } catch(e) {
    o = inspect(e);
  }
  o = o.slice(0, maxMessageLength);
  return o ? '# Output [' + (oLen || o.length) + '] ```' + o + '```' : null;
}
;

Object.defineProperty(l, 'maxMessageLength', {set(n){maxMessageLength = n}, enumerable: true})
;
Object.defineProperty(l, 'maxArrayLength', {set(n){maxArrayLength = n}, enumerable: true})
;
Object.defineProperty(l, 'depth', {set(n){depth = n}, enumerable: true})
;


}).call(this);