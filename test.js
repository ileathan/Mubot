var io = require('socket.io-client');
 
 
var startTime;
var net_game_id;

function connect2Server(){
    var socket = io.connect('https://gs.bustabit.com',
        {reconnect: true,
        reconnection: true,
        autoConnect: true}); //443
 
    console.log('connecting to gameserver')
 
    var ott=null;
    var info = ott ? { ott: "" + ott } : {}
    socket.emit('join', info, function(err, data) {
        if (err) console.error('[ERROR] onConnect:', err)
        else socket.emit('join', data)
    });
 
    // Add a connect listener
    socket.on('connect', function (socket) {
        console.log('Connected! ' + socket)
    });
 
    socket.on('reconnect', function (socket) {
        console.log('Reconnecting! ' + socket)
    });
 
 
   socket.on('disconnect', function(message) {
        console.log("disconnected from gameserver " + message);
        //connect2Server()
        //socket.connect()
        socket.connect()
    });
 
    socket.on('ping', function() {
        console.log('ping pong!')
        socket.emit("pong")
    });
 
    socket.on('game_starting', function(game) {
          startTime = new Date(Date.now() + 5000)
          next_game_id = game.game_id;
          console.log(next_game_id)
    });
 
    socket.on('game_tick', function(data) {
        if (startTime == 0) startTime = Date.now() -1
        var t = 6e-5
        number = Math.pow(Math.E, t * data).toFixed(2)
 
        console.log(number)
    });
 
    socket.on('game_crash', function(data){
          crash = (data.game_crash / 100)
          if (crash == 0) crash = '0'
          else crash = crash.toFixed(2)
          cfloat = parseFloat(crash)
          console.log(crash)
    });
}
 
connect2Server();
