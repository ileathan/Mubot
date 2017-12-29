// Description:
//   eval

const _eval = require('eval');
const inspect = require('util').inspect;
const { curry, always, append, concat, ifElse, isEmpty, join, map, mergeAll, pipe, reject, test, repeat } = require('ramda');

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
    .then(always({ value, output }))
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
  let cmd = res.match[1];
  evalCode(cmd)
    .then(done)
    .catch(done)
  ;
  const done = res => { msg.send(formatReply(res)); addToLog(cmd, res) }
}
;
var evals, saved, last_mode = 'evals';

const allowed = ['183771581829480448', 'U02JGQLSQ']; // CHANGE THESE TO YOUR ID'S!!



module.exports = bot => {
  var last_mode = 'evals';
  // Load commands from brain.
  bot.brain.on('connected', () => {
    evals = bot.brain.data.evals || (bot.brain.data.evals = {})
    saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {})
  });
  // Process command.
  bot.hear(RegExp('^(?:!|(?:[@]?' + (bot.name || bot.alias) + '\s*[:,]?\s*))(.)+', 'i'), processMessage)
  
  bot.hear(buildHearRegex('[!](saved|evals)(?: logs?)?( [\S]+)?(?: -?(i(?:gnore)?))?(?: (-?\d+))?(?:(?: |-| - )(\d+))?'), viewCmds);

