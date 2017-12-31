// Description:
//  evaluate commands against live code. (No need to hotreload)
//
// Commands:
//  !always [on/off] - Allows execution of code placed anywhere in text like `bot.name`
//  \`\`\`'Hello, World!'\`\`\` - Executes the command against the bots live code.
//
//
const l = {};
const _eval = require('eval');
const {inspect} = require('util');
//const inspect = require('object-inspect');

module.exports = bot => {
  // Load commands from brain.
  bot.brain.on('loaded', () => {
    l.evals = bot.brain.data.evals || (bot.brain.data.evals = {})
    l.saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {})
    l.always = bot.brain.data.alwaysEval || (bot.brain.data.alwaysEval = {})
  });
  // Capture all commands.
  bot.hear(RegExp('^(?:[!]|(?:[@]?' + (bot.name || bot.alias) + '\s*[:,]?\s*[!]))(.+)', 'i'), l.processMessage)
  // Configure inspector.
  bot.respond(/(?:set )?(?:nest level|level|nest)(?: me)?(?: (.+))?/i, msg => {
    l.setDepth(msg.match[1] || 0)
    msg.send("Inspects nesting level set to " + depth + ".")
  })
  bot.respond(/(?:set )?(?:arr(?:ay)?)?(?: length)?(?: (.+))?/i, msg => {
    l.maxArrayLength(msg.match[1] || 1)
    msg.send("Inspects array maxArrayLength set to " + maxArrayLength + ".")
  })
  bot.respond(/(?:set )?(?:message length|message|max)(?: (.+))?/i, msg => {
    l.setMaxMessageLength(msg.match[1] || 1917)
    msg.send("Inspects max length to " + maxArrayLength + ".")
  })
  // Capture all markdown code.
  bot.respond(/```[a-z]*\n?((?:.|\n)+)\n?```/i, msg => {
    l.always[l.msgToUserId(msg)] ||
      l.realEval(msg)
    ;
  });
  bot.hear(/(?:[^!]|)(?:`((?:\\.|[^`])+)`|```[a-z]*\n?((?:.|\n)+)\n?```)/i, msg => {
    msg.match[1] = msg.match[1] || msg.match[2];
    l.always[l.msgToUserId(msg)] &&
      l.realEval(msg)
    ;
  });
}

// Persistant
l.allowed = ['183771581829480448', 'U02JGQLSQ']; // CHANGE THESE TO YOUR ID'S!!
l.evals = {};
l.saved = {};
// Not persistent
l.always = {};
l.last_mode = null;

let maxArrayLength = 1;
let depth = 0;
let maxMessageLength = 1917; 

l.setMaxMessageLength = _ => maxMessageLength = _ | 0;
l.setMaxArrayLength = _ => maxArrayLength = _ | 0;
l.setDepth = _ => depth = _ | 0;

l.preventHacks = msg => {
  safeBot = {};
  Object.assign(safeBot, msg.bot);
  delete safeBot.leat.secure;
  delete safeBot.cookieToUsername;
  return safeBot;
}
;
l.realEval = msg => {
  let cmd = evalCmd = msg.match[1];
  let id = l.msgToUserId(msg);
  let afterCmd = msg.match.input.split('`').pop() || "";

  let args = [];
  if(l.allowed.includes(id)) {
     args = [{bot, msg}, true]
  } else {
     let http = require('request');
     args = [{http, request: http, req: http}, false]
  }


  let opts = { depth, maxArrayLength };
  if(afterCmd[0] === '{') {
    try {
      Object.assign(opts, JSON.parse(afterCmd));
    } catch(e) {
      return msg.send("Error parsing JSON.");
    }
  } else {
    [opts.depth = 0, opts.maxArrayLength = 1] = afterCmd.split(/\s*[\D]\s*/);
  }

  if(!/module[.]exports\s*=/.test(cmd)) {
    !/return .+/.test(cmd) && (evalCmd = 'return ' + evalCmd);
    evalCmd = 'module.exports=(()=>{' + evalCmd + '})()';
  }
   // Remove sensitive data from bot.
  let bot = l.preventHacks(msg);
  // filename is the second param.
  let o = _eval(evalCmd, msg.bot.name + "_" + msg.message.user.name, ...args);

  // Allow 83 chars for res/oLen display.
  let oLen = 0, res = "";
  try {
    if(inspect(o) === '[Function]') {
      oLen = (o + "").length;
      if(o > maxMessageLength) {
        res = '(Msg len > 2000 [' + oLen + '])'
        o = o.slice(0, maxMessageLength);
      }
    } else {
      o = inspect(o, opts)
    }
  } catch(e) {
    o = inspect(e);
  }
  res || (res = oLen);
  msg.send('# Output [' + res + ']```' + (o + "").slice(0, maxMessageLength) + '```');

  l.addToLog(cmd, o, id)
  msg.bot.brain.save();
}
;


