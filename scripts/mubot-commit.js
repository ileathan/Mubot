// Description:
//   Allow Mubot to commit code to gihubt.
//
;(function(){
  // Imports
  const path = require('path');
  const exec = require('child_process').exec;
  const l = {};
  
  let commit_msg = "Mubot auto commit.",
      project_dir = path.resolve(`${__dirname}/../`);
     var commit_files = "."
  ;
  Object.defineProperty(l, 'commit', {value: Commit, enumerable: true})
  ;
  l.commit.exports = bot => {
    // purposely capture commit pointlessly so we can call the command outside
    // of natural context in the sense we can do `mubot.commit(res)` with another
    // res that wont have higher capture groups set.
    bot.respond(/((commit))(?: ([\S]+))?(?: (.+))?/i, l.commit)
    Object.assign(bot.mubot, {commit: l.commit})
  }
  ;
  l.commit.imports = {
    exec: require('child_process').exec,
    path: require('path')
  }
  ;

  function Commit(res) {
    exec(
        `git add "${project_dir}/${res.match[3]||commit_files}";`
      + `git commit -m "${res.match[4]||commit_msg}"; git push;`,
      (err, stderr, stdout)=>res.send(stdout)
    );
  }
  Object.defineProperties(l.commit, {
    imports: {enumerable: false},
    exports: {enumerable: false},
    commitMsg: {set(_){commit_msg = _}, get(){return commit_msg}, enumerable: true},
    projectDir: {set(_){project_dir= _}, get(){return project_dir}, enumerable: true},
    commitFiles: {set(_){commit_files = _}, get(){return commit_files}, enumerable: true},
  })
  ;
  module.exports = l.commit.exports;
}).call(this);
