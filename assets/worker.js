(function() {
  'use strict';

  importScripts('../dist/htmlminifier.min.js');
  var minify = require('html-minifier-terser').minify;
  addEventListener('message', function(event) {
    try {
      var options = event.data.options;
      options.log = function(message) {
        console.log(message);
      };
      minify(event.data.value, options).then(this.postMessage)
    }
    catch (err) {
      postMessage({
        error: err + ''
      });
    }
  });
  postMessage(null);
})();
