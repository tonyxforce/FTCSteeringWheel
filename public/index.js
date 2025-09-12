class ControllerState{
	constructor(){
		this.state = {
			"type": "RECEIVE_GAMEPAD_STATE",
			"gamepad1": {
				"left_stick_x": 0,
				"left_stick_y": 0,
				"right_stick_x": 0,
				"right_stick_y": 0,
				"dpad_up": false,
				"dpad_down": false,
				"dpad_left": false,
				"dpad_right": false,
				"a": false,
				"b": false,
				"x": false,
				"y": false,
				"guide": false,
				"start": false,
				"back": false,
				"left_bumper": false,
				"right_bumper": false,
				"left_stick_button": false,
				"right_stick_button": false,
				"left_trigger": 0,
				"right_trigger": 0
			},
			"gamepad2": {
				"left_stick_x": 0,
				"left_stick_y": 0,
				"right_stick_x": 0,
				"right_stick_y": 0,
				"dpad_up": false,
				"dpad_down": false,
				"dpad_left": false,
				"dpad_right": false,
				"a": false,
				"b": false,
				"x": false,
				"y": false,
				"guide": false,
				"start": false,
				"back": false,
				"left_bumper": false,
				"right_bumper": false,
				"left_stick_button": false,
				"right_stick_button": false,
				"left_trigger": 0,
				"right_trigger": 0
			}
		};
	}
}

function connectWs() {
	wsReconnectTimeout--;
	if (ws)
		console.log("Connecting...");
	ws = new WebSocket(`ws:/${ip}:8000/`);
	ws.onopen = onopen;
	ws.onclose = onclose;
	ws.onmessage = onmessage;
}
connectWs();

setInterval(() => {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({
			type: "GET_ROBOT_STATUS"
		}));
	}
}, 1000)


function calcWheelSpeed(wheelPos, forward) {
	// Calculate left and right wheel speeds based on wheel postiion (-1=-90deg, 0=0deg, 1=90deg)
	// Fully left or right should mean that the wheel stays in one position and the robot turns around it
	// Wheels should only move forward, never backwards
	// forward is a value from 0 to 1 that indicates how fast the robot should move forward
	// returns an object with left and right wheel speeds from 0 to 1
	// e.g. {left: 0.5, right: 1}
	return {
		left: forward * (1 - wheelPos) / 2,
		right: forward * (1 + wheelPos) / 2
	};
};

function onopen() {
	console.log("open");
	ws.send(JSON.stringify({ "type": "INIT_OP_MODE", "opModeName": "camtest2" }));
	ws.send(JSON.stringify({ "type": "START_OP_MODE" }));
	var controller = new ControllerState();
	controller.state.controller1.left_stick_x = 1;
	ws.send(JSON.stringify(controller.state));
	setTimeout(() => {
	controller.state.controller1.left_stick_x = 0;
	ws.send(JSON.stringify(controller.state));
	}, 1000);
}

function onclose() {
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

function onmessage(e) {
	var data = JSON.parse(e.data);
	switch (data.type) {
		case "RECEIVE_ROBOT_STATUS": {
			status = data.status
			break;
		};
		case "RECEIVE_IMAGE": {
			var img = document.getElementById("camimg");
			img.src = "data:image/jpeg;base64," + data.imageString;
			break;
		}
		default: {
			console.log(data);
		};

	}
}