l.processMessage = (msg, dontRun) => {
  let cmd = msg.match ? msg.match[1] : msg;
  let match = void 0, res = "";
  if(match = cmd.match(/```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
    if(l.always[msg.message.user.id]) {
      return;
    }
    res = 'realEval';
  }
  else if(match = cmd.match(/^`((?:\\.|[^`])+)`/i)) {
    if(l.always[msg.message.user.id]) {
      return;
    }
    res = 'realEval';
  }
  else if(match = cmd.match(/^coins/i)) {
    res = '';
  }
  else if(match = cmd.match(/^(?:[!]|last) ?(.*)?/i)) {
    res = 'runLastCmd';
  }
  else if(match = cmd.match(/^(?:length|amount|amnt) ?(.*)?/i)) {
    res = 'getLengths';
  }
  else if(match = cmd.match(/^(?:list|view|l|saved|evals?)(?: logs?)?(?: ([\S]*))?(?: ([\S]*))?(?: ([\S]*))?([^-]+ [^-]+)?/)) {
    res = 'viewCmds';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?) all ?(.*)?/i)) {
    res = 'deleteAllCmds';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?)(?: ([\S]+))?(?: -?(i(?:gnore)?))?(.+)?$/i)) {
    res = 'deleteCmds';
  }
  else if(match = cmd.match(/^fake ```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
    res = 'fakeEval';
  }
  else if(match = cmd.match(/^fake `(\\.|[^`])+`/i)) {
    res = 'fakeEval';
  }
  else if(match = cmd.match(/^(?:save|rec?(:ord)?|preserve|tag) (.+)(?: (.+))?/i)) {
    res = 'saveCmd';
  }
  else if(match = cmd.match(/^(?:set )?always(?: (.*))?/i)) {
    res = 'setAlways';
  }
  if(!res) return;
  if(!dontRun) {
    msg.match = match;
    l[res](msg);
  }
  return !!match;
}



l.addToLog = function(cmd, res, id) {
 evals[id] || (evals[id] = (evals[id] = {}));
 evals[id][cmd] ? delete evals[id][cmd] && (evals[id][cmd] = res) : evals[id][cmd] = res;
}

l.msgToUserId = function(msg) {
  return msg.message.user.id;
}

l.getLengths = function(msg) {
  const mode = l.isModeSave(msg.match[1]);
  const id = l.msgToUserId(msg);
  const formatLengthReply = mode => {
    const obj = mode ? saved[id] || {} : evals[id] || {};
    const cmds = mode ? Object.values(obj) : Object.keys(obj);
    const amnt = cmds.length;
    const last = cmds.pop();
    return amnt + " " + (mode?'saved':'logged') + " eval(s)." + (amnt ? " Last: " + l.formatCmd(last) : "");
  }
  let res = "";
  mode ?
    res += formatLengthReply(mode)
  :
    res += formatLengthReply(1) + ' ' + formatLengthReply(0)
  ;
  msg.send(res);
}
;
l.deleteAllCmds = function(msg) {
  const id = l.msgToUserId(msg);
  const mode = msg.match[1];
  if(mode === 'all') {
    const amntDelSaved = Object.keys(saved[id] || {}).length;
    const amntDelLog = Object.keys(evals[id] || {}).length;
    for(let key in evals[id] || {}) delete evals[id][key];
    for(let key in saved[id] || {}) delete saved[id][key];
    return msg.send("Deleted " + amntDelLog + " log evals and " + amntDelSaved + " saved evals.");
  }
  const obj = l.isModeSave(mode) ? saved[id] || {} : evals[id] || {};
  const amntDel = Object.keys(obj).length;
  for(let key in obj) delete obj[key];
  msg.send("Deleted " + amntDel + " " + (mode ? "saved" : "log") + " evals.");
}
;

l.deleteCmds = function(msg) {
  const id = l.msgToUserId(msg);
  if(!saved[id] || !evals[id]) {
    return msg.send("No log found")
  }
  var [, mode, ignore, delCmd ] = msg.match;
  var startAt, endAt, res;
  if(saved[id][delCmd]) {
    res = "Deleted " + l.formatCmd(saved[id][delCmd]) + ".";
    delete saved[id][delCmd];
  }
  else if(Object.keys(evals[id])[delCmd]) {
    res = "Deleted " + l.formatCmd(evals[id][delCmd]) + ".";
    delete evals[id][delCmd];
  }
  else if(/[!]|last/i.test(delCmd)) {
    let obj = l.isModeSave(mode) ? saved[id] : evals[id];
    last_mode === 'saved' ?
      delCmd = Object.values(saved[id]).pop()
    :
      delCmd = Object.keys(evals[id]).pop()
    ;
    res = "Deleted " + l.formatCmd(obj[delCmd]) + ".";
    delete obj[delCmd];
  } else {
    let keys = Object.keys(obj);
    delCmd = delCmd.split(/\s*-\s*/);

    if(delCmd.length === 1) {
      let i = +delCmd[0];
      i > 0 ? keys = keys.slice(i) : keys.splice(i);
      for(let key in keys) delete obj[key];
      res = "Deleted " + keys.length + " evals."
    }
    else if(delCmd.length === 2) {
      let [startAt, endAt] = delCmd;

      startAt > 0 && --startAt
      startAt > -1 ?
        endAt || (endAt = keys.length)
      :
        endAt = void 0
      ;
      ignore ? keys.splice(startAt, endAt) : keys = keys.slice(startAt, endAt);
      for(let key in keys) delete obj[key];
      res = "Deleted " + keys.length + " evals."
    }
    else res = "Could not parse request."
  }
  msg.bot.brain.save();

  return msg.send(res || "No Command(s) found.")
}
;

l.runLastCmd = function(msg) {
  const id = l.msgToUserId(msg);
  var mode = msg.match[1];
  mode === void 0 && (mode = last_mode || 'evals');
  mode = l.isModeSave(mode)
  var obj = mode ? saved[id] || {} : evals[id] || {};
  var last = mode ? Object.values(obj).pop() : Object.keys(obj).pop();

  if(!last)
    return msg.send("There is no last " + mode + " command.")
  ;
  msg.match = [, last];
  l.realEval(msg);
}
;
l.runCmd = function(msg) {
  const id = l.msgToUserId(msg);
  const tag = msg.match[1];
  var cmd = "";
  if(commands.includes(tag.toLowerCase()))
    return
  ;
  if(!saved[id] || !evals[id]) {
    return msg.send("No log found")
  }
  cmd = saved[id][tag] ?
    (last_mode = 'saved') && saved[id][tag]
  :
    (last_mode = 'evals') && Object.keys(evals[id])[tag]
  ;
  if(!cmd)
    return msg.send("Command not found.")
  ;
  msg.match[1] = cmd;
  l.realEval(msg);
}
;
l.saveCmd = function(msg) {
  const id = l.msgToUserId(msg);
  if(!evals[id]) {
    return msg.send("No log found")
  }
  var [, cmdIndx, tag ] = msg.match;
  if(!tag) {
    tag = cmdIndx;
    cmdIndx = Object.keys(evals[id]).length - 1;
  }
  if(l.isReserved(tag))
    return msg.send("Cannot save, your name is a reserved command.")
  ;
  const cmd = Object.keys(evals[id])[cmdIndex];
  ;
  if(!cmd)
    return msg.send("No command found.")
  ;
  saved[id][tag] = cmd;
  msg.bot.brain.save();
  msg.send("Saved " + l.formatCmd(cmd) + ' as ' + tag + '.');
}
;
l.formatCmd = function(cmd) {
  if(!cmd) return null;
  //cmd = cmd.slice(29, -32).replace(/^return\s*/, '');
  return '`' + cmd + (cmd.length > 20 ? '..' : '') + '`';
}
;
l.isModeSave = function(modeStr) {
  return /\s*-?(s(aved?)|tag(ged|s)?|recorded)\s*/.test(modeStr);
}

l.viewCmds = function(msg) {
  const id = l.msgToUserId(msg);
  let [, mode, res, ignore, indexes ] = msg.match
  ;
  let [startAt, endAt] = (indexes || "").split(/\s*[-]\s*/);
  mode = l.isModeSave(mode);
  let commands = res ? Object.values(mode ? saved[id] : evals[id]) : Object.keys(mode ? saved[id] : evals[id])
  ;
  if(startAt === '!') {
    let remove = startAt.slice(1);
    !mode && (remove = parseInt(remove));
    let cmd = commands[remove]
    let i = mode ? commands.indexOf(remove) : remove;
    return  msg.send("(1) " + i + ': ' + l.formatCmd(cmd));
  }
  global.m = msg.match;
  commands || (commands = []);
  startAt = startAt > 0 ? --startAt : startAt || 0;
  startAt > -1 ?
    endAt = endAt || commands.length
  :
    endAt = void 0
  ;
  if(startAt > commands.length || endAt > commands.length || startAt > endAt)
     return msg.send("Your startAt and endAt parameters are invalid.")
  ;
  let oldlength = commands.length;

  ignore ? commands.splice(startAt, endAt) : commands = commands.slice(startAt, endAt);

  let length = commands.length;

  var i = startAt > -1 ?
    length > 17 ? length - 17 + startAt : startAt
  :
    oldlength + +startAt - 1
  ;
  length > 17 && (commands = commands.slice(-17));
  msg.send("("+length+") " + commands.map(_=>
    i++ + ': ' + l.formatCmd(_)
  ).join(', '))
}
;

l.setAlways = function(msg) {
  let isAlways = !(msg.match[1] || "").match(/off|false|0|no|x/i);
  let id = l.msgToUserId(msg);
  isAlways ?
    l.always[id] ?
      msg.send("Eval mode already set to always.")
    :
      (()=>{
        l.always[id] = 1;
        msg.bot.brain.save();
        msg.send("Eval mode set to always.");
      })()
    //
  :
    l.always[id] ?
      (()=>{
        delete l.always[id];
        msg.send("Eval mode set to trigger only.");
        msg.bot.brain.save();
      })()
    :
      msg.send("Eval mode already set to trigger only.")
    //
  ;
}
;
