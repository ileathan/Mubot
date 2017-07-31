var Namespaces = (function () {
    function Namespaces() {
    }
    Namespaces.attach = function (namespace, socketUsersObj) {
        if (!Namespaces.socketUsersList.hasOwnProperty(namespace)) {
            socketUsersObj.namespace = namespace;
            Namespaces.socketUsersList[namespace] = socketUsersObj;
        }
    };
    Namespaces.get = function (namespace) {
        if (Namespaces.socketUsersList.hasOwnProperty(namespace)) {
            return Namespaces.socketUsersList[namespace];
        }
        return undefined;
    };
    Namespaces.socketUsersList = {};
    return Namespaces;
})();
exports.default = Namespaces;
