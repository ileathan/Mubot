r = require('redis');
//r = new redis

r.set('foo', 'bar')

console.log(r.get('foo'))

