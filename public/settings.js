var url = new URL(document.URL);

const CONTROLLERMODE_WHEEL = 0;
const CONTROLLERMODE_CONTROLLER = 1;
const CONTROLLERMODE_CONTROLLERGYRO = 2;
const DRIVEMODE_TANK = 0;
const DRIVEMODE_SWERVE = 1;

var wsTriesLeft = 20;

var wsPath = `ws://${url.host.split(":")[0]}:3001/`;

var speed = 0;
var wheel = 0;
var breakVal = 0;
var accelVal = 0;
var deceleration = 0;

var leftSpeed = 0;
var rightSpeed = 0;

var ws = new WebSocket(wsPath);
ws.onopen = onopen;
ws.onclose = onclose;
ws.onmessage = onmessage;
ws.onerror = onerror;

function reconnect() {
	wsTriesLeft--;
	ws = new WebSocket(wsPath);
	ws.onopen = onopen;
	ws.onclose = onclose;
	ws.onmessage = onmessage;
	ws.onerror = onerror;
}

function onopen() {
	console.log("open!");
	[].forEach.call(document.querySelectorAll("input"), (e) => {
		e.disabled = false;
	});
}
function onclose() {
	console.log("close!");
	if (wsTriesLeft > 0) reconnect();
	[].forEach.call(document.querySelectorAll("input"), (e) => {
		e.disabled = true;
	});
}

[].forEach.call(document.querySelectorAll("input"), (e) => {
	e.disabled = true;
});

function ß(select) {
	return document.querySelector(select);
}

function onmessage(e) {
	try {
		var data = JSON.parse(e.data);
	} catch (e) {
		console.log("error while parsing message", e);
		var data = { error: 1 };
	}
	//console.log(data);
	if (data.driveMode != undefined) {
		driveMode = data.driveMode;
		document.forms[0].elements["dtype"].value = driveMode + "";
	}
	if (data.controllerMode != undefined) {
		controllerMode = data.controllerMode;
		document.forms[0].elements["ctype"].value = controllerMode + "";
	}
	if (data.gasMode != undefined) {
		gasMode = data.gasMode;
		document.forms[0].elements["gtype"].value = gasMode + "";
	}
	if (
		controllerMode == CONTROLLERMODE_WHEEL ||
		controllerMode == CONTROLLERMODE_CONTROLLERGYRO
	) {
		document.querySelector("#tankDrive").disabled = true;
	} else {
		document.querySelector("#tankDrive").disabled = false;
	}

	if (data.wheel != undefined) {
		wheel = data.wheel;
		ß("#wheel").innerText = `Wheel: ${wheel}`;
	}
	if (data.speed != undefined) {
		speed = data.speed;
		ß("#speed").innerText = `Speed: ${speed}`;
	}
	if (data.accelVal != undefined) {
		accelVal = data.accelVal;
		ß("#AccelVal").innerText = `AccelVal: ${accelVal}`;
		document.forms[0].elements["accelVal"].value = accelVal;
	}
	if (data.breakVal != undefined) {
		breakVal = data.breakVal;
		ß("#breakVal").innerText = `BreakVal: ${breakVal}`;
	}
	if (data.leftSpeed != undefined) {
		leftSpeed = data.leftSpeed;
		ß("#leftSpeed").innerText = `LeftSpeed: ${leftSpeed}`;
	}
	if (data.rightSpeed != undefined) {
		rightSpeed = data.rightSpeed;
		ß("#rightSpeed").innerText = `Rightspeed: ${rightSpeed}`;
	}
	if (data.accelFactor != undefined) {
		accelFactor = data.accelFactor;
		ß("#accelIDDisp").innerText = `${accelFactor}%`;
	}
	if (data.accelID != undefined) {
		accelID = data.accelID;
		document.forms[0].elements["accelID"].value = accelID;
	}
	if (data.deceleration != undefined) {
		deceleration = data.deceleration;
		document.forms[0].elements["deceleration"].value = deceleration;
		ß("#Deceleration").innerText = `Deceleration: ${deceleration}`;
	}
}
function onerror(e) {
	console.log("error", e);
}

var controllerMode = 0;
var driveMode = 0;
var gasMode = 0;
var accelID = 0;
var accelFactor = 0;

/* controllerModeChanged();
driveModeChanged(); */

function controllerModeChanged() {
	controllerMode = document.forms[0].elements["ctype"].value * 1;
	ws.send(JSON.stringify({ controllerMode }));
}

function driveModeChanged() {
	driveMode = document.forms[0].elements["dtype"].value * 1;
	ws.send(JSON.stringify({ driveMode }));
}

function gasModeChanged() {
	gasMode = document.forms[0].elements["gtype"].value * 1;
	ws.send(JSON.stringify({ gasMode }));
}

document
	.querySelector("#wheelDrive")
	.addEventListener("click", controllerModeChanged);
document
	.querySelector("#controllerDrive")
	.addEventListener("click", controllerModeChanged);
document
	.querySelector("#controllerGyroDrive")
	.addEventListener("click", controllerModeChanged);

document
	.querySelector("#tankDrive")
	.addEventListener("click", driveModeChanged);
document
	.querySelector("#swerveDrive")
	.addEventListener("click", driveModeChanged);

document.querySelector("#speedDrive").addEventListener("click", gasModeChanged);
document.querySelector("#accelDrive").addEventListener("click", gasModeChanged);
document.querySelector("#accelID").addEventListener("input", () => {
	accelID = document.forms[0].elements["accelID"].value * 1;
	ws.send(JSON.stringify({ accelID }));
});
document.querySelector("#accelVal").addEventListener("input", () => {
	accelVal = document.forms[0].elements["accelVal"].value * 1;
	ws.send(JSON.stringify({ axes: [undefined, accelVal] }));
});
document.querySelector("#deceleration").addEventListener("input", () => {
	deceleration = document.querySelector("#deceleration").value * 1;
	ws.send(JSON.stringify({ deceleration }));
});