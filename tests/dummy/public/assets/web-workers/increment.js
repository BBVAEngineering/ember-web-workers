self.addEventListener('message', function(e) {
  var data = e.data;
  var port = e.ports[0];

  port.postMessage({ index: data.index + 1 });
}, false);

postMessage(true);
