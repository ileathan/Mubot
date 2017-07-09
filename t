process.argv.forEach(function(val, index) {
  if (index < 2) return 
  console.log(`${index}: ${val}`)
});
process.abort("NIGGGUH")
