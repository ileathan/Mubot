// Description:
//   Brings socket.io to mubot!
//
// Commands:
//   None.
//
// Author:
//   leathan
//
module.exports = bot => {
  const io = bot.io.of('/chat');
  io.on("connection", (socket) => {
    socket.on("chat message", data => io.emit("chat message", data))
  })
}
