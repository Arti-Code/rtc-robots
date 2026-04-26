"use strict";
let pc_camera;
let pc_data;
let dc;
let socket;
let username = "ARTURO";
let robot_target = "ROBOT";
let camera_target = "CAMERA";
let remote_description;
let input_box = document.getElementById("inputBox");
let socked_opened = false;
//let move_btn = document.getElementById("moveButton") as HTMLDivElement;
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
function switch_socket_buttons() {
    let socketButton = document.getElementById("socketButton");
    let socketDisconnectButton = document.getElementById("socketDisconnectButton");
    if (socketButton) {
        socketButton.hidden = !socketButton.hidden;
    }
    if (socketDisconnectButton) {
        socketDisconnectButton.hidden = !socketDisconnectButton.hidden;
    }
}
function connect_websocket() {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    switch_socket_buttons();
    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        let conn_type = sdp.SessionDescription.connection_type;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                log("connection type: " + conn_type);
                if (conn_type == "Video") {
                    setRemoteDescription(pc_camera);
                }
                else if (conn_type == "Data") {
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
    socket.onopen = () => {
        log("websocket connected");
        register_peer(socket, username);
        socked_opened = true;
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
    showConnectRobotButtons();
    log("disconnected");
}
function connectRobot() {
    if (socked_opened) {
        pc_data = create_data_pc();
        pc_camera = create_camera_pc();
        hideConnectRobotButtons();
    }
}
function disconnectRobot() {
    disconnect();
}
function tryConnectData() {
    let user_input = document.getElementById("userName");
    let target_input = document.getElementById("robotTarget");
    //username = user_input.value;
    robot_target = target_input.value;
    if (username.length > 0 && robot_target.length > 0) {
        //connect_socket(false, true);
        pc_data = create_data_pc();
        hideConnectRobotButtons();
    }
}
function tryConnectCamera() {
    let user_input = document.getElementById("userName");
    let camera_input = document.getElementById("cameraTarget");
    //username = user_input.value;
    camera_target = camera_input.value;
    if (username.length > 0 && camera_target.length > 0) {
        //connect_socket(true, false);
        pc_camera = create_camera_pc();
        hideConnectRobotButtons();
    }
    else {
        log("username or camera target is empty");
    }
}
function showConnectRobotButtons() {
    var _a, _b, _c, _d, _e;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
    //document.getElementById("cameraButton")?.removeAttribute("hidden");
    (_b = document.getElementById("stopButton")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "true");
    (_c = document.getElementById("userName")) === null || _c === void 0 ? void 0 : _c.removeAttribute("hidden");
    //document.getElementById("user2Name")?.removeAttribute("hidden");
    (_d = document.getElementById("robotTarget")) === null || _d === void 0 ? void 0 : _d.removeAttribute("hidden");
    (_e = document.getElementById("cameraTarget")) === null || _e === void 0 ? void 0 : _e.removeAttribute("hidden");
}
function hideConnectRobotButtons() {
    var _a, _b, _c, _d, _e;
    (_a = document.getElementById("startButton")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "true");
    //document.getElementById("cameraButton")?.setAttribute("hidden", "true");
    (_b = document.getElementById("stopButton")) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden");
    (_c = document.getElementById("userName")) === null || _c === void 0 ? void 0 : _c.setAttribute("hidden", "true");
    //document.getElementById("user2Name")?.setAttribute("hidden", "true");
    (_d = document.getElementById("robotTarget")) === null || _d === void 0 ? void 0 : _d.setAttribute("hidden", "true");
    (_e = document.getElementById("cameraTarget")) === null || _e === void 0 ? void 0 : _e.setAttribute("hidden", "true");
}
/* function connect_socket(camera: boolean, data: boolean) {
    let socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");

    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                if (camera) {
                    setRemoteDescription(pc_camera);
                } else if (data) {
                    setRemoteDescription(pc_data);
                }
            } else {
                log("remote description is null");
            }
        } else {
            log("description is null");
        }
    }

    socket.onopen = () => {
        log("websocket connected");
        if (!registered) {
            register_peer(socket, username);
            registered = true;
        }
        if (camera) {
            //register_peer(socket, username2);
            pc_camera = create_camera_pc();
        }
        if (data) {
            //register_peer(socket, username1);
            pc_data = create_data_pc();
        }
    };

    if (camera) {
        socket_camera = socket;
    }
    if (data) {
        socket_data = socket;
    }
} */
function register_peer(socket, name) {
    let registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function create_camera_pc() {
    let pc = new RTCPeerConnection(iceServers);
    pc.addTransceiver('video', { 'direction': 'recvonly' });
    pc.oniceconnectionstatechange = (e) => {
        log(pc.iceConnectionState);
    };
    pc.onicecandidate = (e) => {
        if (e.candidate === null) {
            let sdp = JSON.stringify(pc.localDescription);
            let data = {
                "SessionDescription": {
                    "sender": username,
                    "description": sdp,
                    "target": camera_target,
                    "kind": "Offer",
                    "connection_type": "Video"
                }
            };
            socket.send(JSON.stringify(data));
        }
    };
    pc.ontrack = function (e) {
        e.currentTarget;
        log("track received");
        let el = document.getElementById("remoteVideos");
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
    };
    pc.onnegotiationneeded = (e) => {
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(log);
    };
    return pc;
}
function create_data_pc() {
    let pc = new RTCPeerConnection(iceServers);
    dc = create_data_channel(pc);
    pc.oniceconnectionstatechange = (e) => {
        log(pc.iceConnectionState);
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
        }).catch(log);
    };
    return pc;
}
function create_data_channel(pc) {
    let dc = pc.createDataChannel('dataChannel');
    log("datachannel created");
    dc.onclose = (e) => {
        log('datachannel closed');
    };
    dc.onopen = (e) => {
        log('datachannel is open');
    };
    dc.onmessage = (e) => {
        let s = e.data.toString();
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
