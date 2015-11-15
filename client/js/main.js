/**
 * @fileoverview メイン部分。
 */
window.onload = function() {
    
    var socketio = null;
    // heroku 上か確認したいがいい方法が見つからず
    if (typeof process === 'undefined') {
        socketio = io.connect('http://localhost:8080');
    } else {
        var port = 8080;
        socketio = io.connect('/', { port: port });
    }
    
    var user = {};
    var participantInfo = [];
    
    socketio.emit('connected', 'test');

    socketio.on('connected', function(object) {
        user.name = object.name;
        user.id = object.id;

        participantInfo[object.id] = user;
        updateParticipantList();
    });
    socketio.on('join', function(object) {
        var otheruser = {};
        otheruser.name = object.name;
        otheruser.id = object.id;

        participantInfo[object.id] = otheruser;
        updateParticipantList();
    });
    socketio.on('message', function(messageObject) {
        var message = messageObject.name + ': ' + messageObject.message;
        var element = document.getElementById("logArea");
        var str = element.value;
        element.value = (typeof str === 'undefined' || str.length == 0) ? 
            message : message + "\n" + str;
    });
    socket.on("disconnect", function(object) {
        delete participantInfo[object.id];
        updateParticipantList();
    });
    var updateParticipantList = function() {
        var element = document.getElementById("participantList");
        for (var i in element.options) {
            element.options[i] = null;
        }
        var count = 0;
        for (var i in participantInfo) {
            element.options[count++] = new Option(participantInfo[i].name);
        }
    }
    this.talk = function() {
        var element = document.getElementById("talkInput");
        var text = element.value;
        if (text.length !== 0) {
            socketio.emit("message", {name:user.name, message:text});
            element.value = "";
        }
    }
    this.talkKeyPress = function(code) {
        if(13 === code) {
            talk();
        }
    }
};
