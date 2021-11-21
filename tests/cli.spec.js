const fs = require('fs');
const path = require('path');

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { spawnSync } = require('child_process');
const { minify } = require('../src/htmlminifier');

const fixturesDir = path.resolve(__dirname, 'fixtures');
const cliPath = path.resolve(process.cwd(), 'cli.js');

const readFixture = async (filePath) => {
  const data = await fs.promises.readFile(path.resolve(fixturesDir, filePath), 'utf-8');
  return data;
};

const existsFixutre = (filePath) => {
  return fs.existsSync(path.resolve(fixturesDir, filePath));
};

const removeFixture = async (p) => {
  const pathToDelete = path.resolve(fixturesDir, p);
  // TODO: Temp fix for CI running on node 12,
  // because fs.rm is available only in node 14 and newer
  if (fs.rm) {
    await fs.promises.rm(pathToDelete, { recursive: true, force: true });
  } else if (fs.existsSync(pathToDelete)) {
    await fs.promises.rmdir(pathToDelete, { recursive: true });
  }
};

const execCli = (args = []) => {
  const spawnOptions = {
    cwd: fixturesDir
  };

  const { stdout, stderr } = spawnSync('node', [cliPath, ...args], spawnOptions);
  const error = stderr.toString().trim();

  if (error) {
    throw new Error(error);
  } else {
    return stdout.toString().trim();
  }
};

describe('cli', () => {
  beforeEach(async () => {
    await removeFixture('tmp');
  });

  test('minify the html', async () => {
    const input = await readFixture('default.html');

    const minfiyOptions = {
      collapseWhitespace: true,
      removeComments: true
    };

    const cliArguments = [
      'default.html',
      '--collapse-whitespace',
      '--remove-comments'
    ];

    let cliMinifiedHTML = execCli(cliArguments);
    const minifedHTML = await minify(input, minfiyOptions);

    expect(cliMinifiedHTML).toBe(minifedHTML);

    cliMinifiedHTML = execCli(['default.html']);
    expect(cliMinifiedHTML).not.toBe(minifedHTML);
  });

  test('should throw error if input file not found', () => {
    const cliArguments = [
      'no-file.html'
    ];

    expect(() => execCli(cliArguments)).toThrow('no such file');
  });

  test('should throw if output directory not specified', () => {
    const cliArguments = [
      '--input-dir=./'
    ];

    expect(() => execCli(cliArguments)).toThrow('You need to specify where to write the output files with the option --output-dir');
  });

  test('should throw if input directory not specified', () => {
    const cliArguments = [
      '--output-dir=./'
    ];

    expect(() => execCli(cliArguments)).toThrow('The option output-dir needs to be used with the option input-dir. If you are working with a single file, use -o');
  });

  test('should write files to output directory', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp'
    ];

    execCli(cliArguments);
    expect(existsFixutre('tmp/default.html')).toBe(true);
  });

  test('should write files to output nested directory', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/nested'
    ];

    execCli(cliArguments);
    expect(existsFixutre('tmp/nested/default.html')).toBe(true);
  });

  // parsing json
  test('should minify urls correctly', async () => {
    const input = await readFixture('url.html');

    const minfiyOptions = {
      collapseWhitespace: true,
      minifyURLs: {
        site: 'http://website.com/folder/'
      }
    };

    const cliArguments = [
      'url.html',
      '--collapse-whitespace',
      '--minify-urls={"site":"http://website.com/folder/"}'
    ];

    const cliMinifiedHTML = execCli(cliArguments);
    const minifedHTML = await minify(input, minfiyOptions);
    expect(cliMinifiedHTML).toBe(minifedHTML);
  });

  // parsing string inputs
  test('should set quote char correctly', async () => {
    const input = await readFixture('quote-char.html');

    const minfiyOptions = {
      collapseWhitespace: true,
      quoteCharacter: '\''
    };

    const cliArguments = [
      'quote-char.html',
      '--collapse-whitespace',
      '--quote-character=\''
    ];

    const cliMinifiedHTML = execCli(cliArguments);
    const minifedHTML = await minify(input, minfiyOptions);
    expect(cliMinifiedHTML).toBe(minifedHTML);
  });
});
