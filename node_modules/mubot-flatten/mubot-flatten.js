let isBuffer = require('is-buffer')

module.exports = flatten
flatten.flatten = flatten

function flatten (target, opts) {
  opts = opts || {}
  let delimiter = opts.delimiter || '.'
  let maxDepth = opts.maxDepth
  let maxCount = opts.maxCount
  let exclude = opts.exclude || [];
  let filter = opts.filter;
  let output = {}
  let keyCount = {};
  function step (object, prev, currentDepth) {
    currentDepth = currentDepth || 1
    Object.keys(object).forEach(function (key) {
      let value = object[key]
      let isarray = opts.safe && Array.isArray(value)
      let type = Object.prototype.toString.call(value)
      let isbuffer = isBuffer(value)
      let isobject = (
        type === '[object Object]' ||
        type === '[object Array]'
      )
      let newKey = prev
        ? prev + delimiter + key
        : key

      if (!isarray && !isbuffer && isobject && Object.keys(value).length && (!opts.maxDepth || currentDepth < maxDepth)) {
        return step(value, newKey, currentDepth + 1)
      }

      let mykey = "" + key + currentDepth;
      keyCount[mykey] ? ++keyCount[mykey] : keyCount[mykey] = 1;
      if(keyCount[mykey] < maxCount && !exclude[mykey] && !exclude.includes(mykey)) {
        output[newKey] = value
      }
    })
  }

  step(target)

  if(filter) {
    outputs = Object.keys(map).filter(_=>filter.test(_));
  }
  if(filter.values) {
    output = Object.values(map).filter(_=>filter.values.test(_));
  }
  return output
}
