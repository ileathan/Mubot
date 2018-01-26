# Mubot

A bot that aside from inhereting mubot's most usefull core features and scripts, allows you to host a multiple of preconfigured webservices. One of which allows you to connect directly to the bitmark network.

The main webservice is a marking implementation that uses an included back end marking API. Seperate marking implemenations (like mubots own text based markings) are not shown here but will also use the back end API.
![Image of coloring](https://preview.ibb.co/bwkMfF/Screen_Shot_2017_07_17_at_10_30_29_PM.png)

The documentation page for the API is another webservice included and is a great place to learn how to actually enable bitmarking in your applications.

![Image of coloring](https://preview.ibb.co/j8HCnv/Screen_Shot_2017_07_17_at_10_36_24_PM.png)

Another webservice included is a logger, which logs all servers.
![Image of coloring](https://preview.ibb.co/eUQzZa/Screen_Shot_2017_07_18_at_12_16_30_PM.png)

### Dependencies
1.) Nodejs

To install I recommend first installing nvm:

```sh
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
```

Then run this snippet every time to load nvm (or add it to your .bashrc / .bash_profile).

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Then to download, compile, and install the latest release of node

```sh
nvm install node
```

And then just use the installed version:

```sh
nvm use node
```

### Quick Install
`git clone https://github.com/ileathan/Mubot.git`

### Execution 
`./Mubot/bin/mubot`

### Full Instalation

... This project is still constantly in developement but a full guide is coming. That way each end user can host their own marking servers accompanied with a customized and extended mubot implementation.


--- Hacking Mubot in REPL mode:
-------------------------------

1.) From within your Mubot directory run `node`

All commands from here on out are in REPL:

2.) 
```javascript
Mubot = require('mubot')
```

3.) 
```javascript
// These are obviously not valid anymore, replace with your own.
process.env.MUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAm"
process.env.MUBOT_SLACK_TOKEN="xoxb-3547094061-9j1Ujh3YhaZ7TShV7YkaHxbK"
```

4.) 
```javascript
bot = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot') // (path_to_mubot, adapter_name, http_server, name, alias)
```

5.) 
```javascript
bot.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/'))
```

6.) 
```javascript
bot.loadExternalScripts(JSON.parse(fs.readFileSync(process.cwd()+'/external-scripts.json')))
```

7.) 
```javascript
bot.run()
```

At this point you should be logged in to discord with a fully functional Mubot! (1 liner for both slack and discord)

```javascript
process.env.MUBOT_DISCORD_TOKEN="MzI5NjEyNTk2Mzk3MzQyNzIx.DDU_LA.D8jneOVTr-M_yIIfjQ-IJ9-QsAm"; Mubot = require('mubot'); botDiscord = Mubot.loadBot(process.cwd()+'/node_modules/', 'discord', true, 'Mubot', 'Mubot'); botDiscord.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/')); botDiscord.loadExternalScripts(fs.readFileSync(process.cwd()+'/external-scripts.json').toString().slice(5,-4).split("\",\n  \"")); botDiscord.run(); process.env.MUBOT_SLACK_TOKEN="xoxb-3547094061-auQ8rtm6DKDXaTqGWCDaS2hl"; botSlack = Mubot.loadBot(process.cwd()+'/node_modules/', 'slack', true, 'Mubot', 'Mubot'); botSlack.loadHubotScripts(process.cwd()+'/scripts', fs.readdirSync(process.cwd()+'/scripts/')); botSlack.loadExternalScripts(JSON.parse(fs.readFileSync(process.cwd()+'/external-scripts.json'))); botSlack.run()
```



-------------------------------------------------------------------------
- with <3 from https://leat.io & https://leathan.xyz
