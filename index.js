const express = require("express");
const app = express();
const path = require("path");

const { WebSocketServer } = require("ws");

const deceleration = 0.001; // Every 10 ms

var accelVal = 0; // Value of accelerator pedal (0 to 1)
var breakVal = 0; // Value of break pedal (0 to 1)
var isBackwards = 0; // 0 for forward 1 for backwards
var wheel = 0;

const CONTROLLERMODE_WHEEL = 0;
const CONTROLLERMODE_CONTROLLER = 1;
const CONTROLLERMODE_CONTROLLERGYRO = 2;
const DRIVEMODE_TANK = 0;
const DRIVEMODE_SWERVE = 1;

var controllerMode = 0;
var driveMode = 0;

var speed = 0;


const wss = new WebSocketServer({ port: 3001 });
wss.on("connection", (ws) => {
	console.log("New connection!");
	ws.on("message", (e) => {
		const data = JSON.parse(e.toString());
		console.log(data);
		if (data.wheel != undefined) wheel = data.wheel;
		if (data.isBackwards != undefined) isBackwards = data.isBackwards;
		if (data.accelVal != undefined) accelVal = data.accelVal;
		if (data.breakVal != undefined) breakVal = data.breakVal;
		if (data.controllerMode != undefined) controllerMode = data.controllerMode
	})
});



setInterval(() => {
	if (wss.clients.size < 1) return;

	if (controllerMode != CONTROLLERMODE_WHEEL) return;

	speed += (accelVal / 100);
	speed -= breakVal;
	speed -= deceleration;

	if (speed < 0) speed = 0;
	if (speed > 1) speed = 1;

	wss.clients.forEach((ws) => {
		ws.send(JSON.stringify({ speed, wheel, accelVal, breakVal, isBackwards }));
	})
}, 10)



app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});