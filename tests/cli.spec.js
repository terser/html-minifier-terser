const fs = require('fs').promises;
const path = require('path');

const { describe, test, expect } = require('@jest/globals');
const { spawnSync } = require('child_process');
const { minify } = require('../src/htmlminifier');

const fixturesDir = path.resolve(__dirname, 'fixtures');
const cliPath = path.resolve(process.cwd(), 'cli.js');

const readFixture = async (filePath) => {
  const data = await fs.readFile(path.resolve(fixturesDir, filePath), 'utf-8');
  return data;
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
  test('minify the html', async () => {
    const inputHTML = await readFixture('default.html');

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
    const minifedHTML = await minify(inputHTML, minfiyOptions);

    expect(minifedHTML).toBe(cliMinifiedHTML);

    cliMinifiedHTML = execCli(['default.html']);
    expect(minifedHTML).not.toBe(cliMinifiedHTML);
  });

  test('should throw error if input file not found', () => {
    const cliArguments = [
      'no-file.html'
    ];

    expect(() => execCli(cliArguments)).toThrow('no such file');
  });
});
