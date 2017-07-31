const fs = require('fs')
var rs = fs.createReadStream('./1');
var ws = fs.createWriteStream('./2');
var Transform = require('stream').Transform;
var transformer = new Transform();

transformer.setEncoding('utf8')
transformer._transform = function(data, encoding, cb) {
 string = data.toString('utf8');         // Just an example, any transformation can be done here directly
 string = string.replace(/a/g, "#")
 cb(null, string);
}

rs
  .pipe(transformer)
  .pipe(ws);
