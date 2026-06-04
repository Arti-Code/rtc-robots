"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let pc_camera;
let pc_data;
let dc;
let socket;
let username = "ARTURO";
let robot_target = "TEST";
let start_button;
let socked_opened = false;
let timer = 0.0;
let command = "test command";
document.addEventListener('DOMContentLoaded', () => {
    console.log("init loader");
    const move_button = document.getElementById('moveButton');
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
    const back_button = document.getElementById('backButton');
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
    const right_button = document.getElementById('rightButton');
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
    const left_button = document.getElementById('leftButton');
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
function hide_socket_div() {
    let websocket_section = document.getElementById("websocket_section");
    if (websocket_section) {
        websocket_section.hidden = true;
    }
}
function show_socket_div() {
    let websocket_section = document.getElementById("websocket_section");
    if (websocket_section) {
        websocket_section.hidden = false;
    }
}
function show_rtc_div() {
    let rtc_section = document.getElementById("rtc_section");
    if (rtc_section) {
        rtc_section.hidden = false;
    }
}
function hide_rtc_div() {
    let rtc_section = document.getElementById("rtc_section");
    if (rtc_section) {
        rtc_section.hidden = true;
    }
}
function show_control() {
    let control_section = document.getElementById("control_section");
    if (control_section) {
        control_section.hidden = false;
    }
}
function hide_control() {
    let control_section = document.getElementById("control_section");
    if (control_section) {
        control_section.hidden = true;
    }
}
function show_disconnect() {
    let close_section = document.getElementById("close_control_div");
    if (close_section) {
        close_section.hidden = false;
    }
}
function hide_disconnect() {
    let close_section = document.getElementById("close_control_div");
    if (close_section) {
        close_section.hidden = true;
    }
}
function connectWebsocket() {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    //socket = new WebSocket("ws://127.0.0.1:8080");
    let user_input = document.getElementById("userName");
    username = user_input.value;
    socket.onmessage = (e) => {
        let msg = JSON.parse(e.data);
        if (msg.SessionDescription) {
            let sd = msg.SessionDescription.description;
            let conn_type = msg.SessionDescription.connection_type;
            if (sd) {
                let remote_description = JSON.parse(sd);
                if (remote_description) {
                    console.log("connection type: " + conn_type);
                    if (conn_type == "Video") {
                        setRemoteDescription(pc_camera, remote_description);
                    }
                    else if (conn_type == "Data") {
                        setRemoteDescription(pc_data, remote_description);
                    }
                }
                else {
                    console.log("remote description is null");
                }
            }
            else {
                console.log("description is null");
            }
        }
        else if (msg.PeerList) {
            let peerList = msg.PeerList;
            console.log("Peers online: " + peerList);
        }
        else {
            console.log("unknown message received: " + e.data);
        }
    };
    socket.onopen = () => {
        register_peer(socket, username);
        //get_peers_online(socket, username);
        socked_opened = true;
        hide_socket_div();
        show_rtc_div();
        console.log("Websocket connected");
    };
}
function disconnect_websocket() {
    if (socket) {
        socket.close();
    }
}
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
    disconnect_websocket();
    console.log("disconnected");
}
function connectRobot() {
    let target_input = document.getElementById("userName");
    robot_target = target_input.value;
    if (socked_opened) {
        create_pc()
            .then((data_pc) => {
            pc_data = data_pc;
            console.log("data peer connection created");
            setTimeout(() => {
                create_camera_pc()
                    .then((camera_pc) => {
                    pc_camera = camera_pc;
                    console.log("camera peer connection created");
                }).catch(error => {
                    console.error("Error creating camera peer connection:", error);
                });
            }, 3000);
        }).catch(error => {
            console.error("Error creating data peer connection:", error);
        });
        hide_rtc_div();
        show_control();
        show_disconnect();
    }
}
function disconnectRobot() {
    clean_terminal();
    hide_control();
    hide_rtc_div();
    disconnect();
    show_socket_div();
    hide_disconnect();
}
function register_peer(socket, name) {
    let registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function get_peers_online(socket, name) {
    let getPeerListMsg = { "GetPeerList": name };
    socket.send(JSON.stringify(getPeerListMsg));
}
function create_camera_pc() {
    return __awaiter(this, void 0, void 0, function* () {
        let pc = new RTCPeerConnection(iceServers);
        pc.addTransceiver('video', { 'direction': 'recvonly' });
        pc.oniceconnectionstatechange = (e) => {
            console.log(pc.iceConnectionState);
        };
        pc.onicecandidate = (e) => {
            if (e.candidate === null) {
                let sdp = JSON.stringify(pc.localDescription);
                let data = {
                    "SessionDescription": {
                        "sender": username,
                        "description": sdp,
                        "target": robot_target,
                        "kind": "Offer",
                        "connection_type": "Video"
                    }
                };
                socket.send(JSON.stringify(data));
            }
        };
        pc.ontrack = function (e) {
            e.currentTarget;
            console.log("track received");
            let el = document.getElementById("myVideo");
            el.srcObject = e.streams[0];
            el.autoplay = true;
            el.controls = true;
        };
        pc.onnegotiationneeded = (e) => {
            pc.createOffer().then((d) => {
                pc.setLocalDescription(d);
            }).catch(console.log);
        };
        return pc;
    });
}
function create_pc() {
    return __awaiter(this, void 0, void 0, function* () {
        let pc = new RTCPeerConnection(iceServers);
        dc = create_data_channel(pc);
        pc.oniceconnectionstatechange = (e) => {
            console.log(pc.iceConnectionState);
        };
        pc.onicecandidate = (e) => {
            if (e.candidate === null) {
                let sdp = JSON.stringify(pc.localDescription);
                let data = {
                    "SessionDescription": {
                        "sender": username,
                        "description": sdp,
                        "target": robot_target,
                        "kind": "Offer",
                        "connection_type": "Data"
                    }
                };
                socket.send(JSON.stringify(data));
            }
        };
        pc.onnegotiationneeded = (e) => {
            pc.createOffer().then((d) => {
                pc.setLocalDescription(d);
            }).catch(console.log);
        };
        pc.onconnectionstatechange = (e) => {
            console.log("connection state change: " + pc.connectionState);
            if (pc.connectionState === "connected") {
                console.log("peer connection established");
            }
        };
        return pc;
    });
}
function create_data_channel(pc) {
    let dc = pc.createDataChannel('data');
    console.log("datachannel created");
    dc.onclose = (e) => {
        console.log('datachannel closed');
    };
    dc.onopen = (e) => {
        console.log('datachannel is open');
        //pc.addTransceiver('video', {'direction': 'sendrecv'});
        //setInterval(autocommander, 2000);
    };
    dc.onmessage = (e) => {
        console.log("message received from datachannel");
        if (e.data instanceof ArrayBuffer) {
            let decoder = new TextDecoder();
            let s = decoder.decode(e.data);
            log("==> " + s);
        }
        else {
            log("==> " + e.data.toString());
        }
    };
    return dc;
}
function setRemoteDescription(pc, remote_description) {
    if (remote_description) {
        console.log(remote_description);
        pc.setRemoteDescription(remote_description).then(() => {
            console.log("remote description set");
        });
    }
    else {
        console.log("remote description is not set");
    }
}
function move(dir) {
    if (dc.readyState == "open") {
        command = dir;
        console.log("<== " + dir);
        dc.send(dir);
    }
}
function clean_terminal() {
    let logArea = document.getElementById("messages");
    if (logArea) {
        logArea.innerHTML = "";
    }
}
function log(msg) {
    let logArea = document.getElementById("messages");
    let node_num = logArea.childElementCount;
    console.log(msg);
    if (logArea) {
        let a = document.createElement("a");
        logArea.insertBefore(a, logArea.firstElementChild);
        a.classList.add("row");
        a.textContent = msg;
    }
    else {
        console.log("log area is not found");
    }
    if (node_num >= 6) {
        for (let i = 6; i < node_num; i++) {
            logArea.children[i].remove();
        }
    }
}
function preventContextMenu(event) {
    event.preventDefault();
}
let iceServers = {
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
function autocommander() {
    if (dc.readyState === "open") {
        dc.send(command);
    }
}
