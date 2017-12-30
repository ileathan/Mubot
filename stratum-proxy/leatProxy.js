const fs = require('fs');
const config = {
  host: 'pool.supportxmr.com',
  port: 3333,
  key: fs.readFileSync('/Users/leathan/Mubot/node_modules/imubot-server/credentials/privkey.pem'),
  cert: fs.readFileSync('/Users/leathan/Mubot/node_modules/imubot-server/credentials/cert.pem')
};

const leatProxy = new (require('leat-stratum-proxy'))(config);

