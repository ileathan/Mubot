npm-recursive-keys
==================

Object.keys recursively


## Supported Node.js and Browsers

- `Node.js >= 0.10.0`
- `Chrome`
- `Firefox`
- `Safari`
- `Mobile Safari`
- `PhantomJS`
- `IE10`, `IE9`, `IE8`, `IE7` (..probably!)


## Examples of Use

### Node.js

```
var dumpKeysRecursively = require('recursive-keys').dumpKeysRecursively;

console.log(dumpKeysRecursively({
  x: 1,
  y: [1, 2],
  z: {a: 1}
}));

// Output:
// [
//   "x",
//   "y.0",
//   "y.1",
//   "z",
//   "z.a"
// ]

```

### Browsers

Please install by copying the [recursive_keys.js](https://raw.githubusercontent.com/kjirou/npm-recursive-keys/master/lib/recursive_keys.js).

```
<script src="/path/to/recursive_keys.js"></script>
```

```
var dumpKeysRecursively = recursiveKeys.dumpKeysRecursively;
```


## Development

### Preparation

- Read [package.json](./package.json).
- Install [PhantomJS](http://phantomjs.org/). e.g. `brew install phantomjs`

### Deployment

```
git clone git@github.com:kjirou/npm-recursive-keys.git
cd ./npm-recursive-keys
npm install
```
