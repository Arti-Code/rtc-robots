export function register(ws, name) {
    let registerMsg = { "Register": name };
    ws.send(JSON.stringify(registerMsg));
}
export function get_peer_list(ws, name) {
    let getPeerListMsg = { "GetPeerList": name };
    ws.send(JSON.stringify(getPeerListMsg));
}
export function connect(addr) {
    let socket = new WebSocket(addr);
    return socket;
}
