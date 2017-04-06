postMessage(true);

var index = 0;
setInterval(function() {
  postMessage({ index: index });
  index++;
}, 500);
