;(function(){
  var thisModule = {};


  thisModule.VERSION = '0.9.0';

  // Refs) https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  thisModule._isArray = function(value){
    return typeof value === 'object' &&
      Object.prototype.toString.call(value) === '[object Array]';
  };

  thisModule._isString = function(value){
    return Object.prototype.toString.call(value) === '[object String]';
  };

  thisModule.dumpKeysRecursively = function(obj){
    var isArray = Array.isArray || thisModule._isArray,
      keys = [];

    var createKeyPath = function(currentKeyPath, key){
      return currentKeyPath + (currentKeyPath ? '.' : '') + key;
    };

    (function(path, any){
      var i, k, currentPath;
      if (isArray(any)) {
        for (i = 0; i < any.length; i += 1) {
          currentPath = createKeyPath(path, (i).toString());
          keys.push(currentPath);
          arguments.callee(currentPath, any[i]);
        }
      } else if (!thisModule._isString(any)) {
        for (k in any) {
          if (any.hasOwnProperty(k)) {
            currentPath = createKeyPath(path, k);
            keys.push(currentPath);
            arguments.callee(currentPath, any[k]);
          }
        }
      }
    })('', obj);

    return keys;
  };


  // Exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisModule;
  } else if (typeof window !== 'undefined') {
    window.recursiveKeys = thisModule;
  }
}).call(this);
