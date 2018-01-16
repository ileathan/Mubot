// Description:
//   "Accepts POST data and broadcasts it"
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   None
//
// URLs:
//   POST /mubot/say
//     message = <message>
//     room = <room>
//     type = <type>
//
//   curl -X POST http://localhost:8080/mubot/say -d message=lala -d room='//dev'
//
// Author:
//   insom
//   luxflux
//
(function() {
  module.exports = bot => {
    bot.router.post("/mubot/say", (req, res) => {
      var body, envelope, message, room;
      body = req.body;
      room = body.room;
      message = body.message;
      bot.logger.info("Message '" + message + "' received for room " + room);
      envelope = bot.brain.userForId('broadcast');
      envelope.user = {};
      if(room) {
        envelope.user.room = envelope.room = room
      }
      envelope.user.type = body.type || 'groupchat';
      if(message) {
        bot.send(envelope, message)
      }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Thanks\n')
    })
  }
}).call(this);
