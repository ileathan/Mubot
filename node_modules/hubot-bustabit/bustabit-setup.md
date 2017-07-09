# When you log in to bustabit.com select the "AUTO" tab, then at the
# bottom right click the "autobet" button and select "custom"
# select everything inside the text area and delete it
# copy paste the entire contents of this text into that text field and click run
# If your hubot is running on your local machine all should be working
# YOU MUST CHANGE THE LINE BELLOW IF YOU RUN THE HUBOT ON A SERVER
SERVER = 'http://localhost:8080/'

# INIT
var bet = {};

# CHECK HUBOT SERVER FOR BET
function CheckBet () {
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", SERVER+'bet', false);
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      bet = JSON.parse(this.responseText);
      if (bet.size) {
        var t = parseFloat(bet.ratio*100).toFixed(0);
        console.log("t is " + t);
        engine.placeBet(bet.size*100, parseInt(bet.ratio*100), false);
      }
    }
  };
  xmlhttp.send();
}
 
# UPDATE THE HUBOT SERVER WITH INFORMATION
function Info(params) {
  var http = new XMLHttpRequest();
  http.open("POST", SERVER+'info', true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.send(params);
}

engine.on('game_crash', function(data) {
  if (engine.getEngine().playerInfo.leathan) {
    var win = false;
    if (engine.getEngine().playerInfo.leathan.stopped_at) { win = true } Info('game_crash='+data.game_crash+'&balance='+engine.getBalance()+'&win='+win)
  }
  CheckBet();
});

engine.on('cashed_out', function(resp) {
  if (resp.username == engine.getUsername()) {
    Info('win=true&balance='+engine.getBalance())
  }
});
