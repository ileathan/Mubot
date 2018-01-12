
module.exports = bot =>{
  bot.respond(/dick length(?: (.+))?/i, res=>{
    let user = (res.match[1] || res.message.user.name).toLowerCase();
    res.send(user + "'s penis is " +parseInt(require('md5')(user, "7").slice(0,2), 16) + " inches long.")
  });
}
