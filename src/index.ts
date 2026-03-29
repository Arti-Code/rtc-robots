//import {log} from "./util.js"; 
//import {iceServers} from "./iceservers.js";


let pc1: RTCPeerConnection;
let pc2: RTCPeerConnection;
let dc: RTCDataChannel;
let socket: WebSocket;
let username1: string = "ARTUR1";
let username2: string = "ARTUR2";
let target: string = "ROBOT";
let cameraTarget: string = "CAMERA";
let remote_description: RTCSessionDescription;
let input_box = document.getElementById("inputBox") as HTMLDivElement;

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
   

function disconnect() {
    if (dc) { dc.close(); }
    if (pc1) { pc1.close(); }
    if (pc2) { pc2.close(); }
    socket.close();
    show_connection_buttons();
    log("disconnected");
}

function tryConnect() {
    let user_input = document.getElementById("userName1") as HTMLInputElement;
    let target_input = document.getElementById("targetName") as HTMLInputElement;
    username1 = user_input.value;
    target = target_input.value;
    if (username1.length > 0 && target.length > 0) {
        connect_socket(false);
        //hide_connection_buttons()
        showDisconnect();
    }
}

function tryConnectCamera() {
    let user_input = document.getElementById("userName2") as HTMLInputElement;
    let camera_input = document.getElementById("cameraName") as HTMLInputElement;
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
    document.getElementById("stopButton")?.removeAttribute("hidden");
}

function show_connection_buttons() {
    document.getElementById("startButton")?.removeAttribute("hidden");
    document.getElementById("cameraButton")?.removeAttribute("hidden");
    document.getElementById("stopButton")?.setAttribute("hidden", "true");
    document.getElementById("userName1")?.removeAttribute("hidden");
    document.getElementById("userName2")?.removeAttribute("hidden");
    document.getElementById("targetName")?.removeAttribute("hidden");
    document.getElementById("cameraName")?.removeAttribute("hidden");
}

function hide_connection_buttons() {
    document.getElementById("startButton")?.setAttribute("hidden", "true");
    document.getElementById("cameraButton")?.setAttribute("hidden", "true");
    document.getElementById("stopButton")?.removeAttribute("hidden");
    document.getElementById("userName1")?.setAttribute("hidden", "true");
    document.getElementById("userName2")?.setAttribute("hidden", "true");
    document.getElementById("targetName")?.setAttribute("hidden", "true");
    document.getElementById("cameraName")?.setAttribute("hidden", "true");
}

function connect_socket(camera: boolean) {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    let user: string;
    let tg: string;
    if (camera) {
        user = username2;
        tg = cameraTarget;
    } else {
        user = username1;
        tg = target;
    }
    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                setRemoteDescription(pc1);
            } else {
                log("remote description is null");
            }
        } else {
            log("description is null");
        }
    }

    socket.onopen = () => {
        log("websocket connected");
        register_peer(user);
        
        if (camera) {
            pc2 = create_pc(camera);
            pc2.addTransceiver('video', {'direction': 'recvonly'})
            
            pc2.oniceconnectionstatechange = () => {
                log(pc2.iceConnectionState);
            };

            pc2.onicecandidate = (e) => {
                if (e.candidate === null) {
                    let sdp = JSON.stringify(pc2.localDescription);
                    let data = {
                        "SessionDescription": 
                        {
                            "sender": user, 
                            "description": sdp, 
                            "target": tg, 
                            "kind": "Offer"
                        }
                    };
                    socket.send(JSON.stringify(data));
                }
            }

            pc2.onnegotiationneeded = (e) => {
                pc2.createOffer().then((d) => {
                    pc2.setLocalDescription(d);
                }).catch(log);
            };
        } else {
            pc1 = create_pc(camera);
            dc = create_data_channel(pc1);
            
            pc1.oniceconnectionstatechange = () => {
                log(pc1.iceConnectionState);
            };

            pc1.onicecandidate = (e) => {
                if (e.candidate === null) {
                    let sdp = JSON.stringify(pc1.localDescription);
                    let data = {
                        "SessionDescription": 
                        {
                            "sender": user, 
                            "description": sdp, 
                            "target": tg, 
                            "kind": "Offer"
                        }
                    };
                    socket.send(JSON.stringify(data));
                }
            }

            pc1.onnegotiationneeded = (e) => {
                pc1.createOffer().then((d) => {
                    pc1.setLocalDescription(d);
                }).catch(log);
            };
        }
    };
}

function register_peer(name: string) {
  let registerMsg = {"Register": name};
  socket.send(JSON.stringify(registerMsg));
}

function create_pc(camera: boolean): RTCPeerConnection {
    let pc = new RTCPeerConnection(iceServers);
    pc.oniceconnectionstatechange = (e) => {
        log(pc.iceConnectionState);
    };

    pc.onicecandidate = (e) => {
        if (e.candidate === null) {
            let sdp = JSON.stringify(pc.localDescription);
            let data = {
                "SessionDescription": 
                {
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
        e.currentTarget
        log("track received");
        let el = document.getElementById("remoteVideos") as HTMLVideoElement;
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
    }

    pc.onnegotiationneeded = (e) => {
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(log);
    }

    //dc.onopen = (e) => {
    //    log('datachannel is open');
    //}

    return pc;
}


function create_data_channel(pc: RTCPeerConnection): RTCDataChannel {
    let dc = pc.createDataChannel('dataChannel');
    log("datachannel created");

    dc.onclose = (e) => {
        log('datachannel closed');
    }

    dc.onopen = (e) => {
        log('datachannel is open');
    }

    dc.onmessage = (e) => {
        let s: string = e.data.toString();
        log("==> " + s);
    }

    return dc;
}


function setRemoteDescription(pc: RTCPeerConnection) {
    if (remote_description) {
        try {
            pc.setRemoteDescription(remote_description);
            log("remote description set");
        }
        catch {
            log("failed to set remote description");
        }
    } else {
        log("remote description is not set");
    }
}

function move(dir: string) {
    if (dc.readyState == "open") {
        log("<== " + dir);
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