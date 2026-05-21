export function register(ws: WebSocket, name: string) {
  let registerMsg = {"Register": name};
  ws.send(JSON.stringify(registerMsg));
}


export function get_peer_list(ws: WebSocket, name: string) {
  let getPeerListMsg = { "GetPeerList": name };
  ws.send(JSON.stringify(getPeerListMsg));
}

export function connect(addr: string): WebSocket {
  let socket = new WebSocket(addr);
  return socket;
}