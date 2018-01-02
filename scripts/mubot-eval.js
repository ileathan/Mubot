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
const http = require('request');
//const inspect = require('object-inspect');

module.exports = bot => {
  // Load commands from brain.
  bot.brain.on('loaded', () => {
    l.evals = bot.brain.data.evals || (bot.brain.data.evals = {})
    l.saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {})
    l.config.alwaysEvals = bot.brain.data.alwaysEval || (bot.brain.data.alwaysEval = {})

    // Export
    Object.assign(bot.mubot, {eval: l});
  });
  // Capture all commands.
  bot.hear(RegExp('^(?:[!]|(?:[@]?' + (bot.name || bot.alias) + '\s*[:,]?\s*[!]))(.+)', 'i'), l.utils.processMessage)
  bot.respond(/```[a-z]*\n?((?:.|\n)+)\n?```/i, res => {
    l.config.alwaysEvals[res.message.user.id] ||
      l.realEval(res)
    ;
  });
  bot.hear(/(?:[^!]|)(?:`((?:\\.|[^`])+)`|```[a-z]*\n?((?:.|\n)+)\n?```)/i, res => {
    res.match[1] = res.match[1] || res.match[2];
    l.config.alwaysEvals[res.message.user.id] &&
      l.realEval(res)
    ;
  });
}
;
// Persistant
l.allowedUsers = ['183771581829480448', 'U02JGQLSQ']; // CHANGE THESE TO YOUR ID'S!!
l.evals = {};
l.saved = {};
l.config = {};
l.config.alwaysEvals = {};
l.config.maxCmdLen = 17;
l.config.maxMsgLen = 1917;
// Utils
l.utils = {};

l.utils.preventHacks = res => {
  let safeBot = {};
  Object.assign(safeBot, res.bot);
  delete safeBot.leat.secure;
  delete safeBot.cookieToUsername;
  return safeBot;
}
;
l.realEval = res => {
  let cmd = res.match[1], evalCmd = cmd,
      id = res.message.user.id,
      afterCmd = res.match.input.split('`').pop() || "",
      // Remove sensitive data from bot.
      bot = l.utils.preventHacks(res),
      opts = [], o = ""
  ;

  // Set command options.
  if(l.allowedUsers.includes(id)) {
     opts = [{bot, res, http}, true]
  } else {
     opts = [{http, request: http, req: http}, false]
  }
  // Sanitize the command. 
  if(!/module[.]exports\s*=/.test(cmd)) {
    !/return .+/.test(cmd) && (evalCmd = 'return ' + evalCmd);
    evalCmd = 'module.exports=(()=>{' + evalCmd + '})()';
  }
  // filename is the second param.
  o = _eval(evalCmd, res.bot.name + "_" + res.message.user.name, ...opts);
  // Reuse opts variable for the formating options.
  opts = {};
  if(afterCmd[0] === '{') {
    try {
      Object.assign(opts, JSON.parse(afterCmd));
    } catch(e) {
      return res.send("Error parsing JSON.");
    }
  } else {
    [opts.depth, opts.maxArrayLength = 1] = afterCmd.split(/\s*[\D]\s*/).map(Number);
  }
  //if(o !== void 0) {
  //  o.slice && o.slice(0, l.config.maxMsgLen);
  //}
  o = res.bot.mubot.inspect.run(o, opts);
  o && res.send(o);
  l.utils.addToLog(cmd, o || "void 0", id)
  res.bot.brain.save();
}
;


