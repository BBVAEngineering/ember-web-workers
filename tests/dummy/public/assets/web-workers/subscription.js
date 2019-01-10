postMessage(true);

let index = 0;

setInterval(() => {
	postMessage({ index });
	index++;
}, 500);
