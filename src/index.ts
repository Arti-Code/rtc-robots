

let pc: RTCPeerConnection;
let dc: RTCDataChannel;
let socket: WebSocket;
let username: string = "ARTUR";
let target: string = "ROBOT";
let remote_description: RTCSessionDescription;

function disconnect() {
    dc.close();
    pc.close();
    socket.close();
    document.getElementById("startButton")?.removeAttribute("disabled");
    document.getElementById("stopButton")?.setAttribute("disabled", "true");
    document.getElementById("move")?.setAttribute("disabled", "true");
    document.getElementById("back")?.setAttribute("disabled", "true");
    document.getElementById("right")?.setAttribute("disabled", "true");
    document.getElementById("left")?.setAttribute("disabled", "true");
    log("disconnected");
}

function connect() {
    socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    document.getElementById("startButton")?.setAttribute("disabled", "true");
    document.getElementById("stopButton")?.removeAttribute("disabled");
    document.getElementById("move")?.removeAttribute("disabled");
    document.getElementById("back")?.removeAttribute("disabled");
    document.getElementById("right")?.removeAttribute("disabled");
    document.getElementById("left")?.removeAttribute("disabled");
    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
                log("remote description received");
                log(remote_description);
                setRemoteDescription();
            } else {
                log("remote description is null");
            }
        } else {
          log("description is null");
        }
    }

    socket.onopen = () => {
        log("socket connected");
        register_peer(username);
        pc = create_pc();
        dc = create_data_channel();
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
                log(data);
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

function create_pc(): RTCPeerConnection {
    let pc = new RTCPeerConnection({
        "iceServers": [
            { 
                "urls": [
                    "stun:fr-turn8.xirsys.com",
                ]
            },
            {
                urls: [
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
    log("peer connection created");

    pc.oniceconnectionstatechange = (e) => {
        log(pc.iceConnectionState);
    };

    pc.onicecandidate = (e) => {
        log("onicecandidate");
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
            log("sending offer");
            log(data);
            log(data.SessionDescription.description);
            socket.send(JSON.stringify(data));
        }
    };

    pc.onnegotiationneeded = (e) => {
        log("onnegotiationneeded");
        pc.createOffer().then((d) => {
            pc.setLocalDescription(d);
        }).catch(log);
    }
    return pc;
}

function create_data_channel(): RTCDataChannel {
    let dc = pc.createDataChannel('dataChannel');
    log("data channel created");

    dc.onclose = (e) => {
        log('datachannel closed');
    }

    dc.onopen = (e) => {
        log('datachannel opened');
        window.setInterval(() => {
            if (dc.readyState === "open") {
                let num = Math.round(Math.random() * 1000000);
                log("<== " + num);
                dc.send("random number: " + num);
            }
        }, 6000);
    }

    dc.onmessage = (e) => {
        let s: string = e.data.toString();
        log("==> " + s);
    }
    return dc;
}

function log(msg: any) {
    let logArea = document.getElementById("messages");
    console.log(msg);
    if (logArea) {
        logArea.innerHTML += "<a class='row'>" + msg + "</a>";
        //logArea.innerText += msg + "\n";
    } else {
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