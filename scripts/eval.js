// Description:
//   eval

var log, saved;

const allowed = ['183771581829480448', 'U02JGQLSQ']
const commands = ['length', 'amount', 'clear', 'delete', 'del']
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
const fakeEval = res =>
  evalCode(res.match[1])
    .then(o => res.send(formatReply(o)))
    .catch(e => res.send(formatErrorToReply(e)))
;
const realEval = msg => {
  let bot = msg.robot;
  let cmd = msg.match[1];
  if(allowed.includes(msg.message.user.id)) {
    if(!/^(module\.)exports ?=/.test(cmd)) {
      /[;]/.test(cmd) && (cmd = '{' + cmd + '}')
      cmd = 'module.exports=(bot=>' + cmd + ')(robot)';
    }
    let res = _eval(cmd, true);
    res = JSON.stringify(res, null, 2) || 'true';
    bot.brain.save();
    msg.send(res)
  } else {
    cmd = cmd.replace(/^(module\.)?exports\s?=\s?/,'');
    msg.match[1] = cmd;
    fakeEval(msg)
  }
  log[cmd] ? delete log[cmd] && (log[cmd] = res) : log[cmd] = res;
}
;
module.exports = bot => {
  //var log;
  bot.brain.on('loaded', () => {
    log = bot.brain.data.evals || (bot.brain.data.evals = {})
    saved = bot.brain.data.savedEvals || (bot.brain.data.savedEvals = {})
  });
  bot.respond(/(?:-f |fake )`([^`]+)`/i, fakeEval);
  bot.respond(/(?:-f |fake )```[a-z]*\n?((?:.|\n)+)\n?```/i, fakeEval);
  var last_mode;
  // Delete commands
  bot.hear(/^[!](?:clear|delete)(?: (log|saved|all))? all/i, msg => {
    let mode = msg.match[1];
    if(mode === 'all') {
      let amntDel = Object.keys(log).length + Object.keys(saved).length;
      for(let key in log) delete obj[key];
      for(let key in saved) delete obj[key];
      return msg.send("Deleted " + amntDel + " evals.");
    }
    let obj = mode === 'saved' ? saved : log;
    let amntDel = Object.keys(obj).length;
    for(let key in obj) delete obj[key];

    msg.send("Deleted " + amntDel + " evals.");
  })
  // Commands length
  bot.hear(/^[!](?:length|amount)(?: (log|saved))?/i, msg => {
    var mode = msg.match[1];
    const formatLengthReply = mode => {
      let obj = mode === 'saved' ? saved : log
      let values = mode === 'saved' ? Object.values(obj) : Object.keys(obj);
      let amnt = values.length;
      let last = values.pop();
      return "There's "+amnt+" "+mode+" evals." + (amnt ? " Last: " + formatCmd(last) : "");
    }
    if(mode) {
      msg.send(formatLengthReply(mode))
    }
    else {
      msg.send(formatLengthReply('saved') + '\n' + formatLengthReply('log'))
    }
  })
  // Create/Run commands
  bot.hear(/^(?:[!]|eval |run )(last|[!]|.+)/i, msg => {
    var cmd;
    var index = msg.match[1];
    if(commands.includes(index.toLowerCase()))
      return
    ;
    var index = ['!','last'].includes(msg.match[1].toLowerCase()) ? Object.keys(log).length - 1 : msg.match[1];
    saved[index] ?
      cmd = saved[index] && (last_mode = 'saved')
    :
      cmd = Object.keys(log)[index] && (last_mode = 'log')
    ;
    if(!cmd)
      return msg.send("No command found.")
    ;
    msg.match[1] = cmd;
    realEval(msg)
  });
  bot.respond(/[!](!|last|\d+) (.+)/i, msg => {
    var tagname = msg.match[2];
    var index = ['!','last'].includes(msg.match[1].toLowerCase()) ? Object.keys(log).length - 1 : msg.match[1];
    var cmd = Object.keys(log)[index]
    if(!cmd)
      return msg.send("No command found.")
    ;
    saved[saveAs] = cmd;
    bot.brain.save();
    msg.send("Saved " + formatCmd(cmd) + ' as ' + tagname + '.')
  });

  const formatCmd = cmd => {
    if(!cmd) return null;
    cmd = cmd.replace(/^(module\.)?exports\s?=\s?/,'').slice(0,20);
    return '`' + cmd + (cmd.length > 20 ? '..' : '') + '`'
  };
  // Delete commands
  bot.respond(/del(?:ete)? (saved )?(?: -?(i(?:gnore)?))?(.+)?$/i, msg => {
    var [, mode, ignore, delCmd ] = msg.match;
    var obj = mode ? saved : log;
    var startAt, endAt, res;
    if(saved[delCmd]) {
      res = "Deleted " + formatCmd(saved[delCmd]) + ".";
      delete saved[delCmd];
    }
    else if(Object.keys(log)[delCmd]) {
      res = "Deleted " + formatCmd(log[delCmd]) + ".";
      delete log[delCmd];
    }
    else if(['!!','!last'].includes(delCmd.toLowerCase())) {
      delCmd = Object.keys(obj).pop();
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
  });

  bot.respond(/`([^`]+)`/i, realEval);
  bot.respond(/```[a-z]*\n?((?:.|\n)+)\n?```/i, realEval);
  // View commands
  bot.respond(/(saved|evals)(?: logs?)?( res(?:ponses?)?| val(?:ues?)?)?(?: -?(i(?:gnore)?))?(?: (-?\d+))?(?:(?: |-| - )(\d+))?/i, msg => {
    let [, mode, res, ignore, startAt, endAt ] = msg.match
    ;
    let commands = res ? Object.values(mode==='saved'?saved:log) : Object.keys(mode==='saved'?saved:log);
    startAt = startAt > 0 ? (startAt -= 1) : startAt;
    startAt > -1 ?
      endAt = endAt ? endAt : commands.length
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
      i++ + ': `' + _.replace(/^(module\.)?exports\s?=\s?/,'').slice(0, 20) + (_.length > 20 ? '..' : '') + '`'
    ).join(', '))
  });
}

