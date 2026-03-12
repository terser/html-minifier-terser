import { test, expect } from 'vitest';
import { minify_sync } from '../src/htmlminifier';

test('`minify_sync` exists', () => {
  expect(minify_sync).toBeDefined();
  expect(typeof minify_sync).toBe('function');
});

test('minify_sync returns a string synchronously', () => {
  const result = minify_sync('<p>hello</p>');
  expect(typeof result).toBe('string');
  expect(result).toBe('<p>hello</p>');
});

test('minify_sync: basic whitespace collapsing', () => {
  expect(minify_sync('<p>  hello   world  </p>', { collapseWhitespace: true })).toBe('<p>hello world</p>');
  expect(minify_sync('<div>  <span>  text  </span>  </div>', { collapseWhitespace: true })).toBe('<div><span>text</span></div>');
});

test('minify_sync: removing comments', () => {
  expect(minify_sync('<!-- comment --><p>text</p>', { removeComments: true })).toBe('<p>text</p>');
  expect(minify_sync('<p><!-- inline -->text</p>', { removeComments: true })).toBe('<p>text</p>');
});

test('minify_sync: removing redundant attributes', () => {
  expect(minify_sync('<form method="get"></form>', { removeRedundantAttributes: true })).toBe('<form></form>');
  expect(minify_sync('<input type="text">', { removeRedundantAttributes: true })).toBe('<input>');
});

test('minify_sync: collapsing boolean attributes', () => {
  expect(minify_sync('<input disabled="disabled">', { collapseBooleanAttributes: true })).toBe('<input disabled>');
  expect(minify_sync('<input readonly="readonly">', { collapseBooleanAttributes: true })).toBe('<input readonly>');
});

test('minify_sync: removing optional tags', () => {
  expect(minify_sync('<html><head></head><body><p>text</p></body></html>', { removeOptionalTags: true })).toBe('<p>text');
});

test('minify_sync: JS minification with built-in terser', () => {
  expect(minify_sync('<script>var x = 1 + 1;</script>', { minifyJS: true })).toBe('<script>var x=2</script>');
  expect(minify_sync('<script>  function  foo ( ) {  return 1;  }  </script>', { minifyJS: true })).toBe('<script>function foo(){return 1}</script>');
});

test('minify_sync: event attribute JS minification', () => {
  expect(minify_sync('<a onclick="  var x = 1 + 1;  ">link</a>', { minifyJS: true })).toBe('<a onclick="var x=2">link</a>');
});

test('minify_sync: CSS minification with built-in clean-css', () => {
  expect(minify_sync('<style>  p  {  color:  red;  }  </style>', { minifyCSS: true })).toBe('<style>p{color:red}</style>');
  expect(minify_sync('<style>a { color: red; } b { color: red; }</style>', { minifyCSS: true })).toBe('<style>a{color:red}b{color:red}</style>');
});

test('minify_sync: inline style attribute CSS minification', () => {
  expect(minify_sync('<p style="  color:  red;  ">text</p>', { minifyCSS: true })).toBe('<p style="color:red">text</p>');
});

test('minify_sync: combined options', () => {
  const input = '<!-- comment -->  <p  class="  foo  bar  ">  hello  </p>  ';
  const result = minify_sync(input, {
    removeComments: true,
    collapseWhitespace: true,
    sortClassName: true
  });
  expect(result).toBe('<p class="bar foo">hello</p>');
});

test('minify_sync: caseSensitive option', () => {
  expect(minify_sync('<MyComponent></MyComponent>', { caseSensitive: true })).toBe('<MyComponent></MyComponent>');
  expect(minify_sync('<MyComponent></MyComponent>')).toBe('<mycomponent></mycomponent>');
});

test('minify_sync: parse errors throw', () => {
  expect(() => minify_sync('<$invalid>')).toThrow();
});

test('minify_sync: continueOnParseError suppresses throw', () => {
  expect(minify_sync('<$invalid>', { continueOnParseError: true })).toBe('<$invalid>');
});

test('minify_sync: throws for async minifyJS option', () => {
  expect(() => minify_sync('<script>var x=1</script>', {
    minifyJS: async (text) => text
  })).toThrow('minify_sync does not support async minifyJS/minifyCSS options');
});

test('minify_sync: throws for async minifyCSS option', () => {
  expect(() => minify_sync('<style>p{color:red}</style>', {
    minifyCSS: async (text) => text
  })).toThrow('minify_sync does not support async minifyJS/minifyCSS options');
});

test('minify_sync: accepts sync custom minifyJS function', () => {
  const result = minify_sync('<script>var x = 1;</script>', {
    minifyJS: (text) => text.trim()
  });
  expect(result).toBe('<script>var x = 1;</script>');
});

test('minify_sync: accepts sync custom minifyCSS function', () => {
  const result = minify_sync('<style>p { color: red; }</style>', {
    minifyCSS: (text) => text.replace(/\s+/g, '')
  });
  expect(result).toBe('<style>p{color:red;}</style>');
});

test('minify_sync produces same output as minify for common cases', async () => {
  const cases = [
    ['<p>hello</p>', {}],
    ['<p>  hello   </p>', { collapseWhitespace: true }],
    ['<!-- c --><div>text</div>', { removeComments: true }],
    ['<input type="text" disabled="disabled">', { collapseBooleanAttributes: true, removeRedundantAttributes: true }],
    ['<style>p { color : red }</style>', { minifyCSS: true }],
    ['<script>var x   =   1;</script>', { minifyJS: true }]
  ];

  for (const [input, options] of cases) {
    const syncResult = minify_sync(input, options);
    const asyncResult = await import('../src/htmlminifier').then(m => m.minify(input, options));
    expect(syncResult).toBe(asyncResult);
  }
});
