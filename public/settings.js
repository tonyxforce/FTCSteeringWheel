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
}
function onerror(e) {
	console.log("error", e);
}
