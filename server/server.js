/**
 * @fileoverview サーバ側の実装。
 */
(function() {
    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    app.use(express.static(__dirname + '/build'));
    app.use(bodyParser.urlencoded({extended: true}));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/build/index.html');
    });
    var userInputName = '';
    app.post('/chat', function (req, res) {
        userInputName = req.body.nameInput;
        if (userInputName.length === 0) {
            userInputName = '名なし';
        }
        res.sendFile(__dirname + '/build/main.html');
    });
    var http = require('http');
    var server = http.createServer(app);
    var io = require('socket.io').listen(server);

    var user = null;
    var participants = [];
    var canvasDataUrl = '';
    io.sockets.on('connection', function (socket) {
        socket.on('connected', function () {
            user = {name: userInputName, id: socket.id, canvasDataUrl: canvasDataUrl};         
            socket.emit('connected', user);
            // 既存の参加者情報を送る
            for (var i in participants) {
                 socket.emit('join', participants[i]);
            }
            participants[socket.id] = user;
            socket.broadcast.emit('join', user);
            var msg = user.name + '(' + socket.id + ')' + 'が入室しました ';
            console.log(msg);
            socket.emit('message', {name: 'システム', message: 'ようこそ。' + userInputName + 'さん。'});
            socket.broadcast.emit('message', {name: 'システム', message: user.name + 'さんが入室しました。'});
        });
        socket.on('disconnect', function () {
            if (user !== null) {
                var msg = user.name + '(' + socket.id + ')' + 'が退室しました ';
                console.log(msg);
                delete participants[socket.id];
                socket.broadcast.emit('message', {name: 'システム', message: user.name + 'さんが退室しました。'});
            }
        });
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
            socket.emit('message', message);
        });
        socket.on('pointstart', function (object) {
            socket.broadcast.emit('pointstart', object);
            socket.emit('pointstart', object);
        });
        socket.on('pointmove', function (object) {
            socket.broadcast.emit('pointmove', object);
            socket.emit('pointmove', object);
        });
        socket.on('pointend', function (object) {
            socket.broadcast.emit('pointend', object);
            socket.emit('pointend', object);
        });
        socket.on('canvas', function (dataUrl) {
            canvasDataUrl = dataUrl;
        });
        socket.on('clearcanvas', function (object) {
            socket.broadcast.emit('clearcanvas', object);
            socket.emit('clearcanvas', object);
        });
    });
    
    server.listen(process.env.PORT || 8080);
})();
