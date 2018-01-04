# bundle-html-scripts

Bundle and compress all scripts from any local or remote server's html file

**As command line argument**
```bash
node /path/to/bundle-html-scripts.js http://example.com/file.html
```

**In code**
```javascript
require('bundle-html-scripts')('http://example.com/file.html')
```

Both commands above will create a file `./bundle.js` on success.   
There should be no problem parsing files with scripts inside comments, multiline included.   
On failure keep trying... after 10+ attempts open an issue including the link.

# Usage

Two parameters may be passed to the script, `skip` and `verbose`, an array of scripts to skip, and a boolean.   
For example to skip compiling bundle.js and bar.js you can use    
```node ./bundle-html-scripts.js http://example.com/file.html "['bundle.js','bar.js']"```     
Or to print verbose information `node ./bundle-html-scripts.js http://example.com/file.html "[]" true`

# Instalation

`npm install bundle-html-scripts` **||** `npm install -g bundle-html-scripts`  
**||** `git clone https://github.com/ileathan/bundle-html-scripts && cd bundle-html-scripts && npm install`

# Dependencies

1.) request

2.) uglify-es
