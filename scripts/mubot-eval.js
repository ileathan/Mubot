// Description:
//  evaluate commands against live code. (No need to hotreload)
//
// Commands:
//  !always [on/off] - Allows execution of code placed anywhere in text like `bot.name`
//  \`\`\`'Hello, World!'\`\`\` - Executes the command against the bots live code.
//
(function(){
// Delarations
let bot = null;
const l = {};
// Imports.
const _eval = require('eval');
const {inspect} = require('util');
// Show our imports.
Object.defineProperty(l, 'imports', {
  enumerable: false,
  value: { _eval, inspect }
})
;
// Exports.
Object.defineProperty(l, 'exports', {
  enumerable: false,
  value: _bot => {
    bot = _bot;
    l.utils.preventHacks();
    // Load evals and config from brain.
    bot.brain.on('loaded', () => {
      l.config.save();
      // Export to mubot.
      Object.assign(bot.mubot, {eval: l});
    });
    // Capture all markdown formatted code.
    bot.hear(
      RegExp('^(?:[!]|(?:[@]?'+(bot.name||bot.alias)+'\s*[:,]?\s*[!]))(.+)', 'i'),
      l.utils.processMessage
    );
    bot.respond(/```((?:.|\n)+)\n?```/i, res => {
      l.config.alwaysEval[res.message.user.id] ||
        l.create(res)
      ;
    });
    bot.hear(/^[^!].*?(?:`((?:\\.|[^`])+)`|```((?:.|\n)+)\n?```)/i, res => {
      res.match[1] = res.match[1] || res.match[2];
      l.config.alwaysEval[res.message.user.id] &&
        l.create(res)
      ;
    });
  }
})
;
// Default config.
l.log = {};
l.saved = {};
l.config = {};
l.config.sudoers = ['183771581829480448', 'U02JGQLSQ']; // CHANGE THESE TO YOUR ID'S!!
l.config.alwaysEval = {};
l.config.maxCmdLen = 17;
l.config.maxMsgLen = 1917;
l.config.save = (res = {send: _=>_}) => {
  l.log = bot.brain.data.log || (bot.brain.data.log = {});
  l.saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {});
  l.config.alwaysEval = bot.brain.data.alwaysEval || (bot.brain.data.alwaysEval = {});
  res.send("Merged eval config to brain.");
}
;
// API
l.create = (res = {send: _=>_}) => {
  let cmd = res.match[1], evalCmd = cmd,
      id = res.message.user.id,
      userOpts = res.match.input.split('`').pop() || "",
      // Remove sensitive data from bot.
      opts = [], o = ""
  ;
  // Set command options.
  if(l.config.sudoers.includes(id)) {
     opts = [{bot, res, http: bot.http, mubot: bot.mubot, leat: bot.leat, bitmark: bot.bitmark}, true]
  } else {
     opts = [{http: bot.http}, false]
  }
  // Sanitize the command. 
  if(!/module[.]exports\s*=/.test(cmd)) {
    !/return .+/.test(cmd) && (
      evalCmd = evalCmd.replace(/(?:\n(.+)|(.+))$/, 'return $2$1')
    );
    evalCmd = 'module.exports=(()=>{' + evalCmd + '})()';
  }
  // filename is the second param.
  try {
    o = _eval(evalCmd, res.bot.name + "_" + res.message.user.name, ...opts);
  } catch(e) {
    e.stack = e.stack.split('\n').slice(0, 7).join('\n');
    o = e;
  }
  // Reuse opts variable for the formating options.
  if(userOpts) {
    try { userOpts = JSON.parse(userOpts) }
    catch(e) {
      let rjson = require('relaxed-json');
      try { userOpts = rjson.parse('{'+userOpts+'}') }
      catch(e) {
        try { userOptsrjson.parse(userOpts) }
        catch(e) { return res.send("Error parsing JSON.") }
      }
    }
  }
  Object.assign(res, {o, userOpts, cmd})
  res.bot.mubot.inspect.run(res);
  l.utils.addToLog(res);
}
;
l.list = (res = {send: _=>_}) => {
  let mode = res.match[1];
      id = res.message.user.id, r = ""
  ;
  mode && !/all/i.test(mode) ?
    r += format(l.utils.isModeSave(mode))
  :
    r += format(1) + ' ' + format(0)
  ;
  return res.send(r);
  //
  const format = mode => {
    let obj = mode ? l.saved[id] || {} : l.log[id] || {},
        cmds = mode ? Object.values(obj) : Object.keys(obj),
        amnt = cmds.length, last = cmds.pop()
    ;
    return (
      `${amnt} ${mode ? 'saved' : 'logged'} eval(s).${amnt ? " Last: "+l.utils.formatCmd(last) : ""}`
    );
  }
}
;
l.deleteAll = (res = {send: _=>_}) => {

  let id = res.message.user.id,
      mode = res.match[1] || "all",
      [saved = {}, log = {}] = [l.saved[id], l.log[id]]
  ;
  if(mode === 'all') {
    let amntDelS = Object.keys(saved).length,
        amntDelL = Object.keys(log).length
    ;
    for(let key in log)
       delete log[key]
    ;
    for(let key in saved)
       delete saved[key]
    ;
    return res.send(
      `Deleted ${amntDelL} logged evals and ${amntDelS} saved evals.`
    );
  }
  let evals = l.utils.isModeSave(mode) ? saved : log;
  let delAmnt = Object.keys(evals).length;
  for(let cmd in evals)
    delete evals[cmd]
  ;
  return res.send(
    `Deleted ${delAmnt} ${mode ? "saved" : "log"} evals.`
  );
}
;
l.delete = (res = {send: _=>_}) => {
  let id = res.message.user.id
      [saved, log] = [l.saved[id], l.log[id]]
  ;
  if(!saved || !log) {
    return res.send("No log found");
  }
  let [, mode, ignore, cmd ] = res.match;
  mode = l.utils.isModeSave(mode);
  let startAt, endAt, r = "Deleted ";
  if(saved[cmd]) {
    r += l.utils.formatCmd(saved[cmd]);
    delete saved[cmd];
  }
  else if(Object.keys(log)[cmd]) {
    r += l.utils.formatCmd(log[cmd]);
    delete log[cmd];
  }
  else if(/[!]|last/i.test(cmd)) {
    let obj;
    if(mode) {
      obj = saved;
      cmd = Objet.values(saved).pop();
    } else {
      obj = log;
      cmd = Object.keys(log).pop()
    }
    r += l.utils.formatCmd(obj[cmd]);
    delete obj[cmd];
  } else {
    let obj = mode ? saved : log,
        keys = Object.keys(obj)
    ;

    cmd = cmd.split(/\s*-\s*/);

    if(cmd.length === 1) {
      let i = +cmd[0];
      keys = i > 0 ? keys.slice(-i) : keys.slice(0, i);
      for(let key in keys)
        delete obj[key]
      ;
      r += keys.length + " evals";
    }
    else if(cmd.length === 2) {
      let [startAt, endAt] = cmd;

      if(startAt > 0) {
        --startAt;
        endAt || (endAt = keys.length);
      } else {
        endAt = void 0;
      }
      ignore ?
        keys.splice(startAt, endAt)
      :
        keys = keys.slice(startAt, endAt)
      ;
      for(let key in keys)
        delete obj[key]
      ;
      r += keys.length + " evals.";
     }
    else r = "Could not parse request";
   }
  bot.brain.save();

  return res.send(r + "." || "No Command(s) found.");
}
;
l.runLast = res => {
debugger;
  let id = res.message.user.id,
      [mode, userOpts = ""] = (res.match[1]||"").split(' ');
  ;
  mode = l.utils.isModeSave(mode)
  let obj = (mode ? l.saved[id] : l.log[id]) || {},
      last = mode ? Object.values(obj).pop() : Object.keys(obj).pop()
  ;
  if(!last)
    return res.send(`There is no last ${mode?"saved":"logged"} command.`)
  ;
  res.match[1] = last;
  res.match.index = "`" + userOpts;
  l.create(res);
}
;
l.run = res => {
  let id = res.message.user.id,
      tag = res.match[1],
      cmd = "",
      log = l.log[id],
      saved = l.saved[id]
  ;
  if(!saved || !log) {
    return res.send("No log found")
  }
  cmd = saved[tag] ?
    saved[tag]
  :
    Object.keys(log)[tag]
  ;
  if(!cmd)
    return res.send("Command not found.")
  ;
  res.match[1] = cmd;
  l.create(res);
}
;
l.save = (res = {send: _=>_}) => {
  const id = res.message.user.id;
  if(!log) {
    return res.send("No log found")
  }
  var [, cmdIndx, tag ] = res.match;
  if(!tag) {
    tag = cmdIndx;
    cmdIndx = Object.keys(log).length - 1;
  }
  if(l.utils.processMessage(tag))
    return res.send("Cannot save, your name is a reserved command.")
  ;
  const cmd = Object.keys(log)[cmdIndex];
   ;
  if(!cmd)
    return res.send("No command found.")
  ;
  saved[tag] = cmd;
  bot.brain.save();
  res.send("Saved " + l.utils.formatCmd(cmd) + ' as ' + tag + '.');
}
;
l.view = (res = {send: _=>_}) => {
  let id = res.message.user.id,
      [, mode, values, ignore, indexes = ""] = res.match,
      [startAt, endAt] = indexes.split(/\s*[-]\s*/).map(_=>_|0)
  ;
  mode = l.utils.isModeSave(mode);
  let cmds = values ?
    Object.values((mode ? l.saved[id] : l.log[id]) || {})
  :
    Object.keys((mode ? l.saved[id] : l.log[id]) || {})
  ;
  if(startAt === '!') {
    let remove = startAt.slice(1),
        removeIndx = mode ? cmds.indexOf(remove) : remove,
        cmd = cmds[removeIndx]
    ;
    return  res.send("(1) " + i + ': ' + l.utils.formatCmd(cmd));
  }
  startAt > 0 ? --startAt : endAt = void 0;

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
l.setAlways = (res = {send: _=>_}) => {
  let isAlways = !/off|false|0|no|x/i.test(res.match[1]),
      id = res.message.user.id,
      always = l.config.alwaysEval
  ;
  isAlways ?
    always[id] ?
      res.send("Eval mode already set to always.")
    :
      (()=>{
        always[id] = 1;
        bot.brain.save();
        res.send("Eval mode set to always.");
      })()
    //
  :
    always[id] ?
      (()=>{
        delete always[id];
        res.send("Eval mode set to trigger only.");
        bot.brain.save();
      })()
    :
      res.send("Eval mode already set to trigger only.")
    //
   ;
  //
}
;
// Utils
l.utils = {}
;
// Should never need to rely on this, but in. case of mistype.
l.utils.preventHacks = (res = {send: _=>_}) => {
  Object.defineProperties(bot.server, {
    ca: { enumerable: false },
    cert: { enumerable: false },
    key: { enumerable: false },
    _sharedCreds: { enumerable: false }
  })
  Object.defineProperties(bot.leat, {
    secure: { enumerable: false },
    cookieToUsername: { enumerable: false }
  });
  res.send("Sucess.")
}
;
l.utils.processMessage = (res = {send: _=>_}, cmd) => {
debugger;
  // ||"" throughout so we dont undefined vars for props.
  if(!cmd && !(cmd = ((res.match||"")[1])))
    return "No message to process."
  ;
  let id = res.message.user.id,
      dontRun = res.dontRun, fn = ""
  ;
  if((l.saved[id]||"")[cmd] || (l.log[id]||"")[cmd]) {
     // --cmd so that !1 runs the 0'th command.
     match = Number.isInteger(cmd) ? --cmd : cmd;
     // format it asif it had ben RegExp.exec()'d.
     match = [, match];
     fn = 'run';
  }
  else if(match = cmd.match(/```((?:.|\n)+)\n?```/i)) {
    // We capture always ussers with a different listener regexp.
    if(l.config.alwaysEval[id]) { return; }
    fn = 'create';
  }
  else if(match = cmd.match(/^`((?:\\.|[^`])+)`/i)) {
    // Likewhie.
    if(l.config.alwaysEval[id]) { return; }
    fn = 'create';
  }
  //else if(match = cmd.match(/^coins/i)) {
  //  fn = '';
  //}
  else if(match = cmd.match(/^(?:[!]|last)(?: (.+))?/i)) {
    fn = 'runLast';
  }
  else if(match = cmd.match(/^(?:length|amount|amnt) ?(.*)?/i)) {
    fn = 'list';
  }
  else if(match = cmd.match(/^(?:list|view|l|saved|evals|log?)(?: logs?)?(?: ([\S]*))?(?: ([\S]*))?(?: ([\S]*))?([^-]+ [^-]+)?/)) {
    fn = 'view';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?) all(?: (.+))?/i)) {
    fn = 'deleteAll';
  }
  else if(match = cmd.match(/^(?:clear|del(?:ete)?)(?: ([\S]+))?(?: -?(i(?:gnore)?))?(.+)?$/i)) {
    fn = 'delete';
  }
  else if(match = cmd.match(/^(?:save|rec?(:ord)?|preserve|tag) (.+)(?: (.+))?/i)) {
    fn = 'save';
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
l.utils.formatCmd = cmd => {
  return cmd ? '`' + cmd + (cmd.length > l.config.maxCmdLen ? '..' : '') + '`' : null;
}
;
l.utils.isModeSave = str => {
  /\s*-?(s(aved?)|tag(ged|s)?|recorded)\s*/.test(str);
}
;
l.utils.addToLog = (res) => {
  let id = res.message.user.id,
      cmd = res.cmd,
      log = l.log[id] || (l.log[id] = {})
  ;
  // We want our object to be ordered, but numbers are automatically first in js obj enumeration.
  if(Number.isInteger(cmd)) {
    cmd = ' ' + cmd
  }
  log[cmd] ? delete log[cmd] && (log[cmd] = res) : log[cmd] = res;
  bot.brain.save();
}
;
// Export.
module.exports = l.exports
;
//End file.
}).call(this);