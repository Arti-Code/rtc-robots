

let pc: RTCPeerConnection;
let dc: RTCDataChannel;
let socket: WebSocket;
let username: string = "ARTUR";
let target: string = "ROBOT";
let remote_description: RTCSessionDescription;
let input_box = document.getElementById("inputBox") as HTMLDivElement;
//let camera_button = document.getElementById("cameraButton") as HTMLButtonElement;
//var user_input = document.getElementById("userName") as HTMLInputElement;
//var target_input = document.getElementById("targetName") as HTMLInputElement;

/* document.onload = (e) => {
    console.log("open page");
} */

function disconnect() {
    if (dc) { dc.close(); }
    pc.close();
    socket.close();
    show_connection_buttons();
    log("disconnected");
}

function tryConnect() {
    let user_input = document.getElementById("userName") as HTMLInputElement;
    let target_input = document.getElementById("targetName") as HTMLInputElement;
    username = user_input.value;
    target = target_input.value;
    if (username.length > 0 && target.length > 0) {
        connect_socket(false);
        hide_connection_buttons()
    }
}

function tryConnectCamera() {
    let user_input = document.getElementById("userName") as HTMLInputElement;
    let target_input = document.getElementById("targetName") as HTMLInputElement;
    username = user_input.value;
    target = target_input.value;
    if (username.length > 0 && target.length > 0) {
        connect_socket(true);
        hide_connection_buttons()
    }
}

function show_connection_buttons() {
    document.getElementById("startButton")?.removeAttribute("hidden");
    document.getElementById("cameraButton")?.removeAttribute("hidden");
    document.getElementById("stopButton")?.setAttribute("hidden", "true");
    //document.getElementById("move")?.setAttribute("disabled", "true");
    //document.getElementById("back")?.setAttribute("disabled", "true");
    //document.getElementById("right")?.setAttribute("disabled", "true");
    //document.getElementById("left")?.setAttribute("disabled", "true");
    //let user_input = document.getElementById("userName") as HTMLInputElement;
    //let target_input = document.getElementById("targetName") as HTMLInputElement;
    document.getElementById("userName")?.removeAttribute("hidden");
    document.getElementById("targetName")?.removeAttribute("hidden");
}

function hide_connection_buttons() {
    document.getElementById("startButton")?.setAttribute("hidden", "true");
    document.getElementById("cameraButton")?.setAttribute("hidden", "true");
    document.getElementById("stopButton")?.removeAttribute("hidden");
    document.getElementById("userName")?.setAttribute("hidden", "true");
    document.getElementById("targetName")?.setAttribute("hidden", "true");
    //user_input.setAttribute("hidden", "true");
    //target_input.removeAttribute("hidden");
    //document.getElementById("move")?.removeAttribute("disabled");
    //document.getElementById("back")?.removeAttribute("disabled");
    //document.getElementById("right")?.removeAttribute("disabled");
    //document.getElementById("left")?.removeAttribute("disabled");
}

function connect_socket(camera: boolean) {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");

    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                setRemoteDescription();
            } else {
                log("remote description is null");
            }
        } else {
            log("description is null");
        }
    }

    socket.onopen = () => {
        log("websocket connected");
        register_peer(username);
        pc = create_pc(camera);

        pc.oniceconnectionstatechange = () => {
            log(pc.iceConnectionState);
        };

        pc.onicecandidate = (e) => {
            if (e.candidate === null) {
                let sdp = JSON.stringify(pc.localDescription);
                let data = {
                    "SessionDescription": 
                    {
                        "sender": username, 
                        "description": sdp, 
                        "target": target, 
                        "kind": "Offer"
                    }
                };
                socket.send(JSON.stringify(data));
            }
        }

        pc.onnegotiationneeded = (e) => {
            pc.createOffer().then((d) => {
                pc.setLocalDescription(d);
            }).catch(log);
        };
    };
}

function register_peer(name: string) {
  let registerMsg = {"Register": name};
  socket.send(JSON.stringify(registerMsg));
}

function create_pc(camera: boolean): RTCPeerConnection {
    let pc = new RTCPeerConnection({
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
        pc.addTransceiver('video', {'direction': 'recvonly'})
        //pc.addTransceiver('video', {'direction': 'recvonly'})
    } else {
        dc = create_data_channel(pc);
    }

    pc.oniceconnectionstatechange = (e) => {
        log(pc.iceConnectionState);
    };

    pc.onicecandidate = (e) => {
        if (e.candidate === null) {
            let sdp = JSON.stringify(pc.localDescription);
            let data = {
                "SessionDescription": 
                {
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
        e.currentTarget
        log("onTrack");
        console.log(e);
        console.log("type: " + e.type);
        console.log("track num: " + e.streams.length);
        console.log("track kind: " + e.track.kind);
        let el = document.getElementById("remoteVideos") as HTMLVideoElement;
        el.srcObject = e.streams[0];
        el.autoplay = true;
        el.controls = true;
        //document.getElementById('remoteVideos')?.appendChild(el);
    }

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

    pc.onnegotiationneeded = (e) => {
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(log);
    }
    return pc;
}

function create_data_channel(pc: RTCPeerConnection): RTCDataChannel {
    let dc = pc.createDataChannel('dataChannel');
    log("datachannel created");

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

    return dc;
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

function setRemoteDescription() {
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
