/// <reference path="../typings/socket.io/socket.io.d.ts" />
var User = (function () {
    function User() {
        this.sockets = [];
        this.rooms = [];
        this.remoteAddresses = [];
        this.store = {};
        this.get = function (key) {
            if (this.store.hasOwnProperty(key)) {
                return this.store[key];
            }
            else {
                return undefined;
            }
        };
    }
    User.prototype.attach = function (socket) {
        this.socket = socket;
        this.ip = this.socket.client.request.headers['x-forwarded-for'] || this.socket.client.conn.remoteAddress || this.socket.conn.remoteAddress || this.socket.request.connection.remoteAddress;
        if (this.remoteAddresses.indexOf(this.ip) === -1) {
            this.remoteAddresses.push(this.ip);
        }
        this.sockets.push(socket);
        this.socket.join(this.id.toString());
        if (this.rooms.length > 0) {
            for (var i = 0; i < this.rooms.length; i++) {
                this.socket.join(this.rooms[i]);
            }
        }
    };
    User.prototype.detachSocket = function (socket) {
        for (var i = 0; i < this.sockets.length; i++) {
            if (this.sockets[i].id === socket.id) {
                this.sockets.splice(i, 1);
                break;
            }
        }
    };
    User.prototype.detach = function () {
        this.leaveAll();
    };
    User.prototype.join = function (room) {
        var socketAlreadyInRoom = this.socket.rooms.indexOf(room) !== -1;
        if (this.rooms.indexOf(room) !== -1) {
            if (!socketAlreadyInRoom) {
                this.socket.join(room);
            }
        }
        else {
            for (var i = 0; i < this.sockets.length; i++) {
                this.sockets[i].join(room);
            }
            this.rooms.push(room);
        }
        return socketAlreadyInRoom;
    };
    User.prototype.leave = function (room) {
        var index = this.rooms.indexOf(room);
        if (index !== -1) {
            this.rooms.splice(index, 1);
            for (var i = 0; i < this.sockets.length; i++) {
                this.sockets[i].leave(room);
            }
        }
    };
    User.prototype.leaveAll = function () {
        if (this.rooms.length > 0) {
            for (var i = 0; i < this.rooms.length; i++) {
                this.leave(this.rooms[i]);
            }
        }
    };
    User.prototype.in = function () {
        var rooms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rooms[_i - 0] = arguments[_i];
        }
        var len = rooms.length;
        var ok = 0;
        for (var i = 0; i < len; i++) {
            if (this.rooms.indexOf(rooms[i]) !== -1) {
                ok++;
            }
            if (ok == len) {
                return true;
            }
        }
        return false;
    };
    User.prototype.belong = function () {
        var rooms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rooms[_i - 0] = arguments[_i];
        }
        return this.in.apply(this, rooms);
    };
    User.prototype.set = function (key, value, callback) {
        this.store[key] = value;
        if (callback !== undefined) {
            callback();
        }
    };
    User.prototype.toString = function () {
        return this.id.toString();
    };
    User.prototype.emit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.sockets.forEach(function (_socket) {
            _socket.emit.apply(_socket, args);
        });
    };
    User.prototype.to = function (room) {
        this.socket._rooms = this.socket._rooms || [];
        if (!~this.socket._rooms.indexOf(room))
            this.socket._rooms.push(room);
        return this.socket;
    };
    return User;
})();
exports.default = User;
