#!/usr/bin/env node

import { spawn, fork } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import Progress from 'progress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = JSON.parse(await fs.readFile(path.join(__dirname, 'sites.json'), 'utf8'));
const fileNames = Object.keys(urls);

function git() {
  const args = [].concat.apply([], [].slice.call(arguments, 0, -1));
  const callback = arguments[arguments.length - 1];
  const task = spawn('git', args, { stdio: ['ignore', 'pipe', 'ignore'] });
  let output = '';
  task.stdout.setEncoding('utf8');
  task.stdout.on('data', function (data) {
    output += data;
  });
  task.on('exit', function (code) {
    callback(code, output);
  });
}

async function readText(filePath) {
  return await fs.readFile(filePath, 'utf8');
}

async function writeText(filePath, data) {
  await fs.writeFile(filePath, data, 'utf8');
}

async function loadModule() {
  const { minify } = await import('../src/htmlminifier.js');
  return minify || global.minify;
}

function getOptions(fileName, options) {
  const result = {
    minifyURLs: {
      site: urls[fileName]
    }
  };
  for (const key in options) {
    result[key] = options[key];
  }
  return result;
}

async function minify(hash, options) {
  const minifyFn = await loadModule();
  process.send('ready');
  let count = fileNames.length;

  for (const fileName of fileNames) {
    try {
      const data = await readText(path.join('./', fileName + '.html'));
      const minified = minifyFn(data, getOptions(fileName, options));
      if (minified) {
        process.send({ name: fileName, size: minified.length });
      } else {
        throw new Error('unexpected result: ' + minified);
      }
    } catch (e) {
      console.error('[' + fileName + ']', e.stack || e);
    } finally {
      if (!--count) {
        process.disconnect();
      }
    }
  }
}

function print(table) {
  const output = [];
  const errors = [];
  let row = fileNames.slice(0);
  row.unshift('hash', 'date');
  output.push(row.join(','));
  for (const hash in table) {
    const data = table[hash];
    row = [hash, '"' + data.date + '"'];
    fileNames.forEach(function (fileName) {
      row.push(data[fileName]);
    });
    output.push(row.join(','));
    if (data.error) {
      errors.push(hash + ' - ' + data.error);
    }
  }
  writeText('backtest.csv', output.join('\n'));
  writeText('backtest.log', errors.join('\n'));
}

if (process.argv.length > 2) {
  const count = +process.argv[2];
  if (count) {
    git('log', '--date=iso', '--pretty=format:%h %cd', '-' + count, function (code, data) {
      const table = {};
      const commits = data.split(/\s*?\n/).map(function (line) {
        const index = line.indexOf(' ');
        const hash = line.substr(0, index);
        table[hash] = {
          date: line.substr(index + 1).replace('+', '').replace(/ 0000$/, '')
        };
        return hash;
      });
      const nThreads = os.cpus().length;
      let running = 0;
      const progress = new Progress('[:bar] :etas', {
        width: 50,
        total: commits.length * 2
      });

      function forkTask() {
        if (commits.length && running < nThreads) {
          const hash = commits.shift();
          const task = fork(path.join(__dirname, 'backtest.js'), { silent: true });
          let error = '';
          const id = setTimeout(function () {
            if (task.connected) {
              error += 'task timed out\n';
              task.kill();
            }
          }, 60000);
          task.on('message', function (data) {
            if (data === 'ready') {
              progress.tick(1);
              forkTask();
            } else {
              table[hash][data.name] = data.size;
            }
          }).on('exit', function () {
            progress.tick(1);
            clearTimeout(id);
            if (error) {
              table[hash].error = error;
            }
            if (!--running && !commits.length) {
              print(table);
            } else {
              forkTask();
            }
          });
          task.stderr.setEncoding('utf8');
          task.stderr.on('data', function (data) {
            error += data;
          });
          task.stdout.resume();
          task.send(hash);
          running++;
        }
      }

      forkTask();
    });
  } else {
    console.error('Invalid input:', process.argv[2]);
  }
} else {
  process.on('message', function (hash) {
    const paths = ['src', 'benchmark.conf', 'html-minifier-benchmarks.json'];
    git('reset', 'HEAD', '--', paths, function () {
      let conf = 'html-minifier-benchmarks.json';

      function checkout() {
        const targetPath = paths.shift();
        git('checkout', hash, '--', targetPath, function (code) {
          if (code === 0 && targetPath === 'benchmark.conf') {
            conf = targetPath;
          }
          if (paths.length) {
            checkout();
          } else {
            readText(conf).then(data => {
              try {
                minify(hash, JSON.parse(data));
              } catch (e) {
                console.error(`Invalid JSON in ${conf}: ${e.message}`);
                process.disconnect();
              }
            }).catch(err => {
              console.error(`Failed to read ${conf}: ${err.message}`);
              process.disconnect();
            });
          }
        });
      }

      checkout();
    });
  });
}