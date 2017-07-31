var Users_1 = require("./Users");
function Middleware() {
    return function (socket, next) {
        var users = Users_1.default.of(socket.nsp.name);
        var user = users.get(socket);
        if (user !== undefined) {
            user.attach(socket);
        }
        else {
            user = users.add(socket);
            users.emit('connected', user);
        }
        users.emit('connection', user);
        socket.on('disconnect', function () {
            user.detachSocket(socket);
            if (user.sockets.length === 0) {
                users.remove(user);
                users.emit('disconnected', user);
            }
        });
        users.registerSocketEvents(user);
        next();
    };
}
;
exports.default = Middleware;
