// Description:
//   Allow Mubot to commit code to gihubt.
//
;(function(){
  const l = {};
  l.exports = bot => {
    // purposely capture commit pointlessly so we can call the command outside
    // of natural context in the sense we can do `mubot.commit(res)` with another
    // res that wont have higher capture groups set.
    bot.respond(/((commit))(?: (.+))?(?: (.+))?/i, l.commit)
    Object.assign(bot.mubot, {commit: l.commit})
  }
  ;
  l.imports = {
    exec: require('child_process').exec,
    path: require('path')
  }
  ;
  let commit_msg = "Mubot auto commit.",
      project_dir = l.imports.path.resolve(`${__dirname}/../`);
     var commit_files = "."
  ;
  const Commit = res => {
    l.imports.exec(
      `git add "${project_dir}/${res.match[3]||commit_files}"; git commit -m "${res.match[4]||commit_msg}"; git push;`,
      (_, err, out)=>res.send(out)
    );
  }
  ;
  Object.defineProperties(l, {
    commit: {value: Commit, enumerable: true},
    imports: {enumerable: false},
    exports: {enumerable: false},
  })
  ;
  Object.defineProperties(l.commit, {
    commitMsg: {set(_){commit_msg = _}, get(){return commit_msg}, enumerable: true},
    projectDir: {set(_){project_dir= _}, get(){return project_dir}, enumerable: true},
    commitFiles: {set(_){commit_files = _}, get(){return commit_files}, enumerable: true},
  })
  ;
  module.exports = l.exports;
}).call(this);
