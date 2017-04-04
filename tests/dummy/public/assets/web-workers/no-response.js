self.addEventListener('message', function(e) {
  var data = e.data;

  postMessage(true);
}, false);

