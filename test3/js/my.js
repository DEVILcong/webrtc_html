var maxUserId = 500000;
var qrcode;
var userId;
var websocket;
var localPeerConnection;

var peerconnectionConfig = {iceServers:[
      {url: "stun:www.liangyuecong666.club:3478"}
//    {urls: "stun:stun.stunprotocol.org:3478"},
//    {urls: "stun:stun1.l.google.com:19302"},
//    {urls: "stun:stun2.l.google.com:19302"},
//    {urls: "stun:stun3.l.google.com:19302"}
]};

var lanWebSocketAddr = "ws://127.0.0.1:23333";
var wanWebSocketAddr = "ws://www.liangyuecong666.club:23333";

function getUserId(){
    userId = Math.floor(Math.random() * maxUserId);
}

function init_all(){
    init_webrtc();
    layer.open({
        type: 1,
	title: "工作方式选择",
	area: ["500px", "400px"],
	content: $('#chooser')
    });
}

function init_websocket(serverAddr){
    websocket = new WebSocket(serverAddr);
    websocket.addEventListener("close", onWebSocketClose);
    websocket.addEventListener("error", onWebSocketError);
    websocket.addEventListener("message", onWebSocketMessage);
    websocket.addEventListener("open", onWebSocketOpen);
}

function init_webrtc(){
    localPeerConnection = new RTCPeerConnection(peerconnectionConfig);
    localPeerConnection.addEventListener("icecandidate", onIceCandidate);
    localPeerConnection.addEventListener("track", onTrack);
}

function onWanButtonClicked(){
    getUserId();
    clearQRCode();
    init_websocket(wanWebSocketAddr);
    new QRCode(document.getElementById("qrcode-container"), 
        {
	  text: JSON.stringify(
            {
                "type": 1,
		"userId": userId,
                "serverAddress": wanWebSocketAddr
	    }),
	  width: 128,
	  height: 128
	}
	);
}

function onLanButtonClicked(){
    getUserId();
    init_websocket(lanWebSocketAddr);
}

function clearQRCode(){
    var qrcode_container = document.getElementById("qrcode-container");
    qrcode_container.innerHTML = "";
}

function setSuccessTag(){
    document.getElementById("success_tag_img").src = "res/right.png";
    document.getElementById("success_tag_info").innerHTML = "客户端加入成功，请关闭对话框";
}

function setConnectionSuccessTag(){
    document.getElementById("success_tag_img").src = "res/right.png";
    document.getElementById("success_tag_info").innerHTML = "连接服务器成功，等待客户端加入";
}

//websocket functions area

function onWebSocketOpen(event){
    websocket.send(JSON.stringify(
        {
            "msg_type": 1,
	    "client_id": userId,
	    "client_type": 1
	}
    ));
    setConnectionSuccessTag();
}

function onWebSocketClose(event){
    alert("与websocket服务器的连接中断: ", event.reason);
}

function onWebSocketMessage(event){
    var message = event.data;
    var tmp_json_object = JSON.parse(message);

    if(tmp_json_object.msg_type == 2){   //normal message type
        if(tmp_json_object.content_type == 2){
            localPeerConnection.addIceCandidate(tmp_json_object)
	}else if(tmp_json_object.content_type == 1){
            localPeerConnection.setRemoteDescription(tmp_json_object)
             localPeerConnection.createAnswer({offerToReceiveVideo: 1})
		.then(function(answer){
                    localPeerConnection.setLocalDescription(answer);
		    let tmp_json_object = answer.toJSON();
                    tmp_json_object.msg_type = 2;
                    tmp_json_object.client_id = userId;
		    tmp_json_object.client_type = 1;
		    tmp_json_object.content_type = 1;
		    websocket.send(JSON.stringify(tmp_json_object));
		});
		//.catch(
                //    (error)=>{
                //        alert("webrtc握手过程发生错误", error);
		//    }
		//);
	}
    }else if(tmp_json_object.msg_type == 1){  //handshake message type
        setSuccessTag();
    }else if(tmp_json_object.msg_type == 3){  //error message type
        alert("websocket 传输发生错误: ", tmp_json_object.extra);
    }
}

function onWebSocketError(event){
    alert("与websocket服务器的连接发生错误: ", event);
}

//websocket functions area stop


//webrtc functions area start

function onIceCandidate(event){
    if(event.candidate == null)
        return;
    let tmp_candidate = event.candidate; 
    let tmp_json_object = tmp_candidate.toJSON();
    tmp_json_object.msg_type = 2;
    tmp_json_object.client_id = userId;
    tmp_json_object.client_type = 1;
    tmp_json_object.content_type = 2;

    websocket.send(JSON.stringify(tmp_json_object));
}

function onTrack(event){
    console.log(event);
    document.getElementById("video_container").srcObject = new MediaStream();
    document.getElementById("video_container").srcObject.addTrack(event.track);
}

function onAddIceCandidateError(error){
    alert("IceCandidate 添加失败，可能会影响正常工作: ", error.name);
}

//webrtc functions area stop
