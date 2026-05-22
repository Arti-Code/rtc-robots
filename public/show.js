export function hide_socket_div() {
    let websocket_section = document.getElementById("websocket_section");
    if (websocket_section) {
        websocket_section.hidden = true;
    }
}
export function show_socket_div() {
    let websocket_section = document.getElementById("websocket_section");
    if (websocket_section) {
        websocket_section.hidden = false;
    }
}
export function show_rtc_div() {
    let rtc_section = document.getElementById("rtc_section");
    if (rtc_section) {
        rtc_section.hidden = false;
    }
}
export function hide_rtc_div() {
    let rtc_section = document.getElementById("rtc_section");
    if (rtc_section) {
        rtc_section.hidden = true;
    }
}
export function show_control() {
    let control_section = document.getElementById("control_section");
    if (control_section) {
        control_section.hidden = false;
    }
}
export function hide_control() {
    let control_section = document.getElementById("control_section");
    if (control_section) {
        control_section.hidden = true;
    }
}
export function show_disconnect() {
    let close_section = document.getElementById("close_control_div");
    if (close_section) {
        close_section.hidden = false;
    }
}
export function hide_disconnect() {
    let close_section = document.getElementById("close_control_div");
    if (close_section) {
        close_section.hidden = true;
    }
}
export function show_peer_list() {
    let peer_list_div = document.getElementById("peer_list_div");
    if (peer_list_div) {
        peer_list_div.hidden = false;
    }
}
//export default {show_control, show_disconnect, show_rtc_div, show_socket_div, hide_control, hide_disconnect, hide_rtc_div, hide_socket_div};
