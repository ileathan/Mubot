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

  //const running = await miner.rpc('isRunning');
  //await miner.rpc('setAutoThreadsEnabled', [!auto]);
  //await miner.stop();
  //await miner.start();
  //await miner.rpc('getHashesPerSecond'),
  //await miner.rpc('getTotalHashes'),
  //await miner.rpc('getAcceptedHashes')
})();
