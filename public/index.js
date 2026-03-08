"use strict";
var pc;
var dc;
var socket;
var username = "ARTUR";
var target = "ROBOT";
var remote_description;
function disconnect() {
    var _a, _b;
    dc.close();
    pc.close();
    socket.close();
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
    (_b = document.getElementById("stopButton")) === null || _b === void 0 ? void 0 : _b.setAttribute("disabled", "true");
    log("disconnected");
}
function connect() {
    var _a, _b;
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.setAttribute("disabled", "true");
    (_b = document.getElementById("stopButton")) === null || _b === void 0 ? void 0 : _b.removeAttribute("disabled");
    socket.onmessage = function (e) {
        var sdp = JSON.parse(e.data);
        var sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                log("remote description received");
                log(remote_description);
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
        log("socket connected");
        register_peer(username);
        pc = create_pc();
        dc = create_data_channel();
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
                log(data);
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
function create_pc() {
    var pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    log("peer connection created");
    pc.oniceconnectionstatechange = function (e) {
        log(pc.iceConnectionState);
    };
    pc.onicecandidate = function (e) {
        log("onicecandidate");
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
            log("sending offer");
            log(data);
            log(data.SessionDescription.description);
            socket.send(JSON.stringify(data));
        }
    };
    pc.onnegotiationneeded = function (e) {
        log("onnegotiationneeded");
        pc.createOffer().then(function (d) {
            pc.setLocalDescription(d);
        }).catch(log);
    };
    return pc;
}
function create_data_channel() {
    var dc = pc.createDataChannel('dataChannel');
    log("data channel created");
    dc.onclose = function (e) {
        log('datachannel closed');
    };
    dc.onopen = function (e) {
        log('datachannel opened');
        window.setInterval(function () {
            if (dc.readyState === "open") {
                var num = Math.round(Math.random() * 1000000);
                log("<== " + num);
                dc.send("random number: " + num);
            }
        }, 6000);
    };
    dc.onmessage = function (e) {
        var s = e.data.toString();
        log("==> " + s);
    };
    return dc;
}
function log(msg) {
    var logArea = document.getElementById("messages");
    console.log(msg);
    if (logArea) {
        logArea.innerHTML += "<a class='row'>" + msg + "</a>";
        //logArea.innerText += msg + "\n";
    }
    else {
        console.log("log area is not found");
        console.log(logArea);
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
