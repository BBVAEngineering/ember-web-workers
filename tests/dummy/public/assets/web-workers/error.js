self.addEventListener('message', function(e) {
  var data = e.data;

  postMessage(true);

	throw new Error('foo');
}, false);

