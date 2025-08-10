#!/usr/bin/env node

'use strict';

const fs = require('fs');
const zlib = require('zlib');
const https = require('https');
const path = require('path');
const { fork } = require('child_process');

const chalk = require('chalk');
const lzma = require('lzma');
const Minimize = require('minimize');
const Progress = require('progress');
const Table = require('cli-table3');

const urls = require('./sites.json');
const fileNames = Object.keys(urls);

const minimize = new Minimize();

const progress = new Progress('[:bar] :etas :fileName', {
  width: 50,
  total: fileNames.length
});

const table = new Table({
  head: ['File', 'Before', 'After', 'Minimize', 'htmlcompressor.com', 'Savings', 'Time'],
  colWidths: [fileNames.reduce(function (length, fileName) {
    return Math.max(length, fileName.length);
  }, 0) + 2, 25, 25, 25, 25, 25, 20, 10]
});

function toKb(size, precision) {
  return (size / 1024).toFixed(precision || 0);
}

function redSize(size) {
  return chalk.red.bold(size) + chalk.white(' (' + toKb(size, 2) + ' KB)');
}

function greenSize(size) {
  return chalk.green.bold(size) + chalk.white(' (' + toKb(size, 2) + ' KB)');
}

function blueSavings(oldSize, newSize) {
  const savingsPercent = (1 - newSize / oldSize) * 100;
  const savings = oldSize - newSize;
  return chalk.cyan.bold(savingsPercent.toFixed(2)) + chalk.white('% (' + toKb(savings, 2) + ' KB)');
}

function blueTime(time) {
  return chalk.cyan.bold(time) + chalk.white(' ms');
}

function readBuffer(filePath, callback) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      throw new Error('There was an error reading ' + filePath);
    }
    callback(data);
  });
}

function readText(filePath, callback) {
  fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
    if (err) {
      throw new Error('There was an error reading ' + filePath);
    }
    callback(data);
  });
}

function writeBuffer(filePath, data, callback) {
  fs.writeFile(filePath, data, function (err) {
    if (err) {
      throw new Error('There was an error writing ' + filePath);
    }
    callback();
  });
}

function writeText(filePath, data, callback) {
  fs.writeFile(filePath, data, { encoding: 'utf8' }, function (err) {
    if (err) {
      throw new Error('There was an error writing ' + filePath);
    }
    if (callback) {
      callback();
    }
  });
}

function readSize(filePath, callback) {
  fs.stat(filePath, function (err, stats) {
    if (err) {
      throw new Error('There was an error reading ' + filePath);
    }
    callback(stats.size);
  });
}

function gzip(inPath, outPath, callback) {
  fs.createReadStream(inPath).pipe(zlib.createGzip({
    level: zlib.constants.Z_BEST_COMPRESSION
  })).pipe(fs.createWriteStream(outPath)).on('finish', callback);
}

function brotli(inPath, outPath, callback) {
  fs.createReadStream(inPath).pipe(zlib.createBrotliCompress())
    .pipe(fs.createWriteStream(outPath)).on('finish', callback);
}

function run(tasks, done) {
  let i = 0;

  function callback() {
    if (i < tasks.length) {
      tasks[i++](callback);
    } else {
      done();
    }
  }

  callback();
}

const rows = {};

function generateMarkdownTable() {
  const headers = [
    'Site',
    'Original size (KB)',
    'HTMLMinifier',
    'minimize',
    'htmlcompressor.com'
  ];

  fileNames.forEach(function (fileName) {
    // Add a check for `rows[fileName]`
    if (!rows[fileName] || !rows[fileName].report) {
      console.error(`Skipping ${fileName}: row or report is missing`);
      return;
    }

    const row = rows[fileName].report;
    row[2] = '**' + row[2] + '**';
  });

  const widths = headers.map(function (header, index) {
    let width = header.length;
    fileNames.forEach(function (fileName) {
      if (rows[fileName] && rows[fileName].report) {
        width = Math.max(width, rows[fileName].report[index].length);
      }
    });
    return width;
  });

  let content = '';

  function output(row) {
    widths.forEach(function (width, index) {
      const text = row[index];
      content += '| ' + text + new Array(width - text.length + 2).join(' ');
    });
    content += '|\n';
  }

  output(headers);
  widths.forEach(function (width, index) {
    content += '| ' + '-'.repeat(width) + ' ';
  });
  content += '|\n';

  fileNames.forEach(function (fileName) {
    if (!rows[fileName] || !rows[fileName].report) return; // Prevent outputting rows with missing data
    output(rows[fileName].report);
  });

  return content;
}

