"use strict";
var pc;
var dc;
var socket;
var username = "ARTUR";
var target = "ROBOT";
var remote_description;
var input_box = document.getElementById("inputBox");
//let camera_button = document.getElementById("cameraButton") as HTMLButtonElement;
//var user_input = document.getElementById("userName") as HTMLInputElement;
//var target_input = document.getElementById("targetName") as HTMLInputElement;
/* document.onload = (e) => {
    console.log("open page");
} */
function disconnect() {
    if (dc) {
        dc.close();
    }
    pc.close();
    socket.close();
    show_connection_buttons();
    log("disconnected");
}
function tryConnect() {
    var user_input = document.getElementById("userName");
    var target_input = document.getElementById("targetName");
    username = user_input.value;
    target = target_input.value;
    if (username.length > 0 && target.length > 0) {
        connect_socket(false);
        hide_connection_buttons();
    }
}
function tryConnectCamera() {
    var user_input = document.getElementById("userName");
    var target_input = document.getElementById("targetName");
    username = user_input.value;
    target = target_input.value;
    if (username.length > 0 && target.length > 0) {
        connect_socket(true);
        hide_connection_buttons();
    }
}
function show_connection_buttons() {
    var _a, _b, _c, _d, _e;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
    (_b = document.getElementById("cameraButton")) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden");
    (_c = document.getElementById("stopButton")) === null || _c === void 0 ? void 0 : _c.setAttribute("hidden", "true");
    //document.getElementById("move")?.setAttribute("disabled", "true");
    //document.getElementById("back")?.setAttribute("disabled", "true");
    //document.getElementById("right")?.setAttribute("disabled", "true");
    //document.getElementById("left")?.setAttribute("disabled", "true");
    //let user_input = document.getElementById("userName") as HTMLInputElement;
    //let target_input = document.getElementById("targetName") as HTMLInputElement;
    (_d = document.getElementById("userName")) === null || _d === void 0 ? void 0 : _d.removeAttribute("hidden");
    (_e = document.getElementById("targetName")) === null || _e === void 0 ? void 0 : _e.removeAttribute("hidden");
}
function hide_connection_buttons() {
    var _a, _b, _c, _d, _e;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "true");
    (_b = document.getElementById("cameraButton")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "true");
    (_c = document.getElementById("stopButton")) === null || _c === void 0 ? void 0 : _c.removeAttribute("hidden");
    (_d = document.getElementById("userName")) === null || _d === void 0 ? void 0 : _d.setAttribute("hidden", "true");
    (_e = document.getElementById("targetName")) === null || _e === void 0 ? void 0 : _e.setAttribute("hidden", "true");
    //user_input.setAttribute("hidden", "true");
    //target_input.removeAttribute("hidden");
    //document.getElementById("move")?.removeAttribute("disabled");
    //document.getElementById("back")?.removeAttribute("disabled");
    //document.getElementById("right")?.removeAttribute("disabled");
    //document.getElementById("left")?.removeAttribute("disabled");
}
function connect_socket(camera) {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    socket.onmessage = function (e) {
        var sdp = JSON.parse(e.data);
        var sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                setRemoteDescription();
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
        register_peer(username);
        pc = create_pc(camera);
        pc.oniceconnectionstatechange = function () {
            log(pc.iceConnectionState);
        };
        pc.onicecandidate = function (e) {
            if (e.candidate === null) {
                var sdp = JSON.stringify(pc.localDescription);
                var data = {
                    "SessionDescription": {
                        "sender": username,
                        "description": sdp,
                        "target": target,
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
    };
}
function register_peer(name) {
    var registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function create_pc(camera) {
    var pc = new RTCPeerConnection({
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
    });
    if (camera) {
        //pc.addTransceiver('audio', {'direction': 'recvonly'})
        pc.addTransceiver('video', { 'direction': 'recvonly' });
        //pc.addTransceiver('video', {'direction': 'recvonly'})
    }
    else {
        dc = create_data_channel(pc);
    }
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
                    "target": target,
                    "kind": "Offer"
                }
            };
            socket.send(JSON.stringify(data));
        }
    };
    pc.ontrack = function (e) {
        e.currentTarget;
        log("onTrack");
        console.log(e);
        console.log("type: " + e.type);
        console.log("track num: " + e.streams.length);
        console.log("track kind: " + e.track.kind);
        var el = document.getElementById("remoteVideos");
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
        //document.getElementById('remoteVideos')?.appendChild(el);
    };
    /* pc.ondatachannel = function (e) {
        log("on datachannel");
        dc = e.channel;
    
        dc.onclose = (e) => {
            log('datachannel closed');
        }

        dc.onopen = (e) => {
            log('datachannel opened');
            let interval = Math.round(Math.random() * 10000);
            window.setInterval(() => {
                if (dc.readyState === "open") {
                    let num = Math.round(Math.random() * 1000000000);
                    interval = Math.round(Math.random() * 10000);
                    log("<== " + num);
                    dc.send("" + num);
                }
            }, interval);
        }

        dc.onmessage = (e) => {
            let s: string = e.data.toString();
            log("==> " + s);
        }
    } */
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
        log('datachannel opened');
        var interval = Math.round(Math.random() * 10000);
        window.setInterval(function () {
            if (dc.readyState === "open") {
                var num = Math.round(Math.random() * 1000000000);
                interval = Math.round(Math.random() * 10000);
                log("<== " + num);
                dc.send("" + num);
            }
        }, interval);
    };
    dc.onmessage = function (e) {
        var s = e.data.toString();
        log("==> " + s);
    };
    return dc;
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
function setRemoteDescription() {
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
