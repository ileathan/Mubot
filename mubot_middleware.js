// MIDDLEWARE CLASS
'use strict';
function Middleware() {
  this.middlewares = [];
}
Middleware.prototype.use = function(fn) {
  this.middlewares.push(fn);
}
Middleware.prototype.executeMiddleware = function(data, done) {
  var skip = done;
  this.middlewares.reduceRight((done, next) => () => next(data, done, skip), done)(data);
}
Middleware.prototype.run = function(data) {
  return new Promise((resolve, reject) => {
    try {
      this.executeMiddleware(data, done => resolve(data));
    } catch(e) {
      reject(e);
    }
  })
}
// USAGE EXAMPLE
const middleware = new Middleware();
middleware.use(function(data, next, done) {
  return done();
  setTimeout(()=>{
    data.msg += ' is';
    next();
  }, 5000)
});
middleware.use(function(data, next) {
  setTimeout(()=>{
    data.msg += ' the';
    next();
  }, 1000)
});
middleware.use(function(data, next) {
  data.msg += ' best!!!';
  next();
});
middleware.run({msg: 'Mubot'})
  .then(res => console.log(res.msg))
  .catch(err => console.log('Woopsie!'))
