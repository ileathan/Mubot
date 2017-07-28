Middleware.prototype.executeMiddleware = function(data, done) {
  var skip = done;
  this.middlewares.reduceRight((done, next) => () => next(data, done, skip), done)(data);
}


// MIDDLEWARE CLASS
'use strict';
function Middleware() {
  this.middlewares = [];
}
Middleware.prototype.add = function(fn) {
  this.middlewares.push(fn);
}
//function performNesting(data, done) {
//}
Middleware.prototype.execute = function(data, done) {
  var skip = done;
  this.middlewares.reduceRight(  (done, next) => () => next(data, done, skip), done)(data)
//performNesting.call(this, data, done)
}

Middleware.prototype.run = function(data) {
  return new Promise((resolve, reject) => {
    try {
      this.execute(data, function finished(doneData) {
        resolve(doneData);
      })
    } catch(error) {
      reject(error);
    }
  })
}
module.exports = Middleware;
// USAGE EXAMPLE
const middleware = new Middleware();
middleware.add(function(data, next, done) {
  //return done(); // You can return early if you'd like
  setTimeout(()=>{
    data.msg += ' is';
    next();
  }, 5000)
});
middleware.add(function(data, next) {
  setTimeout(()=>{
    //throw "errors work too" // You can throw an error and reject the promise
    data.msg += ' the';
    next();
  }, 1000)
});
middleware.add(function(data, next) {
  data.msg += ' best!!!';
  next();
});
middleware.run({msg: 'Mubot'})
  .then(res => console.log(res.msg))
  .catch(err => console.log('Woopsie! ' + err))

