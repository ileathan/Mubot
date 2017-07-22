const request = require('request')
request({method:'GET', uri:`https://localhost/walletnotify/${process.argv[2]}/${process.argv[3]}`, rejectUnauthorized: false}, e => {
  if (e) throw new Error(e)
  else process.exit(0)
})

//const exec       = require('child_process').execSync
//const request    = require('request')
//const mongoose   = require('mongoose');
//mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost/bitmark-api', { useMongoClient: true })
//  .then(()=>{})
//  .catch((err) => console.error("[MONGOOSE ERROR] " + err));
// Set up database.
//const TransactionsSchema = new mongoose.Schema({
//  "date": { type: Date, default: Date.now },
//  "txid": String,
//  "amount": Number,
//  "address": String,
//  "confirms": Number,
//}, { id: false });
//// Beautiful hack to allow hotreloading when models already exists.
//const Transactions = mongoose.models.Transactions || mongoose.model('Transactions', TransactionsSchema)

//res = JSON.parse(exec(`bitmarkd getrawtransaction ${process.argv[2]} 1`).toString().replace(/(\n|\\)/g,''))

////for(i=0; i<res.vout.length; i++) {
////console.log("I:"+i+" " + res.vout[i].scriptPubKey.addresses[0])
////}

//transObj = {}
//transObj.txid = res.txid
//transObj.address = res.vout[1].scriptPubKey.addresses[0]
//transObj.amount = res.vout[1].value
//transObj.confirms = res.confirmations || 0

//Transactions.findOneAndUpdate({ txid: process.argv[2] }, { confirms: transObj.confirms })
//  .select('-_id -__v')
//  .exec((err, res) => {
//    if (err) process.exit(1);
//    else if (res) {
//      if (res.confirms < 1) { console.log("Exiting due to double call"); process.exit(0) }
//      else {
//        console.log("Found confirmation.");
//        request({method:'GET', uri:`https://localhost/walletnotify/${process.argv[2]}/${process.argv[3]}`, rejectUnauthorized: false}, e => {
//          if (e) throw new Error(e)
//          else proccess.exit(0)
//        })
//      }
//    } else {
//      Transactions.create(transObj, (err, transaction) => {
//        console.log("Found transfer, need confirmation.");
//      process.exit(0);
//      })
//    }
//  });
