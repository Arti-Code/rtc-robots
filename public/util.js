"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(msg) {
    var logArea = document.getElementById("messages");
    var node_num = logArea.childElementCount;
    console.log(msg);
    if (logArea) {
        var a = document.createElement("a");
        logArea.insertBefore(a, logArea.firstElementChild);
        a.classList.add("row");
        a.textContent = msg;
    }
    else {
        console.log("log area is not found");
    }
    if (node_num >= 6) {
        for (var i = 6; i < node_num; i++) {
            logArea.children[i].remove();
        }
    }
}
