/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/express-session/express-session.d.ts" />
var Session = function (app, options) {
    var cookieParser = require('cookie-parser');
    if (options === undefined) {
        options = {
            secret: "socket.io.users secret",
            resave: true,
            saveUninitialized: true
        };
    }
    var session = require("express-session")(options, cookieParser);
    app.use(cookieParser());
    app.use(session);
};
exports.default = Session;
