self.addEventListener('message', function(e) {
  var data = e.data;

  setTimeout(function() {
    postMessage(data);
  }, 100);
}, false);

postMessage(true);
