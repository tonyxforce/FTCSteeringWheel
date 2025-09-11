

var ws;
var ip = "localhost";
var status = {}

function connectWs() {
	console.log("Connecting...");
	ws = new WebSocket(`ws:/${ip}:8000/`);
}
connectWs();

setInterval(() => {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({
			type: "GET_ROBOT_STATUS"
		}));
	}
}, 1000)

ws.onopen = ()=>{
	console.log("open");
}

ws.onclose = ()=>{
	console.log("closed");
	connectWs();
}

ws.onmessage = (e)=>{
	var data = JSON.parse(e.data);
	switch(data.type){
		case "RECEIVE_ROBOT_STATUS":{
			status = data.status
			break;
		};
		default:{
			console.log(data);
		};

	}
}

/* document.body.addEventListener("load", ()=>{

}) */