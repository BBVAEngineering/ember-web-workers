postMessage(true);

let index = 0;
setInterval(function() {
  postMessage({ index: index });
  index++;
}, 500);
