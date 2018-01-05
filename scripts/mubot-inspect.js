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
// Imports
const {inspect} = require('util')
;
const rjson = require('relaxed-json')
;
const flatten = require('mubot-flatten')
;
const l = {}
;
Object.defineProperty(l, 'imports', {
  enumerable: false,
  value: {inspect, flatten, rjson}
})
;
Object.defineProperty(l, 'exports', {
  enumerable: false,
  value: bot => {
    bot.respond(/(?:set )?inspect(?: ([^{]+))?(?: (.+))?/i, res => {
      let [, key, prop] = msg.match;
      l.config[key] ?
        prop ?
          (l.config[key] = prop) && res.send(`Set ${key} to ${prop}.`)
        :
          res.send(`${key} is ${l.config[key]}.`)
        //
      :
        prop ?
          (res.o = rjson.parse(prop)) && l.run(res)
        :
          res.send("No value specified.")
        //
      ;
    });
    // Export
    Object.assign(bot.mubot, {inspect: l});
  }
})
;
// Main
l.run = (res = {send: _=>_, o: res}) => {
  let maxLen = l.config.maxMessageLength,
      opts = Object.assign({}, l.config, res.opts),
      o = res.o, oLen = 0
  ;
  if(opts.save) {
    Object.assign(l.config, res.opts);
  }
  try {
    inspect(o) === '[Function]' ?
      (oLen = (o = o + "").length) &&
      oLen > maxLen && (
        oLen = 'Msg (' + oLen + ') trimmed to ' + maxLen
      )
    :
      !Array.isArray(o) ? 
        o = opts.flatten ? 
          inspect(flatten(o, opts), opts)
        :
          typeof o === "string" ? o : inspect(o, opts)
        //
      :
        opts.excludes ? (()=>{
          if(typeof o === "object") {
            let excludes = rjson.parse(opts.excludes);
            excludeArr = Array.isArray(excludes) ? excludes : Object.keys(excludes);
            for(let key of excludeArr) {
              delete o[key];
            }
            return o
          }
        })() : o = inspect(o, opts)
      //
    ;
  } catch(e) {
    o = inspect(e);
  }
  o !== "null" && res.send(
    '# Output ['+(oLen||o.length)+'] ```'+o.slice(0, maxLen)+'```'
  );
}
;
// Default config
l.config = {};
l.config.maxArrayLength = 3,
// Assuming the "default spam logic" truncate to <2k chars (83 char padding for info/markdown).
l.config.maxMessageLength = 1917,
l.config.depth = 0,
l.config.showHidden = false,
l.config.customInspect = false,
l.config.showProxy = true
l.config.flatten = false;
l.config.maxCount = 17;
l.config.maxDepth = 9;
l.config.excludes = null; // Array of keys to exclude.
;
module.exports = l.exports
;

// End file.
}).call(this);