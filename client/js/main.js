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
    
    var init = function() {
        var initColorList = function() {
            var colorList = ["black", "red", "purple", "blue", "aqua", "yellowgreen", "yellow", "brown", "gray"]
            var inner = '';
            for (var i = 0; i < colorList.length; ++i) {
                var color = colorList[i];
                inner += '<span style="display:none"><input type="radio" name="radio_ui_color" id="radio_color_' + colorList[i] + '" value="' + (i + 1) + '" onClick="clickColorUI(this.value)"></span>';
                inner += '<span onClick="document.getElementById(\'radio_color_' + colorList[i] + '\').click()"><img src="images/color/' + colorList[i] + '.png" id="img_color_' + colorList[i] + '"></span><br>';
            }
            var element = document.getElementById("colorUI");
            element.innerHTML = inner;
        }();
        var initThicknessList = function() {
            var inner = '';
            for (var i = 0; i < 4; ++i) {
                var num = (i + 1);
                inner += '<span style="display:none"><input type="radio" name="radio_ui_thickness" id="radio_thickness' + num + '" value="' + num + '" onClick="clickThicknessUI(this.value)"></span>';
                inner += '<document.getElementById(\'radio_thickness' + num +'\').click()"><img src="images/thickness' + num + '.png" id="img_thickness' + num + '"></span><br>';
            }
            var element = document.getElementById("thicknessUI");
            element.innerHTML = inner;
        }();
        var initOther = function() {
            var inner = '';
            inner += '<span style="display:none"><input type="button" name="button_ui_tool" id="button_new" value="1" onClick="clickNewSheet(this.value)"></span>';
            inner += '<span onClick="document.getElementById(\'button_new\').click()"><img src="images/new.png" id="img_new"></span><br> ';
            var element = document.getElementById("clearUI");
            element.innerHTML = inner;
        }();
    }();
    
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
    socketio.on("disconnect", function(object) {
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
    this.clickColorUI = function(num) {
        var colorList = ["black", "red", "purple", "blue", "aqua", "yellowgreen", "yellow", "brown", "gray"]
        var objimg = [];
        for (var i = 0; i < colorList.length; ++i) {
            objimg[i] = document.getElementById("img_color_" + colorList[i]);
            objimg[i].src = "images/color/" + colorList[i] +".png";
        }
        selectedColor = parseInt(num) - 1;
        objimg[selectedColor].src = "images/color/" + colorList[selectedColor] +"_on.png";

        //SelectToolAndColorFromIndex(selectedTool, selectedColor);
    }
};
