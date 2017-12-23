// Description:
//   eval

const inspect = require('util').inspect;
const { curry, always, append, concat, ifElse, isEmpty, join, map, mergeAll, pipe, reject, test } = require('ramda');
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
const mdHeader = (n, text) => [ repeatStr('#', n), text ].join(' ');

const evalCode = (str) => {
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
    .then(always({ value, output }));
  }

  const nlMdCode = lang => pipe(mdCode(lang), concat('\n'));
  const isMultiline = test(/\n/);
  const inspectInfinite = (val) => inspect(val, { depth: Infinity });
  const getErrorMessage = (e) => e.message || String(e);
  const formatValueToReply = pipe(inspectInfinite, nlMdCode('js'));
  const formatErrorToReply = pipe(getErrorMessage, ifElse(isMultiline, nlMdCode('text'), mdPre));

const formatOutput = (arr) =>
  join('\n', [
    mdHeader(4, 'output'),
    mdCode('', join('\n', arr))
  ])
;
const formatReply = (res) =>
  join('\n', reject(isEmpty, [
    formatValueToReply(res.value),
    isEmpty(res.output) ? '' : formatOutput(res.output)
  ]))
;
// TODO: res.reply mentions user which is kind of useless
const readEvaluateAndPrint = (res) =>
  evalCode(res.match[1])
    .then(o => res.reply(formatReply(o)))
    .catch(e => res.reply(formatErrorToReply(e)))
;
module.exports = (bot) => {
  bot.respond(/`([^`]+)`/i, readEvaluateAndPrint)
  bot.respond(/```[a-z]*\n?((?:.|\n)+)\n?```/i, readEvaluateAndPrint)
}
