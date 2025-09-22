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
var mainWs;
var wsConnected = 0;
var mainWsConnected = 0;
var IPs = ["192.168.43.1", "localhost"];
var status = {}

var wheel = 0;
var speed = 0;
var isBackwards = 0;

const CONTROLLERMODE_WHEEL = 0;
const CONTROLLERMODE_CONTROLLER = 1;
const CONTROLLERMODE_CONTROLLERGYRO = 2;
const DRIVEMODE_TANK = 0;
const DRIVEMODE_SWERVE = 1;

var controllerMode = 0;
var driveMode = 0;

var wsReconnectTimeout = 2;

function connectWs() {
	wsReconnectTimeout--;
	if (wsReconnectTimeout < 1) return;
	console.log("Connecting...");
	ws = new WebSocket(`ws://${IPs[wsReconnectTimeout % IPs.length]}:8000/`);
	if (mainWs) mainWs.close();
	mainWs = new WebSocket(`ws://localhost:3001/`);
	mainWs.onclose = onclose;
	mainWs.onopen = mainOnOpen;
	mainWs.onmessage = mainMessage;
	ws.onopen = onopen;
	ws.onclose = onclose;
	ws.onmessage = onmessage;
}
connectWs();

function mainOnOpen() {
	mainWsConnected = 1;
	console.log("Connected to server");
}

function mainMessage(e) {
	const data = JSON.parse(e.data);
	if (data.speed == undefined) return console.log("no speed");
	if (data.wheel == undefined) return console.log("no wheel");
	var accelVal, breakVal;
	if (data.isBackwards != undefined) isBackwards = data.isBackwards;
	if (data.accelVal != undefined) accelVal = data.accelVal;
	if (data.breakVal != undefined) breakVal = data.breakVal;
	if (data.controllerMode != undefined) controllerMode = data.controllerMode;
	if (data.driveMode != undefined) driveMode = data.driveMode;
	speed = data.speed;
	wheel = data.wheel;

	var wheelsSpeed = calcWheelSpeed(wheel, speed, isBackwards);
	console.log({ wheelsSpeed, accelVal, breakVal, speed, isBackwards });

	controller.state.gamepad1.left_stick_x = wheelsSpeed.left;
	controller.state.gamepad1.left_stick_y = wheelsSpeed.right;
	sendControllerPos();
}

setInterval(() => {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({
			type: "GET_ROBOT_STATUS"
		}));
	}
}, 1000)


function map(input, input_start, input_end, output_start, output_end) {
	return output_start + ((output_end - output_start) / (input_end - input_start)) * (input - input_start)
}

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

	if (driveMode == DRIVEMODE_TANK) {
		var leftX = axes[0];
		var leftY = -axes[1];
		var rightX = axes[2];
		var rightY = axes[3]

		controller.state.gamepad1.left_stick_x = leftY + leftX; // Left wheel
		controller.state.gamepad1.left_stick_y = leftY - leftX; // Right wheel
		controller.state.gamepad1.right_stick_x = rightX; // Intake
		controller.state.gamepad1.right_stick_y = rightY; // Outtake
		sendControllerPos();

		mainWs.send(JSON.stringify({
			controllerMode,
			leftX,
			leftY,
			rightX,
			rightY,
		}))
		return;
	}

	if (driveMode != DRIVEMODE_SWERVE) return console.log("Bad drive mode:", driveMode);

	mainWs.send(JSON.stringify({
		controllerMode,
		accelVal: gasFunc(map(axes[1], 1, -1, 0, 1)),
		breakVal: 1 - constrain(axes[2], 0, 1),
		wheel: axes[0],
	}));
}, 20)

function gasFunc(value) {
	return value * Math.pow(Math.E, (-Math.pow(speed - 1, 2)));
}

function constrain(value, min, max) {
	return value < min ? min : (value > max ? max : value);
}

function setControllerMode(newMode) {
	controllerMode = newMode;
	mainWs.send(JSON.stringify({
		controllerMode
	}));
}