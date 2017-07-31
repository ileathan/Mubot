module.exports = bot => {
  // Socket.io comes to Mubot!
  const io = bot.io;
  io.on("connection", (socket) => {
    socket.on("chat message", data => io.emit("chat message", data))
  })
}
