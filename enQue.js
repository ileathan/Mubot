// enQue class
// Author leathan
// License MIT
'use strict'

// **Constructor** Creates a new enQue object with the specified
// functions. `que = new enQue([fn1, fn2, fn3])`
// You can also create an empty object via `new enQue()`
function enQue(init) {
  this.que = [];
  if(init) this.add(init);
  // __returns itself for use in chaining__
  return this;
}

// **Compact** Removes undefined and null values.
// This method should never ever be called
// directly, and it will probably become private
// in the future.. but who knows. `que.compact()`
enQue.prototype.compact = function() {
  var i = 0;
  const res = [];
  for (let val of this.que) if(val) res[i++] = val;
  this.que = res;
  // __returns itself for use in chaining__
  return this;
}

// **enQue.fill** Fills an enQue object with `fn`'s `n` times.
// `que.fill((_,n)=>{console.log('works');n()}, 7)`
// running that que will display 'works' 7 times.
enQue.prototype.fill = function(fn, n) {
  for(let i = 0; i < n; i++) {
    this.que.push(fn);
  }
  // __returns itself for use in chaining__
  return this;
}

// **enQue.add** Adds `fn` to the enQue object.
// `que.add((_,n,__,i)=>{console.log(i)})` or you can
// specify an array of functions `que.add([fn1, fn1])`
enQue.prototype.add = function(fn) {
  if(fn.constructor.name === 'Array') {
    for(let i = 0, l = fn.length; i < l; i++) {
      this.que.push(fn[i]);
    }
  } else {
    this.que.push(fn);
  }
  // __returns itself for use in chaining__
  return this;
}

// **enQue.clear** Clears all functions from the que
// `que.clear()`
enQue.prototype.clear = function() {
  this.que = [];
  return this;
  // __returns itself for use in chaining__
}

// **enQue.remove** Removes an item from the que.
// `que.remove("(_,n,__,i)=>{console.log(i)}")`
// `que.remove(fn1, 2)` removes 2 occurances of fn1
// `que.remove(7)` removes the 8th function (0 indexed)
//  to remove an array of function refs and/or strinfified functions.
// `que.remove([fn1, "(_,n,__,i)=>{console.log(i)}", fn2])`
// `que.remove([fn1, fn2, fn3], 2)` will only remove fn1 and fn2.
enQue.prototype.remove = function(item, amount) {
  // Here we extract the items type.
  let type = item.constructor.name;
  if(type === 'Number') {
    return this.que.splice(item, 1);
  }
  else if(type === "Array") {
    amount = amount || Infinity;
    let removed = 0;
    for(let i=0, l=item.length; i<l; i++) {
      var check = item[i].constructor.name === 'Function' ? item[i] : item[i].toString();
      for(let j=0, l2=this.que.length; j<l2; j++) {
        // Make sure we dont remove more than amount!
        if(removed === amount) break;
        if(this.que[j] === check) {
          delete this.que[j];
          removed++;
        }
      }
    }
    // __returns itself after compacting for use in chaining__
    return this.compact();
  }
  else {
    let check = type === 'Function' ? item : item.toString();
    amount = amount || Infinity;
    let removed = 0;
    for(let i=0, l=this.que.length; i<l; i++) {
      // Make sure we dont remove more than amount!
      if(removed === amount) break;
      if(check === check.constructor.name === 'Function' ? this.que[i] : this.que[i].toString()) {
        delete this.que[i]
        removed++;
      }
    }
    // __returns itself after compacting for use in chaining__
    return this.compact();
  }
}

