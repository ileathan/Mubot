// Description:
//   eval

const _eval = require('eval');
const {inspect} = require('util');
const { curry, alwaysF, append, concat, ifElse, isEmpty, join, map, mergeAll, pipe, reject, test, repeat } = require('ramda');

const repeatStr = pipe(repeat, join(''))

const S = require('sanctuary');
const R = require('ramda');
const RF = require('ramda-fantasy');
const vm = require('vm');
const treisInit = require('treis').__init;


const wrap = curry((x, s) => x + s + x);
const mdLink = curry((text, url) => `[${text}](${url})`);
const mdBold = wrap('**');
const mdStrike = wrap('~~');
const mdPre = wrap('`');
const mdCode = curry((lang, str) => '```' + lang + '\n' + str + '\n```');
const mdHeader = (n, text) => [ '#'.repeat(n), text ].join(' ');

const evalCode = str => {
  const output = [];
  const fakeConsole = {
    log: (...arg) => {
      output.push(join(' ', map(inspect, arg)));
      return void 0;
    }
  }
  const timeouts = [];
  const fakeSetTimeout = (fn, ms) => {
    let timeout;
    timeouts.push(new Promise((res, rej) => {
      timeout = setTimeout(() => {
        try {
          fn();
          res();
        } catch (e) {
          rej(e);
        }
      }, ms);
    }));
    return timeout;
  }
  const treis = treisInit(fakeConsole.log, false);
  const sandbox = mergeAll([
    { R, S, console: fakeConsole, treis, trace: treis, setTimeout: fakeSetTimeout },
    R,
    RF
  ]);
  let value
  try {
    value = vm.runInNewContext(str, sandbox, {
      timeout: 10000
    });
  } catch (e) {
    return Promise.reject(e);
  }

  return Promise.all(append(Promise.resolve(value), timeouts))
    .then(alwaysF({ value, output }))
  ;
}

const nlMdCode = lang => pipe(mdCode(lang), concat('\n'));
const isMultiline = test(/\n/);
const inspectInfinite = (val) => inspect(val, { depth: Infinity });
const getErrorMessage = (e) => e.message || String(e);
const formatValueToReply = pipe(inspectInfinite, nlMdCode('js'));
const formatErrorToReply = pipe(getErrorMessage, ifElse(isMultiline, nlMdCode('text'), mdPre));

const formatOutput = (arr) =>
  join('\n', [
    mdHeader(1, 'Output'),
    mdCode('', join('\n', arr))
  ])
;
const formatReply = res =>
  join('\n', reject(isEmpty, [
    formatValueToReply(res.value),
    isEmpty(res.output) ? '' : formatOutput(res.output)
  ]))
;
const fakeEval = msg => {
  let id = e.msgToUserId(msg);
  let cmd = res.match[1];
  evalCode(cmd)
    .then(done)
    .catch(done)
  ;
  const done = res => { msg.send(formatReply(res)); e.addToLog(cmd, res, id) }
}
;
var evals, saved, last_mode;
const always = {};
const allowed = ['183771581829480448', 'U02JGQLSQ']; // CHANGE THESE TO YOUR ID'S!!

const e = {};

// Implicitly pass global this scope to eval.
e.realEval = msg => {
  let {inspect} = require('util');
  let cmd = evalCmd = msg.match[1];
  let id = e.msgToUserId(msg);
  if(allowed.includes(id)) {
    if(!/module[.]exports\s*=/.test(cmd)) {
      !/[;]|return(;|\s|\n|$)/.test(cmd) && (evalCmd = 'return ' + evalCmd);
      evalCmd = 'module.exports=((bot, botD, botS)=>{' + evalCmd + '})(global.botG, global.bot, global.botSlack)';
    }
    global.botG = global.bot || msg.bot;

    let result = _eval(evalCmd, true);
    delete global.botG;
    try {
      result = inspect(result, null, 2) || 'true';
    } catch(e) {
      result = e.slice(0, 27);
    }
    e.addToLog(cmd, result, id)
    msg.bot.brain.save();
    msg.send('# Result: ```' + result + '```');
  } else {
    msg.send(e.fakeEval(msg));
  }
}
;


e.addToLog = function(cmd, res, id) {
 evals[id] || (evals[id] = (evals[id] = {}));
 evals[id][cmd] ? delete evals[id][cmd] && (evals[id][cmd] = res) : evals[id][cmd] = res;
}

e.msgToUserId = function(msg) {
  return msg.username ?
    // Discord.
    msg.username.id
  :
    // Slack.
    msg.message.user.id
  ;
}

