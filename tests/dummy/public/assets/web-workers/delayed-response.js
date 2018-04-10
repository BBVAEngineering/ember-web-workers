/*eslint- */
self.addEventListener('message', function (e) {
	const data = e.data;

	setTimeout(function () {
		postMessage(data);
	}, 100);
}, false);

postMessage(true);
