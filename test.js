/* eslint-env qunit */
'use strict';

function load(path) {
  const obj = require(path);
  for (const key in obj) {
    global[key] = obj[key];
  }
  return obj;
}

const alert = console.log;
const QUnit = load('qunit');

function hook() {
  const failures = [];
  QUnit.log(function (details) {
    if (!details.result) {
      failures.push(details);
    }
  });
  QUnit.done(function (details) {
    details.failures = failures;
    alert(JSON.stringify(details));
  });
  QUnit.start();
}

load('./src/htmlminifier');
require(process.argv[2]);
hook();
