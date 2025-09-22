var url = new URL(document.URL);

var wsTriesLeft = 20;

var wsPath = `ws://${url.host.split(":")[0]}:3001/`;

var ws = new WebSocket(wsPath);
ws.onopen = onopen;
ws.onclose = onclose;
ws.onmessage = onmessage;
ws.onerror = onerror;

function reconnect() {
	wsTriesLeft--;
	var ws = new WebSocket(wsPath);
	ws.onopen = onopen;
	ws.onclose = onclose;
	ws.onmessage = onmessage;
	ws.onerror = onerror;
}

function onopen() {
	console.log("open!");
}
function onclose() {
	console.log("close!");
	if (wsTriesLeft > 0) reconnect();
}
function onmessage(e) {
	try {
		var data = JSON.parse(e.data);
	} catch (e) {
		console.log("error while parsing message", e);
		var data = { error: 1 };
	}
	console.log(data)
	if(data.driveMode != undefined) document.forms[0].elements["dtype"].value = data.driveMode+"";
	if(data.controllerMode != undefined) document.forms[0].elements["ctype"].value = data.controllerMode+"";
}
function onerror(e) {
	console.log("error", e);
}

var cType = 0;
var dType = 0;

function controllerModeChanged(){
	cType = document.forms[0].elements["ctype"].value*1;
	ws.send(JSON.stringify({controllerMode:cType}));
}

function driveModeChanged(){
	dType = document.forms[0].elements["dtype"].value*1;
	ws.send(JSON.stringify({driveMode:dType}));
};

document.querySelector("#wheelDrive").addEventListener("click", controllerModeChanged);
document.querySelector("#controllerDrive").addEventListener("click", controllerModeChanged);
document.querySelector("#controllerGyroDrive").addEventListener("click", controllerModeChanged);

document.querySelector("#tankDrive").addEventListener("click", driveModeChanged);
document.querySelector("#swerveDrive").addEventListener("click", driveModeChanged);
