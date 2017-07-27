// MIDDLEWARE CLASS
'use strict';
class Middleware {
  constructor() {
    this.middlewares = [];
  }
  use(fn) {
     this.middlewares.push(fn);
  }
  executeMiddleware(data, done) {
    var skip = done;
    this.middlewares.reduceRight((done, next) => () => next(data, done, skip), done)(data);
  }
  run(data) {
    return new Promise((resolve, reject) => {
      try {
        this.executeMiddleware(data, done => resolve(data));
      } catch(e) {
        reject(e);
      }
    })
  }
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
