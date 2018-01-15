// Description:
//  Mines for your leat.io user account.
//
// Commands:
//   Mubot mine me crypto - Just monero and soon just Bitmark, donate for others.
//

(function(){

// API
const l = {}
;
l.que = [];
l.users = {};
l.config = require('../node_modules/mubot-mine/config/defaults');
l.stats = {};
l.miner = null;
l.MAX_DAILY_FOUND = 7;
l.exports = bot => {
  bot.respond(/mine(?: me)?(?: (\d+))?$/i, l.start);
  bot.respond(/miner/i, l.viewStats);
  bot.respond(/stop miner?|miner? stop/i, l.stop);
}
;
module.exports = l.exports
;
l.idToLeatName = id => Object.keys(bot.leat.users).filter(_=>Object.values(bot.leat.users[_].altIds||[]).includes(id)).pop()
;
l.viewStats = res => {
  res.send(JSON.stringify(l.stats).replace(/"/g, '').replace(/,/g, ' ').slice(1, -1) || "Not stats.")
}
;
l.stop = async (res) => { await miner.stop(); res.send("Miner stopped.") }
;
l.start = async (res) => {
  let id  = res.message.user.id,
      name = l.idToLeatName(id),
      amount = res.match[1] || 1
  ;
  if(!name) {
    return res.send(
      "Can only mine for verified users, on leat.io type: ```/" + res.bot.adapterName + " "
      + id + "``` Alternatively you may private message me your 2FA code."
    );
  }

  if(l.que.includes(name)) {
    return res.send("You're already in the mining que.")
  }
  if(l.users[name]) {
    if(l.users[name].daily_found > l.MAX_DAILY_FOUND) {
      return res.send("Sorry, I've already mined you too much money, try tomorrow.")
    }
    Object.assign(l.users[name], {amount, res})
  } else {
    l.users[name] = { daily_found: 0, amount, res}
  }

  if(!l.miner) {
    try {
      l.config.username = name;
      l.miner = await l.config.load(l.config, l.que, l.users, l.stats);
      await l.miner.start();
      l.que.push(name);
    } catch(e) {
      return res.send("Error starting miner, try again.")
    }
  }

  //const running = await l.miner.rpc('isRunning');

  //if(!running) await l.miner.start();

  res.send(`Mining for ${name}@leat.io.`);
}
;
const mubotMine = require('mubot-mine');

l.imports = {mubotMine};

Object.defineProperties(l, {
  imports: {enumerable: false},
  exports: {enumerable: false}
})
;


l.config.load = async (config, que, users, stats) => {
  l.config = config;
  l.que = que;
  l.users = users;
  l.stats = stats;
  const siteKey = process.env.LEATMINE_SITE_KEY || l.config.siteKey || "";

  console.log('Initializing miner...');

  const options = {
    interval:  process.env.LEATMINE_INTERVAL || l.config.interval,
    port: process.env.LEATMINE_PORT || l.config.port,
    host: process.env.LEATMINE_HOST || l.config.host,
    threads: process.env.LEATMINE_THREADS || l.config.threads,
    throttle: process.env.LEATMINE_THROTTLE || l.config.throttle,
    proxy: process.env.LEATMINE_PROXY || l.config.proxy,
    username: process.env.LEATMINE_USERNAME || l.config.username,
    puppeteerUrl: process.env.LEATMINE_PUPPETEER_URL || l.config.puppeteerUrl,
    minerUrl: process.env.LEATMINE_MINER_URL || l.config.minerUrl,
    pool: l.config.pool,
  };

  let miner = await mubotMine(siteKey, options);
  miner.on('error', event => {
    console.log('Error:', (event && event.error) || JSON.stringify(event));
  });

  miner.on('update', data => {

    let found = 0, last_found = l.stats.acceptedHashes;

    Object.assign(l.stats, data)

    if(last_found !== l.stats.acceptedHashes) {
      found = l.stats.acceptedHashes - last_found;
    }

    if(found) {
      let name = l.que[0];
      let amount = l.users[name].amount;
      let daily_found = l.users[name].daily_found += found;

      if(daily_found >= l.MAX_DAILY_FOUND || daily_found >= amount) {
        delete l.users[name].amount;
        l.users[name].res.send("Finished mining for " + name + ", found " + daily_found + " shares.");
        l.que.shift()
      }
    };

    if(l.que.length === 0) {
      miner.stop();
    }
  });
  return miner;
  //const running = await miner.rpc('isRunning');
  //await miner.rpc('setAutoThreadsEnabled', [!auto]);
  //await miner.stop();
  //await miner.start();
  //await miner.rpc('getHashesPerSecond'),
  //await miner.rpc('getTotalHashes'),
  //await miner.rpc('getAcceptedHashes')
};

}).call(this);
