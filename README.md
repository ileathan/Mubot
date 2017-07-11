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

### Instalation
`git clone https://github.com/ileathan/Mubot.git && cd Mubot`

### Execution 
`bin/hubot`
