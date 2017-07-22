pubkey1='02e20a05e17c62c861130acde75175143ae5586e80925a72a6ff1394cb25b23d3a'
pubkey2='021aa8bcd62e7210167b908367a9a67bc652ec4c9f3c849a76387c512c23eb105e'

exec = require('child_process').execSync


res = JSON.parse(exec(`bitmarkd createmultisig 2 '["${pubkey1}", "${pubkey2}"]'`).toString())

address = res.address;
redeemScript = res.redeemScript;



console.log([address, redeemScript])
