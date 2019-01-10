self.addEventListener('message', (e) => {
	postMessage(e.data);
}, false);

postMessage(true);
