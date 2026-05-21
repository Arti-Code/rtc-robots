"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const servers_1 = require("./servers");
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
let timer = 0.0;
let command = "STOP";
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
    //socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    socket = new WebSocket("ws://127.0.0.1:8080");
    let user_input = document.getElementById("userName");
    username = user_input.value;
    socket.onmessage = (e) => {
        let message = JSON.parse(e.data);
        if (message.PeerList) {
            update_peer_list(message.PeerList);
            show_peer_list();
        }
        if (message.SessionDescription) {
            session_description(message);
        }
        /* let sd = message.SessionDescription.description;
        let conn_type = message.SessionDescription.connection_type;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                console.log("connection type: " + conn_type);
                if (conn_type == "Video") {
                    setRemoteDescription(pc_camera);
                } else if (conn_type == "Data") {
                    setRemoteDescription(pc_data);
                }
            } else {
                console.log("remote description is null");
            }
        } else {
            console.log("description is null");
        } */
    };
    socket.onopen = () => {
        register_peer(socket, username);
        get_peers_online(socket, username);
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
    let robot_input = document.getElementById("robotTarget");
    let camera_input = document.getElementById("cameraTarget");
    if (robot_input) {
        robot_target = robot_input.value;
    }
    if (camera_input) {
        camera_target = robot_input.value;
    }
    if (socked_opened) {
        pc_data = create_data_pc();
        pc_camera = create_camera_pc();
        hide_rtc_div();
        show_control();
        show_disconnect();
    }
}
function connectRobotSolo() {
    let robot_input = document.getElementById("robotTarget");
    if (robot_input) {
        robot_target = robot_input.value;
    }
    if (socked_opened) {
        pc_data = create_data_pc();
        //pc_camera = create_camera_pc();
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
function session_description(data) {
    let message = data.SessionDescription.description;
    let conn_type = data.SessionDescription.connection_type;
    if (message) {
        remote_description = JSON.parse(message);
        if (remote_description) {
            console.log("connection type: " + conn_type);
            if (conn_type == "Video") {
                setRemoteDescription(pc_camera);
            }
            else if (conn_type == "Data") {
                setRemoteDescription(pc_data);
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
function register_peer(socket, name) {
    let registerMsg = { "Register": name };
    socket.send(JSON.stringify(registerMsg));
}
function get_peers_online(socket, name) {
    let getPeerListMsg = { "GetPeerList": name };
    socket.send(JSON.stringify(getPeerListMsg));
}
function create_camera_pc() {
    let pc = new RTCPeerConnection(servers_1.iceServers);
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
}
function create_data_pc() {
    let pc = new RTCPeerConnection(servers_1.iceServers);
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
    pc.ontrack = function (e) {
        e.currentTarget;
        console.log("track received");
        let el = document.getElementById("myVideo");
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = false;
    };
    pc.onnegotiationneeded = (e) => {
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(console.log);
    };
    return pc;
}
function create_data_channel(pc) {
    let dc = pc.createDataChannel('dataChannel');
    console.log("datachannel created");
    dc.onclose = (e) => {
        console.log('datachannel closed');
    };
    dc.onopen = (e) => {
        console.log('datachannel is open');
        setInterval(autocommander, 500);
    };
    dc.onmessage = (e) => {
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
function setRemoteDescription(pc) {
    if (remote_description) {
        try {
            pc.setRemoteDescription(remote_description);
            console.log("remote description set");
        }
        catch (_a) {
            console.log("failed to set remote description");
        }
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
function show_peer_list() {
    let peer_list_div = document.getElementById("peer_list_div");
    if (peer_list_div) {
        peer_list_div.hidden = false;
    }
}
function hide_peer_list() {
    let peer_list_div = document.getElementById("peer_list_div");
    if (peer_list_div) {
        peer_list_div.hidden = true;
    }
}
function update_peer_list(peers) {
    let peerList = document.getElementById("peerList");
    if (peerList) {
        peerList.innerHTML = "";
        peers.forEach(peer => {
            let li = document.createElement("li");
            let peer_button = document.createElement("button");
            peer_button.classList = "button_peer";
            peer_button.textContent = peer;
            li.appendChild(peer_button);
            peerList.appendChild(li);
        });
    }
}
function autocommander() {
    if (dc.readyState === "open") {
        dc.send(command);
    }
}
