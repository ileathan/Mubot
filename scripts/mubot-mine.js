<<<<<<< HEAD
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
}
;
module.exports = l.exports
;
l.idToLeatName = id => Object.keys(bot.leat.users).filter(_=>Object.values(bot.leat.users[_].altIds||[]).includes(id)).pop()
;
l.viewStats = res => {
  res.send(JSON.stringify(l.stats).replace(/"/g, '').slice(1, -1))
}
;
l.start = async (res) => {
  let id  = res.message.user.id,
      name = l.idToLeatName(id),
      amount = res.match[1] || 1
  ;
  if(!name) {
    return res.send(
      "Can only mine for verified users, on leat.io type: ```/" + server + " "
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
  } else {
    l.users[name] = { daily_found: 0, amount, res}
  }
  l.que.push(name);
  if(!l.miner) l.miner = await l.config.load(l.que, l.users)

  const running = await l.miner.rpc('isRunning');

  if(!running) await l.miner.start();

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


l.config.load = async (que, users) => {
  l.que = que;
  l.users = users;
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

    delete data.autoThreads;

    let found = 0, last_found = l.stats.acceptedHashes;

    Object.assign(l.stats, data)

    if(last_found !== l.stats.acceptedHashes) {
      found = l.stats.acceptedHashes - last_found;
    }

    if(found) {
      let name = l.que[0];
      let amount = l.users[name].amount;
      let daily_found = l.users[name].daily_found += found;
      
      if(daily_found > l.MAX_DAILY_FOUND || daily_found > amount) {
        l.users[name].res.send("Finished mining for " + name + ", found " + daily_found + " shares.");
        l.que.shift()
      }
    };

    if(l.que.length === 0) {
      miner.stop();
    }
  });
  return miner;
=======
const log = console.log;
const mubotMine = require('mubot-mine');
const defaults = require('../node_modules/leat-mine/config/defaults');
const readline = require('readline');

(async () => {
  const siteKey = process.env.LEATMINE_SITE_KEY || defaults.siteKey || "";

  log('Initializing...');

  const options = {
    interval:  process.env.LEATMINE_INTERVAL || defaults.interval,
    port: process.env.LEATMINE_PORT || defaults.port,
    host: process.env.LEATMINE_HOST || defaults.host,
    threads: process.env.LEATMINE_THREADS || defaults.threads,
    throttle: process.env.LEATMINE_THROTTLE || defaults.throttle,
    proxy: process.env.LEATMINE_PROXY || defaults.proxy,
    username: process.env.LEATMINE_USERNAME || defaults.username,
    puppeteerUrl: process.env.LEATMINE_PUPPETEER_URL || defaults.puppeteerUrl,
    minerUrl: process.env.LEATMINE_MINER_URL || defaults.minerUrl,
    pool: defaults.pool,
  };

  const miner = await mubotMine(siteKey, options);
  miner.on('error', event => {
    console.log('Error:', (event && event.error) || JSON.stringify(event));
    process.exit(1);
  });
  await miner.start();

  miner.on('update', data => {
    data.running = true;
    log(data);
  });

>>>>>>> 38ba4631804437dec45c8c48256d340dc04531dc
  //const running = await miner.rpc('isRunning');
  //await miner.rpc('setAutoThreadsEnabled', [!auto]);
  //await miner.stop();
  //await miner.start();
  //await miner.rpc('getHashesPerSecond'),
  //await miner.rpc('getTotalHashes'),
  //await miner.rpc('getAcceptedHashes')
<<<<<<< HEAD
};

}).call(this);
=======
})();
>>>>>>> 38ba4631804437dec45c8c48256d340dc04531dc
