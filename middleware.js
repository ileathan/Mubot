
// MIDDLEWARE CLASS
'use strict';
function Middleware() {
  this.middlewares = [];
}
Middleware.prototype.add = function(fn) {
  this.middlewares.push(fn);
}
Middleware.prototype.executeMiddleware = function(data, done) {
  var i = 0, quitIndex;
  var skip = done; var reverseMode; var reverseModeIndex;
  var nestedFns = this.middlewares.reduceRight(nestFns.bind(this), done);
  function nestFns(done, next) {
    return accumulator.bind(this);
    function accumulator(options) {

      console.log(data.msg +" " + i)
      if(reverseMode) {
        console.log((+i + +reverseModeIndex + +reverseMode - 1) )
        next = this.middlewares[(+i + +reverseModeIndex + +reverseMode - 1)]
        if(!next) next = skip
      }

      if(options < 0 && !reverseMode) {
        reverseMode = 1; reverseModeIndex = options;
        console.log("going to index " + (i + +reverseModeIndex))
        next = this.middlewares[i + +reverseModeIndex]
      }

      if(options === Object(options)) { /* Do something if middleware specifies options */ }
      else if(options >= 0) { quitIndex = options + i } // options is a quit index, which is relative to the calling func, so add i.
      if(i === quitIndex) next = skip
      next(data, done, i++)
    }
  }
  nestedFns(data)
}
Middleware.prototype.run = function(data) {
  return new Promise((resolve, reject) => {
    try {
      this.executeMiddleware(data, () => resolve(data));
    } catch(e) {
      reject(e);
    }
  })
}
// USAGE EXAMPLE
const middleware = new Middleware();
middleware.add(function(data, next, index) {
   console.log("My position in the middleware stack is " + index + ".")
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
  next(-2);
});
middleware.add(function(data, next) {
  data.msg += ' 1';
  next();
});
middleware.add(function(data, next) {
  data.msg += ' 2';
  next();
});
middleware.run({msg: 'Mubot'})
  .then(res => console.log(res.msg))
  .catch(err => console.log('Woopsie!'))
