

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
	ws.send(JSON.stringify({ "type": "INIT_OP_MODE", "opModeName": "camtest2" }));
	ws.send(JSON.stringify({ "type": "START_OP_MODE" }));
}

ws.onclose = ()=>{
	console.log("closed");
	connectWs();
}

window.addEventListener("gamepadconnected", (e) => {
	console.log(
		"Gamepad connected at index %d: %s. %d buttons, %d axes.",
		e.gamepad.index,
		e.gamepad.id,
		e.gamepad.buttons.length,
		e.gamepad.axes.length,
	);
});

window.addEventListener("gamepaddisconnected", (e) => {
	console.log(
		"Gamepad disconnected from index %d: %s",
		e.gamepad.index,
		e.gamepad.id,
	);
});

ws.onmessage = (e)=>{
	var data = JSON.parse(e.data);
	switch(data.type){
		case "RECEIVE_ROBOT_STATUS":{
			status = data.status
			break;
		};
		case "RECEIVE_IMAGE": {
			var img = document.getElementById("camimg");
			img.src = "data:image/jpeg;base64," + data.imageString;
			break;
			}
		default:{
			console.log(data);
		};

	}
}