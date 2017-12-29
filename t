var http = require('http');

http.createServer(function(request, respone){
  respone.writeHead(200, {'Content-type':'text/plan'});
  response.write('Hello Node JS Server Response');
  response.end( );

}).listen(8080);
