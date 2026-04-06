"use strict";
//import {log} from "./util.js"; 
//import {iceServers} from "./iceservers.js";
var pc_camera;
var pc_data;
var dc;
var socket;
var username = "ARTUR";
var robot_target = "ROBOT";
var camera_target = "CAMERA";
var remote_description;
var input_box = document.getElementById("inputBox");
//let move_btn = document.getElementById("moveButton") as HTMLDivElement;
/* move_btn.ontouchend = (e) => {
    move("STOP");
}

move_btn.ontouchstart = (e) => {
    move("MOVE");
} */
document.addEventListener('DOMContentLoaded', function () {
    console.log("init loader");
    var move_button = document.getElementById('moveButton');
    if (move_button) {
        move_button.ontouchend = function (event) {
            move("STOP");
        };
        move_button.ontouchstart = function (event) {
            move("MOVE");
        };
    }
    else {
        console.error("Element with ID 'moveButton' not found.");
    }
    var back_button = document.getElementById('backButton');
    if (back_button) {
        back_button.ontouchend = function (event) {
            move("STOP");
        };
        back_button.ontouchstart = function (event) {
            move("BACK");
        };
    }
    else {
        console.error("Element with ID 'backButton' not found.");
    }
    var right_button = document.getElementById('rightButton');
    if (right_button) {
        right_button.ontouchend = function (event) {
            move("STOP");
        };
        right_button.ontouchstart = function (event) {
            move("RIGHT");
        };
    }
    else {
        console.error("Element with ID 'rightButton' not found.");
    }
    var left_button = document.getElementById('leftButton');
    if (left_button) {
        left_button.ontouchend = function (event) {
            move("STOP");
        };
        left_button.ontouchstart = function (event) {
            move("LEFT");
        };
    }
    else {
        console.error("Element with ID 'leftButton' not found.");
    }
});
function disconnect() {
    if (dc) {
        dc.close();
    }
    if (pc_data) {
        pc_data.close();
    }
    if (pc_camera) {
        pc_camera.close();
    }
    socket.close();
    show_connection_buttons();
    log("disconnected");
}
function tryConnect() {
    var user_input = document.getElementById("userName");
    var target_input = document.getElementById("robotName");
    username = user_input.value;
    robot_target = target_input.value;
    if (username.length > 0 && robot_target.length > 0) {
        connect_socket(false, true);
        hide_connection_buttons();
    }
}
function tryConnectCamera() {
    var user_input = document.getElementById("userName");
    var camera_input = document.getElementById("cameraName");
    username = user_input.value;
    camera_target = camera_input.value;
    if (username.length > 0 && camera_target.length > 0) {
        connect_socket(true, false);
        hide_connection_buttons();
    }
}
function show_connection_buttons() {
    var _a, _b, _c, _d, _e;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
    (_b = document.getElementById("cameraButton")) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden");
    (_c = document.getElementById("stopButton")) === null || _c === void 0 ? void 0 : _c.setAttribute("hidden", "true");
    (_d = document.getElementById("userName")) === null || _d === void 0 ? void 0 : _d.removeAttribute("hidden");
    (_e = document.getElementById("targetName")) === null || _e === void 0 ? void 0 : _e.removeAttribute("hidden");
}
function hide_connection_buttons() {
    var _a;
    //document.getElementById("startButton")?.setAttribute("hidden", "true");
    //document.getElementById("cameraButton")?.setAttribute("hidden", "true");
    (_a = document.getElementById("stopButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
    //document.getElementById("userName")?.setAttribute("hidden", "true");
    //document.getElementById("targetName")?.setAttribute("hidden", "true");
}
function connect_socket(camera, data) {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    socket.onmessage = function (e) {
        var sdp = JSON.parse(e.data);
        var sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                if (camera) {
                    setRemoteDescription(pc_camera);
                }
                else if (data) {
                    setRemoteDescription(pc_data);
                }
            }
            else {
                log("remote description is null");
            }
        }
        else {
            log("description is null");
        }
    };
    socket.onopen = function () {
        log("websocket connected");
        if (camera) {
            register_peer(username + "_CAMERA");
            pc_camera = create_camera_pc();
        }
        if (data) {
            register_peer(username + "_DATA");
            pc_data = create_data_pc();
        }
    };
}
function register_peer(name) {
    var registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function create_camera_pc() {
    var pc = new RTCPeerConnection(iceServers);
    pc.addTransceiver('video', { 'direction': 'recvonly' });
    pc.oniceconnectionstatechange = function (e) {
        log(pc.iceConnectionState);
    };
    pc.onicecandidate = function (e) {
        if (e.candidate === null) {
            var sdp = JSON.stringify(pc.localDescription);
            var data = {
                "SessionDescription": {
                    "sender": username,
                    "description": sdp,
                    "target": camera_target,
                    "kind": "Offer"
                }
            };
            socket.send(JSON.stringify(data));
        }
    };
    pc.ontrack = function (e) {
        e.currentTarget;
        log("track received");
        var el = document.getElementById("remoteVideos");
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
    };
    pc.onnegotiationneeded = function (e) {
        pc.createOffer().then(function (d) {
            pc.setLocalDescription(d);
        }).catch(log);
    };
    return pc;
}
function create_data_pc() {
    var pc = new RTCPeerConnection(iceServers);
    dc = create_data_channel(pc);
    pc.oniceconnectionstatechange = function (e) {
        log(pc.iceConnectionState);
    };
    pc.onicecandidate = function (e) {
        if (e.candidate === null) {
            var sdp = JSON.stringify(pc.localDescription);
            var data = {
                "SessionDescription": {
                    "sender": username,
                    "description": sdp,
                    "target": robot_target,
                    "kind": "Offer"
                }
            };
            socket.send(JSON.stringify(data));
        }
    };
    pc.onnegotiationneeded = function (e) {
        pc.createOffer().then(function (d) {
            pc.setLocalDescription(d);
        }).catch(log);
    };
    return pc;
}
function create_data_channel(pc) {
    var dc = pc.createDataChannel('dataChannel');
    log("datachannel created");
    dc.onclose = function (e) {
        log('datachannel closed');
    };
    dc.onopen = function (e) {
        log('datachannel is open');
        //let interval = Math.round(Math.random() * 10000);
        //window.setInterval(() => {
        //    if (dc.readyState === "open") {
        //        let num = Math.round(Math.random() * 1000000000);
        //        interval = Math.round(Math.random() * 10000);
        //        log("<== " + num);
        //        dc.send("" + num);
        //    }
        //}, interval);
    };
    dc.onmessage = function (e) {
        var s = e.data.toString();
        log("==> " + s);
    };
    return dc;
}
function setRemoteDescription(pc) {
    if (remote_description) {
        try {
            pc.setRemoteDescription(remote_description);
            log("remote description set");
        }
        catch (_a) {
            log("failed to set remote description");
        }
    }
    else {
        log("remote description is not set");
    }
}
function move(dir) {
    if (dc.readyState == "open") {
        log("<== " + dir);
        dc.send(dir);
    }
}
function log(msg) {
    var logArea = document.getElementById("messages");
    var node_num = logArea.childElementCount;
    console.log(msg);
    if (logArea) {
        var a = document.createElement("a");
        logArea.insertBefore(a, logArea.firstElementChild);
        a.classList.add("row");
        a.textContent = msg;
    }
    else {
        console.log("log area is not found");
    }
    if (node_num >= 6) {
        for (var i = 6; i < node_num; i++) {
            logArea.children[i].remove();
        }
    }
}
var iceServers = {
    "iceServers": [
        {
            "urls": [
                "stun:fr-turn8.xirsys.com",
            ]
        },
        {
            "urls": [
                "stun:stun.l.google.com:19302"
            ]
        },
        {
            "username": "xrlEivlkdTCQvwPYbCRHDur872L9CNM7DlbAya3tEhbBcn7zMgFFN8q43pP_2v-4AAAAAGmxwT1nd296ZHlr",
            "credential": "d05d03e4-1d7f-11f1-b1bb-be96737d4d7e",
            "urls": [
                "turn:fr-turn8.xirsys.com:80?transport=udp",
                "turn:fr-turn8.xirsys.com:3478?transport=udp",
                "turn:fr-turn8.xirsys.com:80?transport=tcp",
                "turn:fr-turn8.xirsys.com:3478?transport=tcp",
                "turns:fr-turn8.xirsys.com:443?transport=tcp",
                "turns:fr-turn8.xirsys.com:5349?transport=tcp"
            ]
        }
    ]
};
