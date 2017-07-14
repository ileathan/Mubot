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
`git clone https://github.com/ileathan/Mubot.git`

### Execution 
`./Mubot/bin/hubot`

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
process.env.HUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAm"
// or for slack process.env.HUBOT_SLACK_TOKEN="xoxb-3547094061-9j1Ujh3YhaZ7TShV7YkaHxbK"
```

4.) 
```javascript
robot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot') // (path_to_hubot, adapter_name, http_server, name, alias)
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
robot.run()
```

At this point you should be logged in to discord with a fully functional Mubot! (1 liner for discord)

```javascript
process.env.HUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAm"; Mubot = require('hubot'); robot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot'); robot.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/')); robot.loadExternalScripts(fs.readFileSync(process.cwd()+'/external-scripts.json').toString().slice(5,-4).split("\",\n  \"")); robot.run()
```
(and for slack)
```javascript
process.env.HUBOT_SLACK_TOKEN="xoxb-3547094061-auQ8rtm6DKDXaTqGWCDaS2hl"; Mubot = require('hubot'); robot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot'); robot.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/')); robot.loadExternalScripts(fs.readFileSync(process.cwd()+'/external-scripts.json').toString().slice(5,-4).split("\",\n  \"")); robot.run()
```
