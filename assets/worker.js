importScripts('../dist/htmlminifier.min.js');

const { minify } = require('html-minifier-terser');

addEventListener('message', (event) => {
  try {
    const options = event.data.options;
    options.log = function (message) {
      console.log(message);
    };

    minify(event.data.value, options).then(this.postMessage);
  }
  catch (err) {
    postMessage({
      error: err + ''
    });
  }
});
