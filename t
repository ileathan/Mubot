_=require('lodash')
g = _.unzip( _.zip([1,2,3],["a","b","c","d"],["one","two"]) )
counter=0
len = g.length
for(i=0;i<len;i++) {
  len2=g[i].length 
  for(i2=0;i2<len2;i2++) {
    if(typeof g[i][i2]==='undefined') {
      g[i].splice(i2,1); i--
    }
  }
}
console.log(g)
