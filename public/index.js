"use strict";
//import {log} from "./util.js"; 
//import {iceServers} from "./iceservers.js";
var pc1;
var pc2;
var dc;
var socket;
var username1 = "ARTUR1";
var username2 = "ARTUR2";
var target = "ROBOT";
var cameraTarget = "CAMERA";
var remote_description;
var input_box = document.getElementById("inputBox");
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
    if (pc1) {
        pc1.close();
    }
    if (pc2) {
        pc2.close();
    }
    socket.close();
    show_connection_buttons();
    log("disconnected");
}
function tryConnect() {
    var user_input = document.getElementById("userName1");
    var target_input = document.getElementById("targetName");
    username1 = user_input.value;
    target = target_input.value;
    if (username1.length > 0 && target.length > 0) {
        connect_socket(false);
        //hide_connection_buttons()
        showDisconnect();
    }
}
function tryConnectCamera() {
    var user_input = document.getElementById("userName2");
    var camera_input = document.getElementById("cameraName");
    username2 = user_input.value;
    cameraTarget = camera_input.value;
    if (username2.length > 0 && cameraTarget.length > 0) {
        connect_socket(true);
        showDisconnect();
        //hide_connection_buttons()
    }
}
/* function tryConnectDual() {
    let user_input = document.getElementById("userName") as HTMLInputElement;
    let user_input2 = document.getElementById("userName2") as HTMLInputElement;
    let target_input = document.getElementById("targetName") as HTMLInputElement;
    let camera_input = document.getElementById("cameraName") as HTMLInputElement;
    username1 = user_input.value;
    username2 = user_input2.value;
    target = target_input.value;

    if (username1.length > 0 && username2.length > 0 && target.length > 0) {
        connect_socket(true);
        hide_connection_buttons()
    }
} */
function showDisconnect() {
    var _a;
    (_a = document.getElementById("stopButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
}
function show_connection_buttons() {
    var _a, _b, _c, _d, _e, _f, _g;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
    (_b = document.getElementById("cameraButton")) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden");
    (_c = document.getElementById("stopButton")) === null || _c === void 0 ? void 0 : _c.setAttribute("hidden", "true");
    (_d = document.getElementById("userName1")) === null || _d === void 0 ? void 0 : _d.removeAttribute("hidden");
    (_e = document.getElementById("userName2")) === null || _e === void 0 ? void 0 : _e.removeAttribute("hidden");
    (_f = document.getElementById("targetName")) === null || _f === void 0 ? void 0 : _f.removeAttribute("hidden");
    (_g = document.getElementById("cameraName")) === null || _g === void 0 ? void 0 : _g.removeAttribute("hidden");
}
function hide_connection_buttons() {
    var _a, _b, _c, _d, _e, _f, _g;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "true");
    (_b = document.getElementById("cameraButton")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "true");
    (_c = document.getElementById("stopButton")) === null || _c === void 0 ? void 0 : _c.removeAttribute("hidden");
    (_d = document.getElementById("userName1")) === null || _d === void 0 ? void 0 : _d.setAttribute("hidden", "true");
    (_e = document.getElementById("userName2")) === null || _e === void 0 ? void 0 : _e.setAttribute("hidden", "true");
    (_f = document.getElementById("targetName")) === null || _f === void 0 ? void 0 : _f.setAttribute("hidden", "true");
    (_g = document.getElementById("cameraName")) === null || _g === void 0 ? void 0 : _g.setAttribute("hidden", "true");
}
function connect_socket(camera) {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    var user;
    var tg;
    if (camera) {
        user = username2;
        tg = cameraTarget;
    }
    else {
        user = username1;
        tg = target;
    }
    socket.onmessage = function (e) {
        var sdp = JSON.parse(e.data);
        var sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                setRemoteDescription(pc1);
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
        register_peer(user);
        if (camera) {
            pc2 = create_pc(camera);
            pc2.addTransceiver('video', { 'direction': 'recvonly' });
            pc2.oniceconnectionstatechange = function () {
                log(pc2.iceConnectionState);
            };
            pc2.onicecandidate = function (e) {
                if (e.candidate === null) {
                    var sdp = JSON.stringify(pc2.localDescription);
                    var data = {
                        "SessionDescription": {
                            "sender": user,
                            "description": sdp,
                            "target": tg,
                            "kind": "Offer"
                        }
                    };
                    socket.send(JSON.stringify(data));
                }
            };
            pc2.onnegotiationneeded = function (e) {
                pc2.createOffer().then(function (d) {
                    pc2.setLocalDescription(d);
                }).catch(log);
            };
        }
        else {
            pc1 = create_pc(camera);
            dc = create_data_channel(pc1);
            pc1.oniceconnectionstatechange = function () {
                log(pc1.iceConnectionState);
            };
            pc1.onicecandidate = function (e) {
                if (e.candidate === null) {
                    var sdp = JSON.stringify(pc1.localDescription);
                    var data = {
                        "SessionDescription": {
                            "sender": user,
                            "description": sdp,
                            "target": tg,
                            "kind": "Offer"
                        }
                    };
                    socket.send(JSON.stringify(data));
                }
            };
            pc1.onnegotiationneeded = function (e) {
                pc1.createOffer().then(function (d) {
                    pc1.setLocalDescription(d);
                }).catch(log);
            };
        }
    };
}
function register_peer(name) {
    var registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function create_pc(camera) {
    var pc = new RTCPeerConnection(iceServers);
    pc.oniceconnectionstatechange = function (e) {
        log(pc.iceConnectionState);
    };
    pc.onicecandidate = function (e) {
        if (e.candidate === null) {
            var sdp = JSON.stringify(pc.localDescription);
            var data = {
                "SessionDescription": {
                    "sender": username1,
                    "description": sdp,
                    "target": target,
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
    //dc.onopen = (e) => {
    //    log('datachannel is open');
    //}
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
