var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../typings/socket.io/socket.io.d.ts" />
var User_1 = require("./User");
var Namespaces_1 = require("./Namespaces");
var events_1 = require('events');
exports.CONNECTION_EVENTS = ['connected', 'connection', 'connect', 'connect_error', 'connect_timeout',
    'error', 'reconnect', 'reconnect_error', 'disconnect', 'disconnected'
];
var Users = (function (_super) {
    __extends(Users, _super);
    function Users(namespace) {
        if (namespace === void 0) { namespace = "/"; }
        _super.call(this);
        this.users = [];
        this.takeId = function (request) {
            if (request._query !== undefined && request._query !== '' && request._query.id !== undefined) {
                return request._query.id;
            }
            else {
                var _id = request.headers.cookie.substr(request.headers.cookie.indexOf('sid=') + 4);
                if (_id.indexOf(';') !== undefined) {
                    _id = _id.substr(0, _id.indexOf(";"));
                }
                return _id;
            }
        };
        this.namespace = namespace;
        Namespaces_1.default.attach(this.namespace, this);
    }
    Users.of = function (namespace) {
        if (namespace === void 0) { namespace = "/"; }
        var _users = Namespaces_1.default.get(namespace);
        if (_users === undefined) {
            _users = new Users(namespace);
        }
        return _users;
    };
    Users.prototype.create = function (socket) {
        var _user = new User_1.default();
        _user.id = this.takeId(socket.request);
        _user.attach(socket);
        return _user;
    };
    Users.prototype.getById = function (id) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].id === id) {
                return this.users[i];
                break;
            }
        }
        return undefined;
    };
    Users.prototype.get = function (socket) {
        return this.getById(this.takeId(socket.request));
    };
    Users.prototype.list = function () {
        return this.users;
    };
    Users.prototype.size = function () {
        return this.users.length;
    };
    Users.prototype.push = function (_user) {
        this.users.push(_user);
    };
    Users.prototype.add = function (socket) {
        var _user = this.create(socket);
        this.push(_user);
        return _user;
    };
    Users.prototype.indexOf = function (user) {
        return this.users.findIndex(function (_user) {
            return user.id === _user.id;
        });
    };
    Users.prototype.remove = function (user) {
        user.detach();
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].id === user.id) {
                this.users.splice(i, 1);
                break;
            }
        }
    };
    Users.prototype.room = function (room) {
        var _usersConnectedToRoom = [];
        for (var i = 0; i < this.users.length; i++) {
            var _user = this.users[i];
            if (_user.rooms.indexOf(room) !== -1) {
                _usersConnectedToRoom.push(_user);
            }
        }
        return _usersConnectedToRoom;
    };
    Users.prototype.in = function (room) {
        return this.room(room);
    };
    Users.prototype.from = function (room) {
        return this.room(room);
    };
    Users.prototype.update = function (user) {
        this.emit('update', user);
    };
    Users.prototype.emitAll = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.users.forEach(function (_user) {
            _user.emit(args);
        });
    };
    Users.prototype.registerSocketEvents = function (currentUser) {
        var self = this;
        Object.keys(this._events).forEach(function (key) {
            if (exports.CONNECTION_EVENTS.indexOf(key) !== -1) {
                return;
            }
            var listener = key.slice(0);
            var socketWhichEmits = currentUser.socket;
            currentUser.socket.on(listener, function () {
                currentUser.socket = socketWhichEmits;
                var args = Array.prototype.slice.call(arguments);
                args.unshift(currentUser);
                args.unshift(listener);
                self.emit.apply(self, args);
            });
        });
    };
    return Users;
})(events_1.EventEmitter);
exports.default = Users;
