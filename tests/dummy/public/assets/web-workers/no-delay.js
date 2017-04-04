self.addEventListener('message', function(e) {
  var data = e.data;

  postMessage(true);

	postMessage({ name: 'no-delay', bar: 'bar' });
}, false);

