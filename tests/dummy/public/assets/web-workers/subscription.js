self.addEventListener('message', function(e) {
  var data = e.data;
  var index = 0;

  postMessage(true);

  setInterval(function() {
    postMessage({ name: 'subscription', index: index });
    index++;
  }, 100);
}, false);

