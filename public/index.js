class ControllerState {
	constructor() {
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



var ws;
var wsConnected = 0;
var IPs = ["192.168.43.1", "localhost"];
var status = {}

var controllerMode = 0;

var wsReconnectTimeout = 20;

function connectWs() {
	wsReconnectTimeout--;
	if (wsReconnectTimeout < 1) return;
	console.log("Connecting...");
	ws = new WebSocket(`ws:/${IPs[wsReconnectTimeout % IPs.length]}:8000/`);
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

const deceleration = 0.001; // Every 10 ms

var accelVal = 0; // Value of accelerator pedal (0 to 1)
var breakVal = 0; // Value of break pedal (0 to 1)
var isBackwards = 0; // 0 for forward 1 for backwards
var wheel = 0;

var speed = 0;

function map(input, input_start, input_end, output_start, output_end) {
	return output_start + ((output_end - output_start) / (input_end - input_start)) * (input - input_start)
}

setInterval(() => {
	if(!wsConnected) return;

	if(controllerMode) return;

	speed += (accelVal / 100);
	speed -= breakVal;
	speed -= deceleration;

	if (speed < 0) speed = 0;
	if (speed > 1) speed = 1;

	var wheelsSpeed = calcWheelSpeed(wheel, speed, isBackwards);
	console.log({wheelsSpeed, accelVal, breakVal, speed})

	controller.state.gamepad1.left_stick_x = wheelsSpeed.left;
	controller.state.gamepad1.left_stick_y = wheelsSpeed.right;
	sendControllerPos();
}, 10)

function sendControllerPos() {
	if (ws && wsConnected) {
		ws.send(JSON.stringify(controller.state));
	}
}

function calcWheelSpeed(wheelPos, forward, dir) {
	// Calculate left and right wheel speeds based on wheel postiion (-1=-90deg, 0=0deg, 1=90deg)
	// Fully left or right should mean that the wheel stays in one position and the robot turns around it
	// Wheels should only move forward, never backwards, but it should be able to run at max speed when going forwards
	// forward is a value from 0 to 1 that indicates how fast the robot should move forward
	// returns an object with left and right wheel speeds from 0 to 1
	// e.g. {left: 0.5, right: 1}
	if (dir == 1) forward = -forward
	return {
		left: forward * (wheelPos <= 0 ? 1 : 1 - wheelPos),
		right: forward * (wheelPos >= 0 ? 1 : 1 + wheelPos)
	};
};

var controller = new ControllerState();
function onopen() {
	wsConnected = true;
	console.log("open");
	/* 	ws.send(JSON.stringify({ "type": "INIT_OP_MODE", "opModeName": "KutEjsz" }));
		ws.send(JSON.stringify({ "type": "START_OP_MODE" })); */
	/* 	controller.state.gamepad1.left_stick_x = 1;
		controller.state.gamepad1.left_stick_y = 1; */
	ws.send(JSON.stringify(controller.state));
	setTimeout(() => {
		controller.state.gamepad1.left_stick_x = 0;
		controller.state.gamepad1.left_stick_y = 0;
		ws.send(JSON.stringify(controller.state));
	}, 1000);
}

function onclose() {
	wsConnected = false;
	console.log("closed");
	connectWs();
}

const gamepads = {};

window.addEventListener("gamepadconnected", (e) => {
	const gamepad = e.gamepad;
	console.log(
		"Gamepad connected at index %d: %s. %d buttons, %d axes.",
		e.gamepad.index,
		e.gamepad.id,
		e.gamepad.buttons.length,
		e.gamepad.axes.length,
	);

	gamepads[gamepad.index] = gamepad;
});

window.addEventListener("gamepaddisconnected", (e) => {
	const gamepad = e.gamepad;
	console.log(
		"Gamepad disconnected from index %d: %s",
		e.gamepad.index,
		e.gamepad.id,
	);

	delete gamepads[gamepad.index];
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


setInterval(() => {
	if (navigator.getGamepads()[0] == null) return;

	var axes = navigator.getGamepads()[0].axes;
	axes = axes.map(function (each_element) {
		return Number(each_element.toFixed(4));
	});

	if(controllerMode){
		var leftX = axes[0];
		var leftY = axes[1];
		
		controller.state.gamepad1.right_stick_x = axes[2]
		controller.state.gamepad1.left_stick_x = leftY+leftX; // Left wheel
		controller.state.gamepad1.left_stick_y = leftY-leftX; // Right wheel
		sendControllerPos();
		//console.log("controller mode", controller.state.gamepad1.left_stick_x, controller.state.gamepad1.left_stick_y)
		return;
	}

	accelVal = gasFunc(map(axes[1], 1, -1, 0, 1));
	breakVal = 1 - constrain(axes[2], 0, 1);
	wheel = axes[0];
}, 20)

function gasFunc(value) {
	return value * Math.pow(Math.E, (-Math.pow(speed - 1, 2)));
}

function constrain(value, min, max){
 return value < min ? min : (value > max ? max : value);
}