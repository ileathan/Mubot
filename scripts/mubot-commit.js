
// Description:
//   Allow Mubot to commit code to gihubt.
//
;(function(){
  const l = {};
  l.imports = {
    exec: require('child_process').exec,
    path: require('path')
  }
  ;
  l.exports = bot => {
    bot.respond(/commit(?: (.+))?(?: (.+))?/i, l.commit)
  }
  ;
  let commit_msg = "Mubot auto commit.",
      project_dir = l.imports.path.resolve(`${__dirname}/../`);
     var commit_files = "."
  ;
  const commit = res => {
debugger;
    res.send("Commiting to master.");
console.log(`git add ${project_dir}/${res.match[1]||commit_files}; git commit -m ${res.match[2]||commit_msg};`)
console.log(`${project_dir}/${res.match[1]||commit_files}`)
    l.imports.exec(`git add "${project_dir}/${res.match[1]||commit_files}"; git commit -m "${res.match[2]||commit_msg}";`, (_, er, o)=>{debugger;});
  }
  ;
  Object.defineProperties(l, {
    commit: {enumerable: true, value: commit},
    imports: {enumerable: false},
    exports: {enumerable: false},
    commitMsg: {set(_){commit_msg = _}, get(){return commit_msg}},
    projectDir: {set(_){project_dir= _}, get(){return project_dir}},
    commitFiles: {set(_){commit_files = _}, get(){return commit_files}},
  });
  module.exports = l.exports;
}).call(this);
