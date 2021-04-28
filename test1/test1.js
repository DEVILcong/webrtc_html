'use strict';

var video_container = document.getElementById("video_container");
var video_player = document.getElementById("video_player");
var my_media_stream = new MediaStream();
var config1 = {iceServers:[
                    {urls: "stun:stun1.l.google.com:19302"}, 
                    {urls: "stun:stun2.l.google.com:19302"}, 
                    {urls: "stun:stun3.l.google.com:19302"}
                    ]
                };
var config2 = [];

let localPeerConnection;
let localWebSocket;
var websocket_url = "ws://127.0.0.1:23333";

video_player.addEventListener("ratechange", (event) => {
    console.log("video rate change");
});

init_RTCPeerConnection();
init_WebSocket();

function onClickButton(){
}

function handle_websocket_message(event){
    let data = event.data;
    let json_data = JSON.parse(data);

    if(json_data.packet_type == "sdp"){
        localPeerConnection.setRemoteDescription({"type": json_data.type, "sdp": json_data.sdp,});
        localPeerConnection.createAnswer({offerToReceiveVideo: 1}).then(handle_created_answer);
    }else if(json_data.packet_type == "ice"){
        localPeerConnection.addIceCandidate({"sdpMid": json_data.sdpMid, "sdpMLineIndex": json_data.sdpMLineIndex, "candidate":json_data.sdp,})
        .then(handle_add_ice_success).catch(handle_add_ice_error);
    }
}

function init_WebSocket(){
    localWebSocket = new WebSocket(websocket_url);

    localWebSocket.addEventListener("error", 
    function (event){
        window.alert("websocket failed to connect");
    });

    localWebSocket.addEventListener("message", handle_websocket_message);
}

function handle_icecandidate(event){
    console.log(event.candidate);
    let candidate = event.candidate;
    if(candidate != null){
        let json_data = candidate.toJSON();
        json_data.packet_type = "ice";
        if(localWebSocket.readyState == WebSocket.OPEN){
            localWebSocket.send(JSON.stringify(json_data));
        }
    }
}

function handle_add_ice_success(){
    console.log("add ice success");
}

function handle_add_ice_error(error){
    console.log("add ice error");
    console.log(error.toString());
}

function handle_created_answer(sessionDescription){
    console.log(sessionDescription);
    localPeerConnection.setLocalDescription(sessionDescription);
    let json_data = sessionDescription.toJSON();
    json_data.packet_type = "sdp";
    if(localWebSocket.readyState == WebSocket.OPEN){
        localWebSocket.send(JSON.stringify(json_data));
    }else{
        window.alert("sdp failed to send");
    }
}

function handle_add_track(event){
    console.log("receive track", event);
    video_player.srcObject = event.streams[0];
}

function handle_add_stream(event){
    console.log("receive stream");
    video_player.srcObject = event.stream;
}

function init_RTCPeerConnection(){
    localPeerConnection = new RTCPeerConnection(config1);
    localPeerConnection.addEventListener("icecandidate", handle_icecandidate);
    localPeerConnection.addEventListener("track", handle_add_track);
    //localPeerConnection.addEventListener("addstream", handle_add_stream);
}