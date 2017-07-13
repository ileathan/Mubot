# Mubot

### Dependencies
1.) Nodejs

To install I recommend first installing nvm:

```sh
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
```

then run this snippet to load nvm

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Then to download, compile, and install the latest release of node

```sh
nvm install node
```

And then in any new shell just use the installed version:

```sh
nvm use node
```

### Quick Install
`git clone https://github.com/ileathan/Mubot.git && cd Mubot`

### Execution 
`bin/hubot`

### Full Instalation

... This project is still constantly in developement but a full guide is coming. That way each end user can host their own marking servers accompanied with a customized and extended hubot implementation.


--- Hacking Mubot in REPL mode:
-------------------------------

1.) From within your Mubot directory run `node`

All commands from here on out are in REPL:

2.) 
```javascript
Mubot = require('hubot')
```

3.) 
```javascript
robot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot') // (path_to_hubot, adapter_name, http_server, name, alias)
```

4.) 
```javascript
robot.loadAdapter('discord') // replace with any adapter
```

5.) 
```javascript
robot.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/'))
```

6.) 
```javascript
robot.loadExternalScripts(fs.readFileSync(process.cwd()+'/external-scripts.json').toString().slice(5,-4).split("\",\n  \""))
```

7.) 
```javascript
process.env.HUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAN"
```

8.) 
```javascript
Discord = require('Discord.js')
```

9.) 
```javascript
robot.run()
```

At this point you should be logged in to discord with a fully functional Mubot! For convenience heres the 1 liner.

```javascript
Mubot = require('hubot'); robot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot'); robot.loadAdapter('discord'); robot.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/')); process.env.HUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAN"; Discord = require('Discord.js'); robot.loadExternalScripts(fs.readFileSync(process.cwd()+'/external-scripts.json').toString().slice(5,-4).split("\",\n  \"")); robot.run()
```