l.utils.processMessage = (res, dontRun) => {
  let cmd = res.match ? res.match[1] : res;
  let match = void 0, fn = "";
  if(match = cmd.match(/```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
    if(l.config.alwaysEvals[res.message.user.id]) {
      return;
    }
    fn = 'realEval';
  }
  else if(match = cmd.match(/^`((?:\\.|[^`])+)`/i)) {
    if(l.config.alwaysEvals[res.message.user.id]) {
      return;
    }
    fn = 'realEval';
  }
  else if(match = cmd.match(/^coins/i)) {
    fn = '';
  }
  else if(match = cmd.match(/^(?:[!]|last) ?(.*)?/i)) {
    fn = 'runLastCmd';
  }
  else if(match = cmd.match(/^(?:length|amount|amnt) ?(.*)?/i)) {
    fn = 'getLengths';
  }
  else if(match = cmd.match(/^(?:list|view|l|saved|evals?)(?: logs?)?(?: ([\S]*))?(?: ([\S]*))?(?: ([\S]*))?([^-]+ [^-]+)?/)) {
    fn = 'viewCmds';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?) all ?(.*)?/i)) {
    fn = 'deleteAllCmds';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?)(?: ([\S]+))?(?: -?(i(?:gnore)?))?(.+)?$/i)) {
    fn = 'deleteCmds';
  }
  else if(match = cmd.match(/^fake ```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
    fn = 'fakeEval';
  }
  else if(match = cmd.match(/^fake `(\\.|[^`])+`/i)) {
    fn = 'fakeEval';
  }
  else if(match = cmd.match(/^(?:save|rec?(:ord)?|preserve|tag) (.+)(?: (.+))?/i)) {
    fn = 'saveCmd';
  }
  else if(match = cmd.match(/^(?:set )?always(?: (.*))?/i)) {
    fn = 'setAlways';
  }
  if(!dontRun && fn) {
    res.match = match;
    l[fn](res);
  }
  return fn;
}
;
l.utils.addToLog = (cmd, res, id) => {
 l.evals[id] || (l.evals[id] = (l.evals[id] = {}));
 l.evals[id][cmd] ? delete l.evals[id][cmd] && (l.evals[id][cmd] = res) : l.evals[id][cmd] = res;
}

l.getLengths = res => {
  let mode = res.match[1];
      id = res.message.user.id, r = ""
  ;
  mode ?
    r += formatLengthReply(l.utils.isModeSave(mode))
  :
    r += formatLengthReply(1) + ' ' + formatLengthReply(0)
   ;
  res.send(r);
}
;
l.getLengths.format = mode => {
  let obj = mode ? l.saved[id] || {} : l.evals[id] || {},
      cmds = mode ? Object.values(obj) : Object.keys(obj),
      amnt = cmds.length, last = cmds.pop()
  ;
  return amnt + " " + (mode ? 'saved' : 'logged') + " eval(s)." + (amnt ? " Last: " + l.utils.formatCmd(last) : "");
}
;
l.deleteAllCmds = res => {
  let id = res.message.user.id,
      mode = res.match[1]
  ;
  if(mode === 'all') {
    let delS = Object.keys(l.saved[id] || {}).length;
    let delL = Object.keys(l.evals[id] || {}).length;
    for(let key in l.evals[id] || {})
       delete l.evals[id][key]
    ;
    for(let key in l.saved[id] || {})
       delete l.saved[id][key]
    ;
    return res.send("Deleted " + delL + " log evals and " + delS + " saved evals.");
  }
  const obj = l.utils.isModeSave(mode) ? l.saved[id] || {} : l.evals[id] || {};
  const delAmnt = Object.keys(obj).length;
  for(let key in obj) delete obj[key];
  res.send("Deleted " + delAmnt + " " + (mode ? "saved" : "log") + " evals.");
}
;
l.deleteCmds = res => {
  let id = res.message.user.id;
  if(!l.saved[id] || !l.evals[id]) {
    return res.send("No log found");
  }
  let [, mode, ignore, cmd ] = res.match;
  let startAt, endAt, r;
  if(l.saved[id][cmd]) {
    r = "Deleted " + l.utils.formatCmd(l.saved[id][cmd]) + ".";
    delete l.saved[id][cmd];
  }
  else if(Object.keys(l.evals[id])[cmd]) {
    r = "Deleted " + l.utils.formatCmd(l.evals[id][cmd]) + ".";
    delete l.evals[id][cmd];
  }
  else if(/[!]|last/i.test(cmd)) {
    let obj = l.utils.isModeSave(mode) ? l.saved[id] : l.evals[id];
    last_mode === 'saved' ?
      cmd = Object.values(l.saved[id]).pop()
    :
      cmd = Object.keys(l.evals[id]).pop()
    ;
    r = "Deleted " + l.utils.formatCmd(obj[cmd]) + ".";
    delete obj[cmd];
  } else {
    let keys = Object.keys(obj);
    cmd = cmd.split(/\s*-\s*/);

    if(cmd.length === 1) {
      let i = +cmd[0];
      keys = i > 0 ? keys.slice(-i) : keys.slice(0, i);
      for(let key in keys) delete obj[key];
      r = "Deleted " + keys.length + " evals.";
    }
    else if(cmd.length === 2) {
      let [startAt, endAt] = cmd;

      startAt > 0 && --startAt;
      startAt > -1 ?
        endAt || (endAt = keys.length)
      :
        endAt = void 0
      ;
      ignore ? keys.splice(startAt, endAt) : keys = keys.slice(startAt, endAt);
      for(let key in keys) delete obj[key];
      r = "Deleted " + keys.length + " evals.";
     }
    else r = "Could not parse request.";
   }
  res.bot.brain.save();

  return res.send(r || "No Command(s) found.");
}
;
l.runLastCmd = res => {
  let id = res.message.user.id,
      mode = res.match[1]
  ;
  mode = l.utils.isModeSave(mode)
  let obj = mode ? l.saved[id] || {} : l.evals[id] || {},
      last = mode ? Object.values(obj).pop() : Object.keys(obj).pop()
  ;
  if(!last)
    return res.send("There is no last " + mode + " command.")
  ;
  res.match = [, last];
  l.realEval(res);
}
;
l.runCmd = res => {
  let id = res.message.user.id,
      tag = res.match[1],
      cmd = ""
  ;
  if(commands.includes(tag.toLowerCase()))
    return
   ;
  if(!l.saved[id] || !l.evals[id]) {
    return res.send("No log found")
  }
  cmd = l.saved[id][tag] ?
    l.saved[id][tag]
  :
    Object.keys(l.evals[id])[tag]
  ;
  if(!cmd)
    return res.send("Command not found.")
  ;
  res.match[1] = cmd;
  l.realEval(res);
}
;
l.saveCmd = res => {
  const id = res.message.user.id;
  if(!l.evals[id]) {
    return res.send("No log found")
  }
  var [, cmdIndx, tag ] = res.match;
  if(!tag) {
    tag = cmdIndx;
    cmdIndx = Object.keys(l.evals[id]).length - 1;
  }
  if(l.isReserved(tag))
    return res.send("Cannot save, your name is a reserved command.")
  ;
  const cmd = Object.keys(l.evals[id])[cmdIndex];
   ;
  if(!cmd)
    return res.send("No command found.")
  ;
  l.saved[id][tag] = cmd;
  res.bot.brain.save();
  res.send("Saved " + l.utils.formatCmd(cmd) + ' as ' + tag + '.');
}
;
l.utils.formatCmd = cmd => {
  return cmd ? '`' + cmd + (cmd.length > l.config.maxCmdLen ? '..' : '') + '`' : null;
}
;
l.utils.isModeSave = str => {
  /\s*-?(s(aved?)|tag(ged|s)?|recorded)\s*/.test(str);
}
;
l.viewCmds = res => {
  const id = res.message.user.id;
  let [, mode, values, ignore, indexes = ""] = res.match
  ;
  let [startAt, endAt] = indexes.split(/\s*[-]\s*/);
  mode = l.utils.isModeSave(mode);
  let cmds = values ?
    Object.values(mode ? l.saved[id] : l.evals[id])
  :
    Object.keys(mode ? l.saved[id] : l.evals[id])
  ;
  if(startAt === '!') {
    let remove = startAt.slice(1),
        removeIndx = mode ? cmds.indexOf(remove) : remove,
        cmd = cmds[removeIndx]
    ;
    return  res.send("(1) " + i + ': ' + l.utils.formatCmd(cmd));
  }
  startAt > 0 ? --startAt : endAt = null;

  if(startAt > cmds.length || endAt > cmds.length || startAt > endAt)
     return res.send("Your startAt and endAt parameters are invalid.")
  ;

  let allLen = cmds.length;
  let oldCmds = Object.assign([], cmds)

  ignore ? cmds.splice(startAt, endAt) : cmds = cmds.slice(startAt, endAt);

  let viewLen = cmds.length;

  cmds = cmds.slice(-l.utils.maxCmdLen);
  res.send("("+allLen+'/'+viewLen+") " + cmds.map(_=>
    oldCmds.indexOf(_) + ': ' + l.utils.formatCmd(_)
  ).join(', '))
}
;
l.setAlways = res => {
  let isAlways = !/off|false|0|no|x/i.test(res.match[1]),
      id = res.message.user.id
  ;
  isAlways ?
    l.config.alwaysEvals[id] ?
      res.send("Eval mode already set to always.")
    :
      (()=>{
        l.config.alwaysEvals[id] = 1;
        res.bot.brain.save();
        res.send("Eval mode set to always.");
      })()
    //
  :
    l.config.alwaysEvals[id] ?
      (()=>{
        delete l.config.alwaysEvals[id];
        res.send("Eval mode set to trigger only.");
        res.bot.brain.save();
      })()
    :
      res.send("Eval mode already set to trigger only.")
    //
   ;
  //
}
;