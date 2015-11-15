/**
 * @fileoverview サーバ側の実装。
 */
(function() {
    var express = require('express');
    var app = express();
    app.use(express.static(__dirname + '/build'));

    var http = require('http');
    var server = http.createServer(app);
    var io = require('socket.io').listen(server);

    var user = null;
    var participants = [];
    io.sockets.on('connection', function (socket) {
        socket.on('connected', function (name) {
            user = {name: name, id: socket.id};
            socket.emit('connected', user);
            socket.broadcast.emit('join', user);
            var msg = user.name + '(' + socket.id + ')' + 'が入室しました ';
            console.log(msg);
        });
        socket.on('disconnect', function () {
            if (user !== null) {
                var msg = user.name + '(' + socket.id + ')' + 'が退室しました ';
                console.log(msg);
                socket.broadcast.emit('disconnect', user);
            }
        });
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
            socket.emit('message', message);
        });
    });
    
    server.listen(process.env.PORT || 8080);
})();
