/**
 * @fileoverview メイン部分。
 */
window.onload = function() {
    
    var socketio = null;
    socketio = io.connect('http://localhost:8080');
    //var port = 8080;
    //socketio = io.connect('/', { port: port });
    
    var user = {};
    var participantInfo = [];
    var selectedUI = {
        tool: 0,      // 選択中のツール 0: ペン 1: 消しゴム
        thickness: 0, // 選択中の太さ 0 ～ 3
        color: 0      // 選択中の色
    };

    // 接続通知（これでPOSTされた名前などが返却される）
    socketio.emit('connected', {});
    
    var init = function() {
        var toolList = function() {
            var toolList = ['pen', 'eraser']
            var inner = '';
            for (var i = 0; i < toolList.length; ++i) {
                var num = (i + 1);
                inner += '<span style="display:none"><input type="radio" name="radio_ui_tool" id="radio_' + toolList[i] + '" value="' + num + '" onClick="clickToolsUI(this.value)"></span>';
                inner += '<span onClick="document.getElementById(\'radio_' + toolList[i] + '\').click()"><img src="images/' + toolList[i] + '.png" id="img_' + toolList[i] + '"></span><br> ';
            }
            var element = document.getElementById('toolUI');
            element.innerHTML = inner;
        }();
        var initColorList = function() {
            var colorList = ['black', 'red', 'purple', 'blue', 'aqua', 'yellowgreen', 'yellow', 'brown', 'gray']
            var inner = '';
            for (var i = 0; i < colorList.length; ++i) {
                var color = colorList[i];
                inner += '<span style="display:none"><input type="radio" name="radio_ui_color" id="radio_color_' + color + '" value="' + (i + 1) + '" onClick="clickColorUI(this.value)"></span>';
                inner += '<span onClick="document.getElementById(\'radio_color_' + color + '\').click()"><img src="images/color/' + color + '.png" id="img_color_' + color + '"></span><br>';
            }
            var element = document.getElementById('colorUI');
            element.innerHTML = inner;
        }();
        var initThicknessList = function() {
            var inner = '';
            for (var i = 0; i < 4; ++i) {
                var num = (i + 1);
                inner += '<span style="display:none"><input type="radio" name="radio_ui_thickness" id="radio_thickness' + num + '" value="' + num + '" onClick="clickThicknessUI(this.value)"></span>';
                inner += '<span onClick="document.getElementById(\'radio_thickness' + num +'\').click()"><img src="images/thickness' + num + '.png" id="img_thickness' + num + '"></span><br>';
            }
            var element = document.getElementById('thicknessUI');
            element.innerHTML = inner;
        }();
        var initOther = function() {
            var inner = '';
            inner += '<span style="display:none"><input type="button" name="button_ui_tool" id="button_new" value="1" onClick="clickNewSheet(this.value)"></span>';
            inner += '<span onClick="document.getElementById(\'button_new\').click()"><img src="images/new.png" id="img_new"></span><br> ';
            var element = document.getElementById('clearUI');
            element.innerHTML = inner;
        }();
    }();
    
    //-------------------------------------------------------------------------
    // tmlib
    var tmCanvasElement = tm.dom.Element('#canvas');
    var tmCanvas = tm.graphics.Canvas(tmCanvasElement.element);
    var input = null;
    tmCanvasElement.event.pointstart(function(e) {
        input = {x: e.pointX, y: e.pointY};
        e.stop();
        socketio.emit('pointstart', {id: user.id, ui: selectedUI, pointX: input.x, pointY: input.y});
    });
    tmCanvasElement.event.pointmove(function(e) {
        if (input === null) return ;
        input = {x: e.pointX, y: e.pointY};
        e.stop();
        socketio.emit('pointmove', {id: user.id, ui: selectedUI, pointX: input.x, pointY: input.y});
    });
    tmCanvasElement.event.pointend(function(e) {
        input = null;
        e.stop();
        socketio.emit('pointend', {id: user.id});
        
        // Canvas の内容を丸々送信する
        var canvas = document.getElementById('canvas');
        var canvasDataUrl = canvas.toDataURL();
        socketio.emit('canvas', canvasDataUrl);
    });
    tmCanvasElement.event.hover(function(e) {
        input = null;
        e.stop();
    });
    //-------------------------------------------------------------------------
    var checkDrawInfo = function(id) {
        if (false === (id in participantInfo)) {
            return false;
        }
        if ('undefined' === typeof participantInfo[id].drawInfo) {
            return false;
        }
        return true;
    }
    // socket.io
    socketio.on('connected', function(object) {
        user.name = object.name;
        user.id = object.id;
        user.drawInfo = {pointX: null, pointY: null};
        // キャンバスの内容を復元
        {
            var canvas = document.getElementById('canvas');
            var context = canvas.getContext('2d');
            var imageObj = new Image();
            imageObj.onload = function() {
                context.drawImage(this, 0, 0);
            };
            //console.log(object.canvasDataUrl);
            imageObj.src = object.canvasDataUrl;
        }
        
        participantInfo[object.id] = user;
        updateParticipantList();
    });
    socketio.on('join', function(object) {
        var otheruser = {};
        otheruser.name = object.name;
        otheruser.id = object.id;
        otheruser.drawInfo = {pointX: null, pointY: null};
        participantInfo[object.id] = otheruser;
        updateParticipantList();
    });
    socketio.on('leave', function(object) {
        delete participantInfo[object.id];
        updateParticipantList();
    });
    socketio.on('message', function(messageObject) {
        var message = messageObject.name + ': ' + messageObject.message;
        var element = document.getElementById('logArea');
        var str = element.value;
        element.value = (typeof str === 'undefined' || str.length == 0) ? 
            message : message + '\n' + str;
    });
    socketio.on('pointstart', function(object) {
        if (false === checkDrawInfo(object.id)) {
            return;
        }
        participantInfo[object.id].drawInfo.pointX = object.pointX;
        participantInfo[object.id].drawInfo.pointY = object.pointY;
    });
    socketio.on('pointmove', function(object) {
        if (false === checkDrawInfo(object.id)) {
            return;
        }
        var colorList = ['black', 'red', 'purple', 'blue', 'aqua', 'yellowgreen', 'yellow', 'brown', 'gray']
        tmCanvas.strokeStyle = (object.ui.tool == 0) ? colorList[object.ui.color] : 'white';
        // 消しゴムは太さを二倍に
        var thickness = (2 + (object.ui.thickness * 2)) * ((object.ui.tool == 0) ? 1 : 2);
        tmCanvas.setLineStyle(thickness, "round", "round", 10);
        tmCanvas.drawLine(
          participantInfo[object.id].drawInfo.pointX, 
          participantInfo[object.id].drawInfo.pointY,
          object.pointX, object.pointY);
        participantInfo[object.id].drawInfo.pointX = object.pointX;
        participantInfo[object.id].drawInfo.pointY = object.pointY;
    });
    socketio.on('pointend', function(object) {
        if (false === checkDrawInfo(object.id)) {
            return;
        }
        participantInfo[object.id].drawInfo.pointX = null;
        participantInfo[object.id].drawInfo.pointY = null;
    });
    socketio.on('clearcanvas', function(object) {
        tmCanvas.clear();
    });
    
    var updateParticipantList = function() {
        var element = document.getElementById('participantList');
        for (var i in element.options) {
            element.options[i] = null;
        }
        var count = 0;
        for (var i in participantInfo) {
            element.options[count++] = new Option(participantInfo[i].name);
        }
    }
    
    this.talk = function() {
        var element = document.getElementById('talkInput');
        var text = element.value;
        if (text.length !== 0) {
            socketio.emit('message', {name:user.name, message:text});
            element.value = '';
        }
    }
    this.talkKeyPress = function(code) {
        if(13 === code) {
            talk();
        }
    }
    this.clickToolsUI = function(val) {
        var objimg = [];
        var toolList = ['pen', 'eraser']
        for (var i = 0; i < toolList.length; ++i) {
            objimg[i] = document.getElementById('img_' + toolList[i]);
            objimg[i].src = 'images/' + toolList[i] +'.png';
        }
        selectedUI.tool = parseInt(val) - 1;
        objimg[selectedUI.tool].src = 'images/' + toolList[selectedUI.tool] +'_on.png';
    }
    this.clickNewSheet = function(val) {
        socketio.emit('clearcanvas', {});
    }
    this.clickThicknessUI = function(val) {
        var objimg = [];
        for (var i = 0; i < 4; ++i) {
            var num = i + 1;
            objimg[i] = document.getElementById('img_thickness' + num);
            objimg[i].src = 'images/thickness' + num +'.png';
        }
        selectedUI.thickness = parseInt(val) - 1;
        objimg[selectedUI.thickness].src = 'images/thickness' + val +'_on.png';
    }
    this.clickColorUI = function(val) {
        var colorList = ['black', 'red', 'purple', 'blue', 'aqua', 'yellowgreen', 'yellow', 'brown', 'gray']
        var objimg = [];
        for (var i = 0; i < colorList.length; ++i) {
            objimg[i] = document.getElementById('img_color_' + colorList[i]);
            objimg[i].src = 'images/color/' + colorList[i] +'.png';
        }
        selectedUI.color = parseInt(val) - 1;
        objimg[selectedUI.color].src = 'images/color/' + colorList[selectedUI.color] +'_on.png';
    }
    this.clickToolsUI(1);
    this.clickThicknessUI(1);
    this.clickColorUI(1);
};
