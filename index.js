const express = require("express");
const app = express();
const path = require("path");

const { WebSocketServer } = require("ws");

var deceleration = 0.001; // Every 10 ms

var accelVal = 0; // Value of accelerator pedal (0 to 1)
var breakVal = 0; // Value of break pedal (0 to 1)
var accelFactor = 1; // + for forward - for backwards
var wheel = 0;

var accelID = 1;
var accelValues = [-1, 1, 10, 100];

const CONTROLLERMODE_WHEEL = 0;
const CONTROLLERMODE_CONTROLLER = 1;
const CONTROLLERMODE_CONTROLLERGYRO = 2;
const DRIVEMODE_TANK = 0;
const DRIVEMODE_SWERVE = 1;
const GASMODE_SPEED = 0;
const GASMODE_ACCEL = 1;

var axes = [0, 0, 0, 0];

var leftX = 0;
var leftY = 0;
var rightX = 0;
var rightY = 0;

var intakeSpeed = 0;
var outtakeSpeed = 0;

var controllerMode = CONTROLLERMODE_WHEEL;
var driveMode = DRIVEMODE_TANK;
var gasMode = GASMODE_SPEED;

var speed = 0;

const wss = new WebSocketServer({ port: 3001 });
wss.on("connection", (ws) => {
	console.log("New connection!");
	ws.on("message", (e) => {
		var data = {};
		try {
			data = JSON.parse(e.toString());
		} catch (e) {
			console.log("Error parsing JSON", e);
			ws.send(JSON.stringify({ error: 1, msg: e.message }));
		}
		//console.log(data);
		if (data.controllerMode != undefined)
			controllerMode = data.controllerMode;
		if (data.driveMode != undefined) driveMode = data.driveMode;
		if (data.gasMode != undefined) gasMode = data.gasMode;
		if (data.axes != undefined) {
			var tempAxes = data.axes;
			tempAxes.forEach((e, i) => {
				if (e != undefined) axes[i] = e;
			});
		}
		if (data.deceleration != undefined) deceleration = data.deceleration;
		if (data.accelID != undefined) accelID = data.accelID;
		if (
			[CONTROLLERMODE_CONTROLLER, CONTROLLERMODE_CONTROLLERGYRO].includes(
				controllerMode
			)
		) {
			leftX = -axes[0];
			leftY = -axes[1];
			rightX = -axes[2];
			rightY = -axes[3];
			if (gasMode == GASMODE_ACCEL) {
				breakVal = Math.abs(rightY);
				accelVal = Math.abs(leftY);
			} else {
				breakVal = rightY;
				accelVal = leftY;
			}
			wheel = -leftX;
			intakeSpeed = -rightY;
			outtakeSpeedSpeed = -rightX;
		} else if (controllerMode == CONTROLLERMODE_WHEEL) {
			driveMode = DRIVEMODE_SWERVE;
			leftX = 0;
			leftY = 0;
			rightX = 0;
			rightY = 0;
			wheel = axes[0];
			accelVal = Math.abs(gasFunc(map(axes[1], 1, -1, 0, 1)));
			breakVal = Math.abs(1 - constrain(axes[2], 0, 1));
		} else {
			console.log("Bad controller mode:", controllerMode);
			controllerMode == CONTROLLERMODE_CONTROLLER;
		}

		if (controllerMode == CONTROLLERMODE_CONTROLLERGYRO) {
			driveMode = DRIVEMODE_SWERVE;
		}
	});
});

var leftSpeed = 0;
var rightSpeed = 0;

setInterval(() => {
	if (wss.clients.size < 1) return;
	accelFactor = accelValues[accelID];

	if (gasMode == GASMODE_ACCEL) {
		if (accelFactor > 0) {
			speed += (accelVal / 100) * accelFactor;
			speed -= breakVal * accelFactor;
			if (speed > 0) speed -= (deceleration) * accelFactor;
			if (speed > 0 && speed < (deceleration) * accelFactor)
				speed = 0;
		} else {
			speed -= (accelVal / 100) * -accelFactor;
			speed += breakVal * -accelFactor;
			if (speed < 0) speed += (deceleration / 100) * -accelFactor;
			if (speed < 0 && speed > (deceleration / 100) * -accelFactor)
				speed = 0;
		}

		speed = speed.toFixed(5);
		speed = speed * 1;

		if (isNaN(speed)) speed = 0;

		if (speed < -1) speed = -1;
		if (speed > 1) speed = 1;

		var wheelsSpeed = calcWheelSpeed(wheel, speed);
		leftSpeed = wheelsSpeed.left;
		rightSpeed = wheelsSpeed.right;
	} else {
		speed = accelVal * 1 * accelFactor;
		wheel = wheel * accelFactor;
		if(speed == 0) wheel = 0;
		leftSpeed = constrain(speed + wheel, -1, 1);
		rightSpeed = constrain(speed - wheel, -1, 1);
	}

	wss.clients.forEach((ws) => {
		ws.send(
			JSON.stringify({
				type: "state", // Read only
				error: 0, // Read only
				speed, // Read only, debug only
				wheel, // Read only, debug only
				axes,
				driveMode,
				controllerMode,
				gasMode,
				accelVal, // Read only, debug only
				breakVal, // Read only, debug only
				leftSpeed, // Read only
				rightSpeed, // Read only
				intakeSpeed, // Read only
				outtakeSpeed, // Read only
				accelFactor, // Read only, debug only
				accelID,
				deceleration,
			})
		);
	});
}, 10);

app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});

function gasFunc(value) {
	return value;
	return value * Math.pow(Math.E, -Math.pow(speed - 1, 2));
}

function constrain(value, min, max) {
	return value < min ? min : value > max ? max : value;
}

function calcWheelSpeed(wheelPos, forward) {
	// Calculate left and right wheel speeds based on wheel postiion (-1=-90deg, 0=0deg, 1=90deg)
	// Fully left or right should mean that the wheel stays in one position and the robot turns around it
	// Wheels should only move forward, never backwards, but it should be able to run at max speed when going forwards
	// forward is a value from 0 to 1 that indicates how fast the robot should move forward
	// returns an object with left and right wheel speeds from 0 to 1
	// e.g. {left: 0.5, right: 1}
	return {
		left: forward * (wheelPos <= 0 ? 1 : 1 - wheelPos),
		right: forward * (wheelPos >= 0 ? 1 : 1 + wheelPos),
	};
}

function map(input, input_start, input_end, output_start, output_end) {
	return (
		output_start +
		((output_end - output_start) / (input_end - input_start)) *
			(input - input_start)
	);
}
