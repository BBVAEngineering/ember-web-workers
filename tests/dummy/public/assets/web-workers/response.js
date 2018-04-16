self.addEventListener('message', function(e) {
  postMessage(e.data);
}, false);

postMessage(true);
