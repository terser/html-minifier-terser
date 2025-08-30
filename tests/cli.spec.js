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

const existsFixture = (filePath) => {
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

    const minifyOptions = {
      collapseWhitespace: true,
      removeComments: true
    };

    const cliArguments = [
      'default.html',
      '--collapse-whitespace',
      '--remove-comments'
    ];

    let cliMinifiedHTML = execCli(cliArguments);
    const minifiedHTML = await minify(input, minifyOptions);

    expect(cliMinifiedHTML).toBe(minifiedHTML);

    cliMinifiedHTML = execCli(['default.html']);
    expect(cliMinifiedHTML).not.toBe(minifiedHTML);
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
    expect(existsFixture('tmp/default.html')).toBe(true);
  });

  test('should write files to output nested directory', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/nested'
    ];

    execCli(cliArguments);
    expect(existsFixture('tmp/nested/default.html')).toBe(true);
  });

  // Parsing JSON
  test('should minify urls correctly', async () => {
    const input = await readFixture('url.html');

    const minifyOptions = {
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
    const minifiedHTML = await minify(input, minifyOptions);
    expect(cliMinifiedHTML).toBe(minifiedHTML);
  });

  // Parsing string inputs
  test('should set quote char correctly', async () => {
    const input = await readFixture('fragment-quote-char.html');

    const minifyOptions = {
      collapseWhitespace: true,
      quoteCharacter: '\''
    };

    const cliArguments = [
      'fragment-quote-char.html',
      '--collapse-whitespace',
      '--quote-character=\''
    ];

    const cliMinifiedHTML = execCli(cliArguments);
    const minifiedHTML = await minify(input, minifyOptions);
    expect(cliMinifiedHTML).toBe(minifiedHTML);
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
    expect(existsFixture('tmp/single-ext/extension.html')).toBe(true);

    // Should not process other extensions
    expect(existsFixture('tmp/single-ext/extension.htm')).toBe(false);
    expect(existsFixture('tmp/single-ext/extension.php')).toBe(false);
    expect(existsFixture('tmp/single-ext/extension.txt')).toBe(false);
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
    expect(existsFixture('tmp/multi-ext/extension.html')).toBe(true);
    expect(existsFixture('tmp/multi-ext/extension.htm')).toBe(true);
    expect(existsFixture('tmp/multi-ext/extension.php')).toBe(true);

    // Should not process unspecified extensions
    expect(existsFixture('tmp/multi-ext/extension.txt')).toBe(false);
  });

  test('should process files with mixed-case and dot-prefixed extension tokens', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/mixed-case',
      '--file-ext=.HTML, HtM , .Php',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    expect(existsFixture('tmp/mixed-case/extension.html')).toBe(true);
    expect(existsFixture('tmp/mixed-case/extension.htm')).toBe(true);
    expect(existsFixture('tmp/mixed-case/extension.php')).toBe(true);
    expect(existsFixture('tmp/mixed-case/extension.txt')).toBe(false);
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
    expect(existsFixture('tmp/spaced-ext/extension.html')).toBe(true);
    expect(existsFixture('tmp/spaced-ext/extension.htm')).toBe(true);
    expect(existsFixture('tmp/spaced-ext/extension.php')).toBe(true);
    expect(existsFixture('tmp/spaced-ext/extension.txt')).toBe(false);
  });

  test('should process all files when no extension specified', () => {
    const cliArguments = [
      '--input-dir=./',
      '--output-dir=./tmp/all-files',
      '--collapse-whitespace'
    ];

    execCli(cliArguments);

    // Should process all files when no --file-ext is specified
    expect(existsFixture('tmp/all-files/extension.html')).toBe(true);
    expect(existsFixture('tmp/all-files/extension.htm')).toBe(true);
    expect(existsFixture('tmp/all-files/extension.php')).toBe(true);
    expect(existsFixture('tmp/all-files/extension.txt')).toBe(true);
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
    expect(existsFixture('tmp/verify-output/extension.php')).toBe(false);
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
    expect(existsFixture('tmp/empty-ext/extension.html')).toBe(true);
    expect(existsFixture('tmp/empty-ext/extension.htm')).toBe(true);
    expect(existsFixture('tmp/empty-ext/extension.php')).toBe(true);
    expect(existsFixture('tmp/empty-ext/extension.txt')).toBe(true);
  });

  test('should process files with extensions from config file (string format)', () => {
    fs.mkdirSync(path.resolve(fixturesDir, 'tmp'), { recursive: true });
    const configContent = JSON.stringify({
      fileExt: 'html,htm',
      collapseWhitespace: true
    });
    fs.writeFileSync(path.resolve(fixturesDir, 'tmp/test-config.json'), configContent);

    const cliArguments = [
      '--config-file=./tmp/test-config.json',
      '--input-dir=./',
      '--output-dir=./tmp/config-string'
    ];

    execCli(cliArguments);

    // Should process extensions specified in config
    expect(existsFixture('tmp/config-string/extension.html')).toBe(true);
    expect(existsFixture('tmp/config-string/extension.htm')).toBe(true);

    // Should not process unspecified extensions
    expect(existsFixture('tmp/config-string/extension.php')).toBe(false);
    expect(existsFixture('tmp/config-string/extension.txt')).toBe(false);

    // Clean up
    fs.unlinkSync(path.resolve(fixturesDir, 'tmp/test-config.json'));
  });

  test('should process files with extensions from config file (array format)', () => {
    fs.mkdirSync(path.resolve(fixturesDir, 'tmp'), { recursive: true });
    const configContent = JSON.stringify({
      fileExt: ['html'],
      collapseWhitespace: true
    });
    fs.writeFileSync(path.resolve(fixturesDir, 'tmp/test-config-array.json'), configContent);

    const cliArguments = [
      '--config-file=./tmp/test-config-array.json',
      '--input-dir=./',
      '--output-dir=./tmp/config-array'
    ];

    execCli(cliArguments);

    // Should process extensions specified in config array
    expect(existsFixture('tmp/config-array/extension.html')).toBe(true);

    // Should not process other extensions
    expect(existsFixture('tmp/config-array/extension.htm')).toBe(false);
    expect(existsFixture('tmp/config-array/extension.php')).toBe(false);
    expect(existsFixture('tmp/config-array/extension.txt')).toBe(false);

    // Clean up
    fs.unlinkSync(path.resolve(fixturesDir, 'tmp/test-config-array.json'));
  });

  test('should override config file extensions with CLI argument', () => {
    fs.mkdirSync(path.resolve(fixturesDir, 'tmp'), { recursive: true });
    const configContent = JSON.stringify({
      fileExt: 'html',  // Config specifies html
      collapseWhitespace: true
    });
    fs.writeFileSync(path.resolve(fixturesDir, 'tmp/test-config-override.json'), configContent);

    const cliArguments = [
      '--config-file=./tmp/test-config-override.json',
      '--input-dir=./',
      '--output-dir=./tmp/config-override',
      '--file-ext=htm'  // CLI overrides to htm
    ];

    execCli(cliArguments);

    // Should process CLI-specified extensions, not config extensions
    expect(existsFixture('tmp/config-override/extension.htm')).toBe(true);

    // Should not process config-specified extensions
    expect(existsFixture('tmp/config-override/extension.html')).toBe(false);
    expect(existsFixture('tmp/config-override/extension.php')).toBe(false);
    expect(existsFixture('tmp/config-override/extension.txt')).toBe(false);

    // Clean up
    fs.unlinkSync(path.resolve(fixturesDir, 'tmp/test-config-override.json'));
  });

  test('should override config file extensions with empty CLI argument', () => {
    fs.mkdirSync(path.resolve(fixturesDir, 'tmp'), { recursive: true });
    const configContent = JSON.stringify({
      fileExt: 'html',  // Config restricts to HTML only
      collapseWhitespace: true
    }, null, 2);
    fs.writeFileSync(path.resolve(fixturesDir, 'tmp/test-config-empty-override.json'), configContent);

    const cliArguments = [
      '--config-file=./tmp/test-config-empty-override.json',
      '--input-dir=./',
      '--output-dir=./tmp/config-empty-override',
      '--file-ext='  // Empty CLI argument should override config and process ALL files
    ];

    execCli(cliArguments);

    // Should process ALL files when CLI provides empty string (overriding config restriction)
    expect(existsFixture('tmp/config-empty-override/extension.html')).toBe(true);
    expect(existsFixture('tmp/config-empty-override/extension.htm')).toBe(true);
    expect(existsFixture('tmp/config-empty-override/extension.php')).toBe(true);
    expect(existsFixture('tmp/config-empty-override/extension.txt')).toBe(true);

    // Clean up
    fs.unlinkSync(path.resolve(fixturesDir, 'tmp/test-config-empty-override.json'));
  });
});