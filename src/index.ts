let pc_camera: RTCPeerConnection;
let pc_data: RTCPeerConnection;
let dc: RTCDataChannel;
let socket: WebSocket;
let username: string = "ARTURO";
let robot_target: string = "ROBOT";
let camera_target: string = "CAMERA";
let remote_description: RTCSessionDescription;
let input_box = document.getElementById("inputBox") as HTMLDivElement;
let socked_opened = false;
let timer = 0.0;
//let move_btn = document.getElementById("moveButton") as HTMLDivElement;


document.addEventListener('DOMContentLoaded', () => {
    console.log("init loader");
    const move_button = document.getElementById('moveButton');
    if (move_button) {
        move_button.ontouchend = function(event) {
            move("STOP");
        };
        move_button.ontouchstart = function(event) {
            move("MOVE");
        };
    } else {
        console.error("Element with ID 'moveButton' not found.");
    }
    const back_button = document.getElementById('backButton');
    if (back_button) {
        back_button.ontouchend = function(event) {
            move("STOP");
        };
        back_button.ontouchstart = function(event) {
            move("BACK");
        };
    } else {
        console.error("Element with ID 'backButton' not found.");
    }
    const right_button = document.getElementById('rightButton');
    if (right_button) {
        right_button.ontouchend = function(event) {
            move("STOP");
        };
        right_button.ontouchstart = function(event) {
            move("RIGHT");
        };
    } else {
        console.error("Element with ID 'rightButton' not found.");
    }
    const left_button = document.getElementById('leftButton');
    if (left_button) {
        left_button.ontouchend = function(event) {
            move("STOP");
        };
        left_button.ontouchstart = function(event) {
            move("LEFT");
        };
    } else {
        console.error("Element with ID 'leftButton' not found.");
    }
});
   
function hide_socket_div() {
    let websocket_section = document.getElementById("websocket_section") as HTMLDivElement;
    if (websocket_section) {
        websocket_section.hidden = true;
    }
}

function show_socket_div() {
    let websocket_section = document.getElementById("websocket_section") as HTMLDivElement;
    if (websocket_section) {
        websocket_section.hidden = false;
    }
}

function show_rtc_div() {
    let rtc_section = document.getElementById("rtc_section") as HTMLDivElement;
    if (rtc_section) {
        rtc_section.hidden = false;
    }   
}

function hide_rtc_div() {
    let rtc_section = document.getElementById("rtc_section") as HTMLDivElement;
    if (rtc_section) {
        rtc_section.hidden = true;
    }
}

function show_control() {
    let control_section = document.getElementById("control_section") as HTMLDivElement;
    if (control_section) {
        control_section.hidden = false;
    }
}

function hide_control() {
    let control_section = document.getElementById("control_section") as HTMLDivElement;
    if (control_section) {
        control_section.hidden = true;
    }
}
function show_disconnect() {
    let close_section = document.getElementById("close_control_div") as HTMLDivElement;
    if (close_section) {
        close_section.hidden = false;
    }
}

function hide_disconnect() {
    let close_section = document.getElementById("close_control_div") as HTMLDivElement;
    if (close_section) {
        close_section.hidden = true;
    }
}

function connectWebsocket() {
    //socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    socket = new WebSocket("ws://127.0.0.1:8080");
    let user_input = document.getElementById("userName") as HTMLInputElement;
    username = user_input.value;
    let socketButton = document.getElementById("socketButton") as HTMLButtonElement;
    if (socketButton) {
        socketButton.textContent = "Connecting...";
    }
    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        let conn_type = sdp.SessionDescription.connection_type;
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
        }
    }

    socket.onopen = () => {
        //log("websocket connected");
        register_peer(socket, username);
        get_peers_online(socket, username);
        socked_opened = true;
        hide_socket_div();
        show_rtc_div();
        console.log("Websocket connected");
        let socketButton = document.getElementById("socketButton") as HTMLButtonElement;
        if (socketButton) {
            socketButton.textContent = "Connect Signaling";
        }
    };
}

function disconnect_websocket() {
    if (socket) { socket.close(); }
}

function disconnect() {
    if (dc) { dc.close(); }
    if (pc_data) { pc_data.close(); }
    if (pc_camera) { pc_camera.close(); }
    disconnect_websocket();
    console.log("disconnected");
}

function connectRobot() {
    if (socked_opened) {
        pc_data = create_data_pc();
        pc_camera = create_camera_pc();
        hide_rtc_div();
        show_control();
        show_disconnect();
    }
}

function disconnectRobot() {
    hide_control();
    hide_rtc_div()
    disconnect();
    show_socket_div();
    hide_disconnect();
}

function register_peer(socket: WebSocket, name: string) {
  let registerMsg = {"Register": name};
  socket.send(JSON.stringify(registerMsg));
}

function get_peers_online(socket: WebSocket, name: string) {
  let getPeerListMsg = { "GetPeerList": name };
  socket.send(JSON.stringify(getPeerListMsg));
}

function create_camera_pc(): RTCPeerConnection {
    let pc = new RTCPeerConnection(iceServers);
    pc.addTransceiver('video', {'direction': 'recvonly'});

    pc.oniceconnectionstatechange = (e) => {
        console.log(pc.iceConnectionState);
    };

    pc.onicecandidate = (e) => {
        if (e.candidate === null) {
            let sdp = JSON.stringify(pc.localDescription);
            let data = {
                "SessionDescription": 
                {
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
        e.currentTarget
        console.log("track received");
        let el = document.getElementById("myVideo") as HTMLVideoElement;
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
    }

    pc.onnegotiationneeded = (e) => {
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(console.log);
    }
    return pc;
}

function create_data_pc(): RTCPeerConnection {
    let pc = new RTCPeerConnection(iceServers);
    dc = create_data_channel(pc);

    pc.oniceconnectionstatechange = (e) => {
        console.log(pc.iceConnectionState);
    };

    pc.onicecandidate = (e) => {
        if (e.candidate === null) {
            let sdp = JSON.stringify(pc.localDescription);
            let data = {
                "SessionDescription": 
                {
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
    return pc;
}

function create_data_channel(pc: RTCPeerConnection): RTCDataChannel {
    let dc = pc.createDataChannel('dataChannel');
    console.log("datachannel created");

    dc.onclose = (e) => {
        console.log('datachannel closed');
    }

    dc.onopen = (e) => {
        console.log('datachannel is open');
    }

    dc.onmessage = (e) => {
        let s: string = e.data.toString();
        console.log("==> " + s);
    }

    return dc;
}


function setRemoteDescription(pc: RTCPeerConnection) {
    if (remote_description) {
        try {
            pc.setRemoteDescription(remote_description);
            console.log("remote description set");
        }
        catch {
            console.log("failed to set remote description");
        }
    } else {
        console.log("remote description is not set");
    }
}

function move(dir: string) {
    if (dc.readyState == "open") {
        console.log("<== " + dir);
        dc.send(dir);
    }
}

function log(msg: any) {
    let logArea = document.getElementById("messages") as HTMLDivElement;
    let node_num = logArea.childElementCount;
    console.log(msg);
    if (logArea) {
        let a = document.createElement("a");
        logArea.insertBefore(a, logArea.firstElementChild);
        a.classList.add("row")
        a.textContent = msg;
    } else {
        console.log("log area is not found");
    }
    if (node_num >= 6) {
        for (let i = 6; i < node_num; i++) {
            logArea.children[i].remove();
        }
    }
}

function preventContextMenu(event: MouseEvent) {
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
}