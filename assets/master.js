(function() {
  'use strict';

  var minify = (function() {
    var minify = require('html-minifier-terser').minify;
    return function(value, options, callback, errorback) {
      options.log = function(message) {
        console.log(message);
      };
      var minified;
      try {
        minified = minify(value, options);
      }
      catch (err) {
        return errorback(err);
      }
      callback(minified);
    };
  })();
  if (typeof Worker === 'function') {
    var worker = new Worker('assets/worker.js');
    worker.onmessage = function() {
      minify = function(value, options, callback, errorback) {
        worker.onmessage = function(event) {
          var data = event.data;
          if (data.error) {
            errorback(data.error);
          }
          else {
            callback(data);
          }
        };
        worker.postMessage({
          value: value,
          options: options
        });
      };
    };
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHTML(str) {
    return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function forEachOption(fn) {
    [].forEach.call(byId('options').getElementsByTagName('input'), fn);
  }

  function getOptions() {
    var options = {};
    forEachOption(function(element) {
      var key = element.id;
      var value;
      if (element.type === 'checkbox') {
        value = element.checked;
      }
      else {
        value = element.value.replace(/^\s+|\s+$/, '');
        if (!value) {
          return;
        }
      }
      switch (key) {
        case 'maxLineLength':
          value = parseInt(value);
          break;
        case 'processScripts':
          value = value.split(/\s*,\s*/);
      }
      options[key] = value;
    });
    return options;
  }

  function commify(str) {
    return String(str)
      .split('').reverse().join('')
      .replace(/(...)(?!$)/g, '$1,')
      .split('').reverse().join('');
  }

  byId('minify-btn').onclick = function() {
    byId('minify-btn').disabled = true;
    var originalValue = byId('input').value;
    minify(originalValue, getOptions(), function(minifiedValue) {
      var diff = originalValue.length - minifiedValue.length;
      var savings = originalValue.length ? (100 * diff / originalValue.length).toFixed(2) : 0;

      byId('output').value = minifiedValue;

      byId('stats').innerHTML =
        '<span class="success">' +
          'Original size: <strong>' + commify(originalValue.length) + '</strong>' +
          '. Minified size: <strong>' + commify(minifiedValue.length) + '</strong>' +
          '. Savings: <strong>' + commify(diff) + ' (' + savings + '%)</strong>.' +
        '</span>';
      byId('minify-btn').disabled = false;
    }, function(err) {
      byId('output').value = '';
      byId('stats').innerHTML = '<span class="failure">' + escapeHTML(err) + '</span>';
      byId('minify-btn').disabled = false;
    });
  };

  byId('select-all').onclick = function() {
    forEachOption(function(element) {
      if (element.type === 'checkbox') {
        element.checked = true;
      }
    });
    return false;
  };

  byId('select-none').onclick = function() {
    forEachOption(function(element) {
      if (element.type === 'checkbox') {
        element.checked = false;
      }
      else {
        element.value = '';
      }
    });
    return false;
  };

  var defaultOptions = getOptions();
  byId('select-defaults').onclick = function() {
    for (var key in defaultOptions) {
      var element = byId(key);
      element[element.type === 'checkbox' ? 'checked' : 'value'] = defaultOptions[key];
    }
    return false;
  };
})();
