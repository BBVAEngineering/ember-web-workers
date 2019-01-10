self.addEventListener('message', (e) => {
	const data = e.data;
	const port = e.ports[0];

	port.postMessage({ index: data.index + 1 });
}, false);

postMessage(true);
