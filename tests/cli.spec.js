import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

import { describe, test, expect, beforeEach } from '@jest/globals';
import { minify } from '../src/htmlminifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  await fs.promises.rm(pathToDelete, { recursive: true, force: true });
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

  // Parsing JSON
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

  // Parsing string inputs
  test('should set quote char correctly', async () => {
    const input = await readFixture('fragment-quote-char.html');

    const minfiyOptions = {
      collapseWhitespace: true,
      quoteCharacter: '\''
    };

    const cliArguments = [
      'fragment-quote-char.html',
      '--collapse-whitespace',
      '--quote-character=\''
    ];

    const cliMinifiedHTML = execCli(cliArguments);
    const minifedHTML = await minify(input, minfiyOptions);
    expect(cliMinifiedHTML).toBe(minifedHTML);
  });

  // Parsing array inputs
  test('should handle inline-custom-elements correctly', async () => {
    const input = await readFixture('fragment-inline-custom-elements.html');

    const minifyOptions = {
      collapseWhitespace: true,
      inlineCustomElements: ['custom-element', 'custom-inline']
    };

    const cliArguments = [
      'fragment-inline-custom-elements.html',
      '--collapse-whitespace',
      '--inline-custom-elements=["custom-element","custom-inline"]'
    ];

    const cliMinifiedHTML = execCli(cliArguments);
    const minifiedHTML = await minify(input, minifyOptions);
    expect(cliMinifiedHTML).toBe(minifiedHTML);

    // Verify spacing is preserved for specified custom elements
    expect(cliMinifiedHTML).toContain('<custom-element>A</custom-element> <custom-element>B</custom-element>');
    expect(cliMinifiedHTML).toContain('<span>Standard</span> <custom-inline>Custom</custom-inline>');
    // but not for unspecified custom elements
    expect(cliMinifiedHTML).toContain('<web-component>X</web-component><web-component>Y</web-component>');
  });

  test('should process files with single extension', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/single-ext',
      '--file-ext=html',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should process .html files
    expect(existsFixutre('tmp/single-ext/extension.html')).toBe(true);

    // Should not process other extensions
    expect(existsFixutre('tmp/single-ext/extension.htm')).toBe(false);
    expect(existsFixutre('tmp/single-ext/extension.php')).toBe(false);
    expect(existsFixutre('tmp/single-ext/extension.txt')).toBe(false);
  });

  test('should process files with multiple extensions', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/multi-ext',
      '--file-ext=html,htm,php',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should process specified extensions
    expect(existsFixutre('tmp/multi-ext/extension.html')).toBe(true);
    expect(existsFixutre('tmp/multi-ext/extension.htm')).toBe(true);
    expect(existsFixutre('tmp/multi-ext/extension.php')).toBe(true);

    // Should not process unspecified extensions
    expect(existsFixutre('tmp/multi-ext/extension.txt')).toBe(false);
  });

  test('should process files with comma-separated extensions with spaces', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/spaced-ext',
      '--file-ext=html, htm , php',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should handle spaces around commas correctly
    expect(existsFixutre('tmp/spaced-ext/extension.html')).toBe(true);
    expect(existsFixutre('tmp/spaced-ext/extension.htm')).toBe(true);
    expect(existsFixutre('tmp/spaced-ext/extension.php')).toBe(true);
    expect(existsFixutre('tmp/spaced-ext/extension.txt')).toBe(false);
  });

  test('should process all files when no extension specified', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/all-files',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should process all files when no --file-ext is specified
    expect(existsFixutre('tmp/all-files/extension.html')).toBe(true);
    expect(existsFixutre('tmp/all-files/extension.htm')).toBe(true);
    expect(existsFixutre('tmp/all-files/extension.php')).toBe(true);
    expect(existsFixutre('tmp/all-files/extension.txt')).toBe(true);
  });

  test('should verify minified output for multiple extensions', async () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/verify-output',
      '--file-ext=html,htm',
      '--collapse-whitespace',
      '--remove-comments'
    ];

    execCli(cliArguments);

    // Verify HTML file is minified correctly
    const minifiedHtml = await fs.promises.readFile(
      path.resolve(fixturesDir, 'tmp/verify-output/extension.html'),
      'utf-8'
    );
    expect(minifiedHtml).toBe('<!DOCTYPE html><html><head><title>.html extension test page</title></head><body><p>Test content</p></body></html>');

    // Verify HTM file is minified correctly
    const minifiedHtm = await fs.promises.readFile(
      path.resolve(fixturesDir, 'tmp/verify-output/extension.htm'),
      'utf-8'
    );
    expect(minifiedHtm).toBe('<!DOCTYPE html><html><head><title>.htm extension test page</title></head><body><p>Test content</p></body></html>');

    // PHP file should not be processed (not in the extension list)
    expect(existsFixutre('tmp/verify-output/extension.php')).toBe(false);
  });

  test('should handle empty extension list gracefully', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/empty-ext',
      '--file-ext=',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should process all files when empty string is provided
    expect(existsFixutre('tmp/empty-ext/extension.html')).toBe(true);
    expect(existsFixutre('tmp/empty-ext/extension.htm')).toBe(true);
    expect(existsFixutre('tmp/empty-ext/extension.php')).toBe(true);
    expect(existsFixutre('tmp/empty-ext/extension.txt')).toBe(true);
  });
});