function processMessage(run, msg) {
  let cmd = msg.match ? msg.match[1] : msg;
  ;
  let match = void 0, res = ""
  ;
  if(match = cmd.match(/^(?:length|amount|amnt|l) ?(.*)?/i)) {
    res = 'getLengths';
  }
  else if(match = /^(?:clear|del(?:ete)?) all ?(.*)?/i.test(cmd)) {
    res = 'deleteAllCmds';
  }
  else if(match = /^(?:clear|del(?:ete)?)/(?: ([\S]+))?(?: -?(i(?:gnore)?))?(.+)?$/i.test(cmd)) {
    res = 'deleteCmds';
  }
  else if(match = /^([!]|last) ?(.*)?/i.test(cmd)) {
    res = 'runLastCmd';
  }
  else if(match = cmd.match(/^fake ```[a-z]*\n?((?:.|\n)+)\n?```/i)) {
    res = 'fakeEval';
  }
  else if(match = cmd.match(/^fake `(\\.|[^`])+`/i)) {
    res = 'fakeEval';
  }
  else if(match = cmd.match(/(saved|evals)(?: logs?)?( [!]?[\S]+)?(?: -?(i(?:gnore)?))?(?: (-?\d+))?(?:(?: |-| - )(\d+))?/)) {
    res = 'viewCmds';
  }
  else if(match = cmd.match(/^(?:save|rec?(:ord)?|preserve|tag) (.+)(?: (.+))?/i)) {
    res = 'saveCmd';
  }
  match && (msg.match = match);
  run && this[res](msg);
  return !!match;
}

  function realEval(msg) {
    let cmd = msg.match[1];
    if(allowed.includes(msg.message.user.id)) {
      if(!/^(module\.)exports ?=/.test(cmd)) {
        /[;]/.test(cmd) && (cmd = '{' + cmd + '}')
        cmd = 'module.exports=(bot=>' + cmd + ')(bot)';
      }
      let result = _eval(cmd, true);
      result = JSON.stringify(result, null, 2) || result || 'true';
      msg.bot.brain.save();
      msg.send('# Result: ```' + result + '```');
    } else {
      cmd = cmd.replace(/^(module\.)?exports\s?=\s?/,'');
      msg.match[1] = cmd;
      msg.send(fakeEval(msg));
    }
  }
  ;

  function addToLog(eval) {
   var id = eval.msg.username.id;
   var cmd = eval.command;
   var res = eval.result;
   evals[id] || evals[id] = {};
   evals[id][cmd] ? delete evals[id][cmd] && (evals[id][cmd] = res) : evals[id][cmd] = res;
  }

  function getLengths(msg) {
    const id = msg.username.id;
    const mode = msg.match[1];
    const formatLengthReply = mode => {
      const obj = mode === 'saved' ? saved[id] : evals[id];
      if(!obj) {
        return msg.send("No log found")
      }
      const cmds = mode === 'saved' ? Object.values(obj) : Object.keys(obj);
      const amnt = cmds.length;
      const last = cmds.pop();
      return "There's " + amnt + " " + mode + " evals." + (amnt ? " Last: " + formatCmd(last) : "");
    }
    let res = "";
    mode ?
      res += formatLengthReply(mode)
    :
      res += formatLengthReply('saved') + '\n' + formatLengthReply('evals')
    ;
    msg.send(res);
  }
  ;
  function deleteAllCmds(msg) {
    const id = msg.username.id;
    const mode = msg.match[1];
    if(mode === ' all') {
      const amntDelSaved = Object.keys(saved[id] || {}).length;
      const amntDelLog = Object.keys(evals[id] || {}).length;
      for(let key in evals[id] || {}) delete evals[id][key];
      for(let key in saved[id] || {}) delete saved[id][key];
      return msg.send("Deleted " + amntDelLog + " log evals and " + amntDelSaved + " saved evals.");
    }
    const obj = isModeSave(mode) ? saved[id] || {} : evals[id] || {};
    const amntDel = Object.keys(obj).length;
    for(let key in obj) delete obj[key];
    msg.send("Deleted " + amntDel + " " + mode + " evals.");
  }
  ;
  const runLastCmd = function(msg) {
    var id = msg.username.id;
    var mode = msg.match[3];
    mode === void 0 ?
      mode = 'saved'
    :
      mode = isModeSave(mode)
    ;
    last_mode = mode ? 'saved' : 'evals';
    var obj = mode ? saved[id] || {} : evals[id] || {};
    var last = this.last_mode === 'saved' ? Object.values(obj).pop() : Object.keys(obj).pop();

    if(!last)
      return msg.send("There is no last " + last_mode + " command.")
    ;
    realEval(last);
  }
  ;
  function runCmd(msg) {
    var tag = msg.match[1], cmd = "";
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
    realEval(msg);
  }
  ;
  function saveCmd(msg) {
    var id = msg.username.id;
    if(!evals[id]) {
      return msg.send("No log found")
    }
    var [, cmdIndx, tag ] = msg.match;
    if(!tag) {
      tag = cmdIndx;
      cmdIndx = Object.keys(evals[id]).length - 1;
    }
    if(isReserved(tag))
      return msg.send("Cannot save, your name is a reserved command.")
    ;
    const cmd = Object.keys(evals[id])[cmdIndex];
    ;
    if(!cmd)
      return msg.send("No command found.")
    ;
    saved[id][tag] = cmd;
    msg.bot.brain.save();
    msg.send("Saved " + formatCmd(cmd) + ' as ' + tag + '.');
  }
  ;
  const formatCmd = cmd => {
    if(!cmd) return null;
    cmd = cmd.replace(/^(module\.)?exports\s?=\s?/,'').slice(0,20);
    return '`' + cmd + (cmd.length > 20 ? '..' : '') + '`';
  }
  ;
  function isModeSave(str) { 
    return /\s*-?(s(aved?)|tag(ged|s)?|recorded)\s*/.test(str);
  }
  function deleteCmds(msg) {
    var id = msg.username.id;
    if(!saved[id] || !evals[id]) {
      return msg.send("No log found")
    }
    var [, mode, ignore, delCmd ] = msg.match;
    var startAt, endAt, res;
    if(saved[id][delCmd]) {
      res = "Deleted " + formatCmd(saved[id][delCmd]) + ".";
      delete saved[id][delCmd];
    }
    else if(Object.keys(evals[id])[delCmd]) {
      res = "Deleted " + formatCmd(evals[id][delCmd]) + ".";
      delete evals[id][delCmd];
    }
    else if(/[!]|last/i.test(delCmd)) {
      let obj = isSaved(mode) ? saved[id] : evals[id];
      last_mode === 'saved' ?
        delCmd = Object.values(saved[id]).pop()
      :
        delCmd = Object.keys(evals[id]).pop()
      ;
      res = "Deleted " + formatCmd(obj[delCmd]) + ".";
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
    bot.brain.save();

    return msg.send(res || "No Command(s) found.")
  }
  ;

  function viewCmds(msg) {
    let [, mode, res, ignore, startAt, endAt ] = msg.match
    ;
    mode = isSaved(mode)
    let commands = res ? Object.values(mode?saved:evals) : Object.keys(mode?saved:evals);
    startAt = startAt > 0 ? --startAt : startAt || 0;
    startAt > -1 ?
      endAt = endAt || commands.length
    :
      endAt = void 0
    ;
    if(startAt > commands.length || endAt > commands.length || startAt > endAt || startAt === 0)
       return res.send("Your startAt and endAt parameters are invalid!")
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
      i++ + ': ' + formatCmd(_)
    ).join(', '))
  });
}

