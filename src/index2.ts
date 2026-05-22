//import iceServers from "./servers";

let pc: RTCPeerConnection;
let dc: RTCDataChannel;
let socket: WebSocket;
let username: string = "ARTURO";
let target: string = "ROBOT";
let remote_description: RTCSessionDescription;
let socked_opened = false;


function switch_connect_button_function(action: Function, to_remove: Function) {
  let socketButton = document.getElementById("socketButton") as HTMLButtonElement;
  if (socketButton) {
    socketButton.removeEventListener("click", (e) => to_remove);
    socketButton.addEventListener("click", (e) => {
      action;
    });
  }
}

function socket_button_icon(image: string) {
  let socketButtonIcon = document.getElementById("socketButtonIcon") as HTMLImageElement;
  if (socketButtonIcon) {
      socketButtonIcon.src = "./assets/"+image;
  }
}

function connect_ws() {
    //socket = new WebSocket("wss://ws2-production-fbbf.up.railway.app");
    socket = new WebSocket("ws://127.0.0.1:8080");
    socket_button_icon("hourglass.png");
    
    socket.onmessage = (e) => {
        let sdp = JSON.parse(e.data);
        let sd = sdp.SessionDescription.description;
        let conn_type = sdp.SessionDescription.connection_type;
        if (sd) {
            remote_description = JSON.parse(sd);
            if (remote_description) {
              setRemoteDescription(pc);
            } else {
              console.log("remote description is null");
            }
        } else {
            console.log("sd is null");
        }
    }

    socket.onopen = () => {
        socket_button_icon("link-orange.png");
        register_peer(socket, username);
        socked_opened = true;
        console.log("websocket connected");
        switch_connect_button_function(close_rtc, connect_ws);
    };

    socket.onclose = () => {
      socket_button_icon("link-green.png");
    }

    return socket;
}

function disconnect_ws() {
    if (socket) { 
      socket.close();
      //socket_button_icon("link-green.png");
      console.log("websocket disconnected");
      socked_opened = false;
      switch_connect_button_function(connect_ws, close_rtc);
    }
}

function close_rtc() {
    if (dc) { 
      dc.close(); 
      console.log("dc closed");
    }
    if (pc) { 
      pc.close();
      console.log("pc closed"); 
    }
    disconnect_ws();
    
}

function connect_rtc() {
    pc = create_pc();

}

/* function disconnectRobot() {
    close_rtc();
} */

function register_peer(ws: WebSocket, name: string) {
  let registerMsg = {"Register": name};
  ws.send(JSON.stringify(registerMsg));
}

function create_pc(): RTCPeerConnection {
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
                    "target": target, 
                    "kind": "Offer",
                    "connection_type": "Data"
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
        el.controls = false;
    }

    pc.onnegotiationneeded = (e) => {
      pc.addTransceiver('video');
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
};