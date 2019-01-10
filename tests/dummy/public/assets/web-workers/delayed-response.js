/* eslint- */
self.addEventListener('message', (e) => {
	const data = e.data;

	setTimeout(() => {
		postMessage(data);
	}, 100);
}, false);

postMessage(true);