e.getLengths = function(msg) {
  const mode = e.isModeSave(msg.match[1]);
  const id = e.msgToUserId(msg);
  const formatLengthReply = mode => {
    const obj = mode ? saved[id] || {} : evals[id] || {};
    const cmds = mode ? Object.values(obj) : Object.keys(obj);
    const amnt = cmds.length;
    const last = cmds.pop();
    return amnt + " " + (mode?'saved':'logged') + " eval(s)." + (amnt ? " Last: " + e.formatCmd(last) : "");
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
e.deleteAllCmds = function(msg) {
  const id = e.msgToUserId(msg);
  const mode = msg.match[1];
  if(mode === 'all') {
    const amntDelSaved = Object.keys(saved[id] || {}).length;
    const amntDelLog = Object.keys(evals[id] || {}).length;
    for(let key in evals[id] || {}) delete evals[id][key];
    for(let key in saved[id] || {}) delete saved[id][key];
    return msg.send("Deleted " + amntDelLog + " log evals and " + amntDelSaved + " saved evals.");
  }
  const obj = e.isModeSave(mode) ? saved[id] || {} : evals[id] || {};
  const amntDel = Object.keys(obj).length;
  for(let key in obj) delete obj[key];
  msg.send("Deleted " + amntDel + " " + (mode ? "saved" : "log") + " evals.");
}
;

e.deleteCmds = function(msg) {
  const id = e.msgToUserId(msg);
  if(!saved[id] || !evals[id]) {
    return msg.send("No log found")
  }
  var [, mode, ignore, delCmd ] = msg.match;
  var startAt, endAt, res;
  if(saved[id][delCmd]) {
    res = "Deleted " + e.formatCmd(saved[id][delCmd]) + ".";
    delete saved[id][delCmd];
  }
  else if(Object.keys(evals[id])[delCmd]) {
    res = "Deleted " + e.formatCmd(evals[id][delCmd]) + ".";
    delete evals[id][delCmd];
  }
  else if(/[!]|last/i.test(delCmd)) {
    let obj = e.isModeSave(mode) ? saved[id] : evals[id];
    last_mode === 'saved' ?
      delCmd = Object.values(saved[id]).pop()
    :
      delCmd = Object.keys(evals[id]).pop()
    ;
    res = "Deleted " + e.formatCmd(obj[delCmd]) + ".";
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

e.runLastCmd = function(msg) {
  const id = e.msgToUserId(msg);
  var mode = msg.match[1];
  mode === void 0 && (mode = last_mode || 'evals');
  mode = e.isModeSave(mode)
  var obj = mode ? saved[id] || {} : evals[id] || {};
  var last = mode ? Object.values(obj).pop() : Object.keys(obj).pop();

  if(!last)
    return msg.send("There is no last " + mode + " command.")
  ;
  msg.match = [, last];
  e.realEval(msg);
}
;
e.runCmd = function(msg) {
  const id = e.msgToUserId(msg);
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
  e.realEval(msg);
}
;
e.saveCmd = function(msg) {
  const id = e.msgToUserId(msg);
  if(!evals[id]) {
    return msg.send("No log found")
  }
  var [, cmdIndx, tag ] = msg.match;
  if(!tag) {
    tag = cmdIndx;
    cmdIndx = Object.keys(evals[id]).length - 1;
  }
  if(e.isReserved(tag))
    return msg.send("Cannot save, your name is a reserved command.")
  ;
  const cmd = Object.keys(evals[id])[cmdIndex];
  ;
  if(!cmd)
    return msg.send("No command found.")
  ;
  saved[id][tag] = cmd;
  msg.bot.brain.save();
  msg.send("Saved " + e.formatCmd(cmd) + ' as ' + tag + '.');
}
;
e.formatCmd = function(cmd) {
  if(!cmd) return null;
  //cmd = cmd.slice(29, -32).replace(/^return\s*/, '');
  return '`' + cmd + (cmd.length > 20 ? '..' : '') + '`';
}
;
e.isModeSave = function(modeStr) {
  return /\s*-?(s(aved?)|tag(ged|s)?|recorded)\s*/.test(modeStr);
}

e.viewCmds = function(msg) {
  const id = e.msgToUserId(msg);
  let [, mode, res, ignore, indexes ] = msg.match
  ;
  let [startAt, endAt] = (indexes || "").split(/\s*[-]\s*/);
  mode = e.isModeSave(mode);
  let commands = res ? Object.values(mode ? saved[id] : evals[id]) : Object.keys(mode ? saved[id] : evals[id])
  ;
  if(startAt === '!') {
    let remove = startAt.slice(1);
    !mode && (remove = parseInt(remove));
    let cmd = commands[remove]
    let i = mode ? commands.indexOf(remove) : remove;
    return  msg.send("(1) " + i + ': ' + e.formatCmd(cmd));
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
    i++ + ': ' + e.formatCmd(_)
  ).join(', '))
}
;

e.setAlways = function(msg) {
  let isAlways = !(msg.match[1] || "").match(/off|false|0|no|x/i);
  let id = e.msgToUserId(msg);
  isAlways ?
    always[id] ?
      msg.send("Eval mode already set to always.")
    :
      (always[id] = 1) && msg.send("Eval mode set to always.")
    //
  :
    always[id] ?
      delete always[id] && msg.send("Eval mode set to trigger only.")
    :
      msg.send("Eval mode already set to trigger only.")
    //
  ;
}
;

module.exports = bot => {
  // Load commands from brain.
  bot.brain.on('loaded', () => {
    evals = bot.brain.data.evals || (bot.brain.data.evals = {})
    saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {})
  });
  // Process command.
  bot.hear(RegExp('^(?:[!]|(?:[@]?' + (bot.name || bot.alias) + '\s*[:,]?\s*[!]))(.+)', 'i'), processMessage)

  bot.respond(/```[a-z]*\n?((?:.|\n)+)\n?```/i, e.realEval)

  bot.hear(/(?:[^!]|)(?:`((?:\\.|[^`])+)`|```[a-z]*\n?((?:.|\n)+)\n?```)/i, msg => {
    msg.match[1] = msg.match[1] || msg.match[2];
    always[e.msgToUserId(msg)] &&
      e.realEval(msg)
    ;
  });

  function processMessage(msg, dontRun) {
    let cmd = msg.match ? msg.match[1] : msg;
    let match = void 0, res = "";
    if(match = cmd.match(/```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
      res = 'realEval';
    }
    else if(match = cmd.match(/`((?:\\.|[^`])+)`/i)) {
      res = 'realEval';
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
      e[res](msg);
    }
    return !!match;
  }


}