function displayTable() {
  fileNames.forEach(function (fileName) {
    if (rows[fileName]) { // Ensure the `fileName` exists in rows
      table.push(rows[fileName].display);
    } else {
      console.warn(`Warning: No data available for ${fileName}. Skipping.`);
    }
  });
  console.log();
  console.log(table.toString());
}

run(fileNames.map(function (fileName) {
  const filePath = path.join('./sources', fileName + '.html');

  function processFile(site, done) {
    const original = {
      filePath: filePath,
      gzFilePath: path.join('./generated/', fileName + '.html.gz'),
      lzFilePath: path.join('./generated/', fileName + '.html.lz'),
      brFilePath: path.join('./generated/', fileName + '.html.br')
    };
    const infos = {};
    ['minifier', 'minimize', 'compressor'].forEach(function (name) {
      infos[name] = {
        filePath: path.join('./generated/', fileName + '.' + name + '.html'),
        gzFilePath: path.join('./generated/', fileName + '.' + name + '.html.gz'),
        lzFilePath: path.join('./generated/', fileName + '.' + name + '.html.lz'),
        brFilePath: path.join('./generated/', fileName + '.' + name + '.html.br')
      };
    });

    function readSizes(info, done) {
      info.endTime = Date.now();
      run([
        // Apply Gzip on minified output
        function (done) {
          gzip(info.filePath, info.gzFilePath, function () {
            info.gzTime = Date.now();
            // Open and read the size of the minified+gzip output
            readSize(info.gzFilePath, function (size) {
              info.gzSize = size;
              done();
            });
          });
        },
        // Apply LZMA on minified output
        function (done) {
          readBuffer(info.filePath, function (data) {
            lzma.compress(data, 1, function (result, error) {
              if (error) {
                throw error;
              }
              writeBuffer(info.lzFilePath, Buffer.from(result), function () {
                info.lzTime = Date.now();
                // Open and read the size of the minified+lzma output
                readSize(info.lzFilePath, function (size) {
                  info.lzSize = size;
                  done();
                });
              });
            });
          });
        },
        // Apply Brotli on minified output
        function (done) {
          brotli(info.filePath, info.brFilePath, function () {
            info.brTime = Date.now();
            // Open and read the size of the minified+gzip output
            readSize(info.brFilePath, function (size) {
              info.brSize = size;
              done();
            });
          });
        },
        // Open and read the size of the minified output
        function (done) {
          readSize(info.filePath, function (size) {
            info.size = size;
            done();
          });
        }
      ], done);
    }

    function testHTMLMinifier(done) {
      const info = infos.minifier;
      info.startTime = Date.now();
      const args = [filePath, '-c', 'sample-cli-config-file.conf', '--minify-urls', site, '-o', info.filePath];
      fork('../cli', args).on('exit', function () {
        readSizes(info, done);
      });
    }

    function testMinimize(done) {
      readBuffer(filePath, function (data) {
        minimize.parse(data, function (_, data) {
          const info = infos.minimize;
          writeBuffer(info.filePath, data, function () {
            readSizes(info, done);
          });
        });
      });
    }

    function testHTMLCompressor(done) {
      readText(filePath, function (data) {
        const url = new URL('https://htmlcompressor.com/compress');
        const options = {
          method: 'POST',
          headers: {
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };

        let info = infos.compressor;

        function failed() {
          // Site refused to process content
          if (info) {
            info.size = 0;
            info.gzSize = 0;
            info.lzSize = 0;
            info.brSize = 0;
            info = null;
            done();
          }
        }

        https.request(url, options, function (res) {
          if (res.headers['content-encoding'] === 'gzip') {
            res = res.pipe(zlib.createGunzip());
          }
          res.setEncoding('utf8');
          let response = '';
          res.on('data', function (chunk) {
            response += chunk;
          }).on('end', function () {
            let compressedContent = '';
            let isSuccess = false;

            // Try to parse as JSON first (old API format)
            try {
              const jsonResponse = JSON.parse(response);
              if (jsonResponse.success && jsonResponse.result) {
                compressedContent = jsonResponse.result;
                isSuccess = true;
              }
            } catch (e) {
              // If JSON parsing fails, treat as direct text response (new API format)
              if (response && response.length > 0 && response.includes('<') && response.length < data.length) {
                compressedContent = response;
                isSuccess = true;
              }
            }

            if (info && isSuccess && compressedContent) {
              writeText(info.filePath, compressedContent, function () {
                readSizes(info, done);
              });
            } else { // Site refused to process content or returned error
              failed();
            }
          });
        }).on('error', failed).end(new URLSearchParams({
          code_type: 'html',
          html_level: 3,
          html_strip_quotes: 1,
          minimize_style: 1,
          minimize_events: 1,
          minimize_js_href: 1,
          minimize_css: 1,
          minimize_js: 1,
          html_optional_cdata: 1,
          js_engine: 'yui',
          js_fallback: 1,
          code: data
        }).toString());
      });
    }

    run([
      function (done) {
        readSizes(original, done);
      },
      testHTMLMinifier,
      testMinimize,
      testHTMLCompressor
    ], function () {
      const display = [
        [fileName, '+ gzip', '+ lzma', '+ brotli'].join('\n'),
        [redSize(original.size), redSize(original.gzSize), redSize(original.lzSize), redSize(original.brSize)].join('\n')
      ];
      const report = [
        '[' + fileName + '](' + urls[fileName] + ')',
        toKb(original.size)
      ];
      for (const name in infos) {
        const info = infos[name];
        display.push([greenSize(info.size), greenSize(info.gzSize), greenSize(info.lzSize), greenSize(info.brSize)].join('\n'));
        const sizeValue = info.size ? toKb(info.size) : 'n/a';
        report.push(sizeValue === '0' ? 'n/a' : sizeValue);
      }
      display.push(
        [
          blueSavings(original.size, infos.minifier.size),
          blueSavings(original.gzSize, infos.minifier.gzSize),
          blueSavings(original.lzSize, infos.minifier.lzSize),
          blueSavings(original.brSize, infos.minifier.brSize)
        ].join('\n'),
        [
          blueTime(infos.minifier.endTime - infos.minifier.startTime),
          blueTime(original.gzTime - original.endTime),
          blueTime(original.lzTime - original.gzTime),
          blueTime(original.brTime - original.lzTime)
        ].join('\n')
      );
      rows[fileName] = {
        display: display,
        report: report
      };
      progress.tick({ fileName: '' });
      done();
    });
  }

  function get(site, callback) {
    const url = new URL(site);

    https.get(url, function (res) {
      const status = res.statusCode;
      if (status === 200) {
        if (res.headers['content-encoding'] === 'gzip') {
          res = res.pipe(zlib.createGunzip());
        }
        res.pipe(fs.createWriteStream(filePath)).on('finish', function () {
          callback(site);
        });
      } else if (status >= 300 && status < 400 && res.headers.location) {
        get(new URL(res.headers.location, site), callback);
      } else {
        console.warn(`Warning: HTTP error ${status} for ${site}`);
        callback(null); // Pass `null` to indicate failure
      }
    }).on('error', function (err) {
      console.error(`Error: Failed to fetch ${site} - ${err.message}`);
      callback(null); // Pass `null` to indicate failure
    });
  }

  return function (done) {
    progress.tick(0, { fileName: fileName });
    get(urls[fileName], function (site) {
      if (!site) {
        console.warn(`Skipping ${fileName} due to download failure.`);
        rows[fileName] = null; // Explicitly mark as skipped
        done(); // Skip processing this file
        return;
      }
      processFile(site, done);
    });
  };
}), function () {
  displayTable();
  const content = generateMarkdownTable();
  const readme = '../README.md';
  readText(readme, function (data) {
    let start = data.indexOf('## Minification comparison');
    start = data.indexOf('|', start);
    let end = data.indexOf('##', start);
    end = data.lastIndexOf('|\n', end) + '|\n'.length;
    data = data.slice(0, start) + content + data.slice(end);
    writeText(readme, data);
  });
});