// **executeQue** Executes the que, you should not need to call
// this function directly, for example if `data` doesnt exist
// you will not be able to consume/output properly.
// `run` makes sure data exists. On the offchance you need to
// bypass the promise system its avialable `que.executeQue()`
// but remember to pass in `data` and `done` if needed.
enQue.prototype.executeQue = function(data, done) {
  // preserve the original callback for potential que rebuilding.
  var orig = done;
  // `i` is our iterator, `quit`  and `inject` are used to check if we need
  // to quit early and resolve the data, or inject `Function`.
  var i = 0, quit = false, inject = false, injectFn = false;
  // The `reduceRight` function allows us to itterate through the que while constantly
  // nesting callbacks using the accumulator, it has very reasonable performance.
  this.que.reduceRight((done, next) =>
    options => {
      // Options can be any operation to perform while nesting callbacks.
      // Currently options must be a specific `JSON Object`, or a `Number`, if its JSON
      // then it needs a `quit` or `inject` property. Otherwise **0** terminates que,
      // exposing the data immitiadtly. A negative Number sends the data
      // to backwards in the que (to a new que **techincally**), Positive Numbers
      // send the data forward, `i` is current callback index being nested.
      if(options === 0) return next = orig;
      if(options !== data && options === Object(options)) {
        if((!options.function && !options.inject) && !options.quit)
          throw new Error(`${options} is not supported, valid fomat could be +n, -n, 0, or, {quit:+n}, {inject:+n,function:Function}`)
        else if(options.quit) {
          quit = options.quit;
        }
        else if(options.inject) {
          inject = options.inject - 1;
          injectFn = options.function;
        }
      }
      else if(options !== data && options) {
        // creates a temp que to hold our new que.
        let tmpQue = [];
        // let `j` be the position we are skipping to.
        // lets say `next(-3)` was passed, so `options = -3`.
        // `i` is the current que spot - 1 that called `next(-3)`.
        // lets say `i` was **5**, so we want to go back to **1**.
        // so `j = 5 + -3  - (options < 0) = 1`
        // so start at position 1, until the end.
        var j = i + options - (options < 0);
        if(!this.que[j-1]) throw `${options} out of bounds, no que position ${j} exists.`
        for(let l = this.que.length; j < l; j++) {
          tmpQue.push(this.que[j])
        }
        // sets the que to the one we just built.
        this.que = tmpQue;
        // Apends the original data exposure callback.
        this.que.push(orig)
        this.executeQue(data);
        // Makes sure the current execution goes nowhere.
        done = ()=>{}
        next = ()=>{}
      }
      // if quit is specified, checks if we need to quit
      // and if so sets `next` to resolve `data`, otherwise de-increments
      // the checker variable.
      if(quit !== false) {
        if(quit === 0) { next = orig; quit = false }
        else quit--;
      }
      // if inject is specified, checks if we need to inject
      // the `Function` if so waits it injects the function
      // **which is NOT part of the que** and hence its execution is
      // not synchronized, this will probably be fixed in the future.
      // calls `next`, otherwise de-increments checker and calls `next`.
      if(inject !== false) {
        if(inject === 0) {
          next(data, done, i++, orig);
          injectFn(data);
          injectFn = inject = false;
        } else {
          inject--;
          next(data, done, i++, orig);
        }
      } else {
        // no special object options were specified just proceeds.
        next(data, done, i++, orig)
      }
    }
  // this sets our initial accumulator to the function done each successive call
  // then creates another function callback nest where the old `done` becomes the callback
  // of the new `done` the original `done` passed in here does nothing more then resolve the
  // data. Which is passed in immidiatly since right after nesting the entire composition is executed.
  , done)(data);
}

// **enQue.run** Creates a promise which resolves when the que ends.
// `que.run(data)` or for ques that dont consume data `que.run()`
// Since a promise is returns you should then call `.then(data=>{})`
// and `.catch(error=>{})`
enQue.prototype.run = function(data) {
  // Allow ques that dont need to consume data.
  if(!data) data = {};
  return new Promise((resolve, reject) => {
    try {
      this.executeQue(data, () => resolve(data));
    } catch(error) {
      reject(error);
    }
  // __returns a promise which can be used for chaining__
  })
}

module.exports = enQue;
