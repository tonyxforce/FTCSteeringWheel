class ControllerState {
	constructor() {
		this.state = {
			type: "RECEIVE_GAMEPAD_STATE",
			gamepad1: {
				left_stick_x: 0,
				left_stick_y: 0,
				right_stick_x: 0,
				right_stick_y: 0,
				dpad_up: false,
				dpad_down: false,
				dpad_left: false,
				dpad_right: false,
				a: false,
				b: false,
				x: false,
				y: false,
				guide: false,
				start: false,
				back: false,
				left_bumper: false,
				right_bumper: false,
				left_stick_button: false,
				right_stick_button: false,
				left_trigger: 0,
				right_trigger: 0,
			},
			gamepad2: {
				left_stick_x: 0,
				left_stick_y: 0,
				right_stick_x: 0,
				right_stick_y: 0,
				dpad_up: false,
				dpad_down: false,
				dpad_left: false,
				dpad_right: false,
				a: false,
				b: false,
				x: false,
				y: false,
				guide: false,
				start: false,
				back: false,
				left_bumper: false,
				right_bumper: false,
				left_stick_button: false,
				right_stick_button: false,
				left_trigger: 0,
				right_trigger: 0,
			},
		};
	}
}

var ws;
var mainWs;
var wsConnected = 0;
var mainWsConnected = 0;
var IPs = ["192.168.43.1"];
var status = {};

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

var wsReconnectTimeout = 20;

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

var leftSpeed = 0;
var rightSpeed = 0;
var intakeSpeed = 0;
var outtakeSpeed = 0;

function mainOnOpen() {
	mainWsConnected = 1;
	console.log("Connected to server");
}

function mainMessage(e) {
	const data = JSON.parse(e.data);
	if (data.controllerMode != undefined) controllerMode = data.controllerMode;
	if (data.driveMode != undefined) driveMode = data.driveMode;
	var wheelsSpeed = { left: 0, right: 0 };

	if (data.rightSpeed != undefined) rightSpeed = data.rightSpeed;
	if (data.leftSpeed != undefined) leftSpeed = data.leftSpeed;
	if (data.intakeSpeed != undefined) intakeSpeed = data.intakeSpeed;
	if (data.outtakeSpeed != undefined) outtakeSpeed = data.outtakeSpeed;

	controller.state.gamepad1.left_stick_x = leftSpeed; // Left wheel
	controller.state.gamepad1.left_stick_y = rightSpeed; // Right wheel
	controller.state.gamepad1.right_stick_x = intakeSpeed; // Intake
	controller.state.gamepad1.right_stick_y = outtakeSpeed; // Outtake

	sendControllerPos();
}

setInterval(() => {
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(
			JSON.stringify({
				type: "GET_ROBOT_STATUS",
			})
		);
	}
}, 1000);

function map(input, input_start, input_end, output_start, output_end) {
	return (
		output_start +
		((output_end - output_start) / (input_end - input_start)) *
		(input - input_start)
	);
}

function sendControllerPos() {
	if (ws && wsConnected && ws.readyState == WebSocket.OPEN) {
		ws.send(JSON.stringify(controller.state));
	}
}


var controller = new ControllerState();
function onopen() {
	wsConnected = true;
	console.log("open");
	ws.send(JSON.stringify({ type: "INIT_OP_MODE", opModeName: "KutEjsz" }));
	ws.send(JSON.stringify({ type: "START_OP_MODE" }));
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
		e.gamepad.axes.length
	);

	gamepads[gamepad.index] = gamepad;
});

window.addEventListener("gamepaddisconnected", (e) => {
	const gamepad = e.gamepad;
	console.log(
		"Gamepad disconnected from index %d: %s",
		e.gamepad.index,
		e.gamepad.id
	);

	delete gamepads[gamepad.index];
});

function onmessage(e) {
	var data = JSON.parse(e.data);
	switch (data.type) {
		case "RECEIVE_ROBOT_STATUS": {
			status = data.status;
			break;
		}
		case "RECEIVE_IMAGE": {
			var img = document.getElementById("camimg");
			img.src = "data:image/jpeg;base64," + data.imageString;
			break;
		}
		default: {
			console.log(data);
		}
	}
}

setInterval(() => {
	var gamepad = navigator.getGamepads().find((e) => e != undefined);
	if (gamepad == null) return;

	var axes = gamepad.axes;
	axes = axes.map(function (each_element) {
		return Number(each_element.toFixed(4));
	});
	console.log(axes);
	mainWs.send(
		JSON.stringify({
			axes,
		})
	);
}, 20);

function setControllerMode(newMode) {
	controllerMode = newMode;
	mainWs.send(
		JSON.stringify({
			controllerMode,
		})
	);
}
