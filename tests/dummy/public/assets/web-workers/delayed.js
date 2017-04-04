self.addEventListener('message', function(e) {
  var data = e.data;

  postMessage(true);

  setTimeout(function() {
    	postMessage({ name: 'delayed', bar: 'bar' });
  }, 100);
}, false);

