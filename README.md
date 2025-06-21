# HTML Minifier Next (HTMLMinifier)

[![NPM version](https://img.shields.io/npm/v/html-minifier-next.svg)](https://www.npmjs.com/package/html-minifier-next)
<!-- [![Build Status](https://github.com/j9t/html-minifier-next/workflows/CI/badge.svg)](https://github.com/j9t/html-minifier-next/actions?workflow=CI) -->

(This project is based on [Terser’s html-minifier-terser](https://github.com/terser/html-minifier-terser), which in turn is based on [Juriy Zaytsev’s html-minifier](https://github.com/kangax/html-minifier). It was set up because as of May 2025, both html-minifier-terser and html-minifier seem unmaintained. **This project is currently under test.** If it seems maintainable to me, [Jens](https://meiert.com/), even without community support, the project will be updated and documented further. The following documentation largely matches the original project.)

HTMLMinifier is a highly **configurable, well-tested, JavaScript-based HTML minifier**.

## Installation

From npm for use as a command line app:

```shell
npm i -g html-minifier-next
```

From npm for programmatic use:

```shell
npm i html-minifier-next
```

## Usage

**Note** that almost all options are disabled by default. Experiment and find what works best for you and your project.

For command line usage please see `html-minifier-next --help` for a list of available options.

**Sample command line:**

```bash
html-minifier-next --collapse-whitespace --remove-comments --minify-js true
```

### Node.js

```js
const { minify } = require('html-minifier-next');

const result = await minify('<p title="blah" id="moo">foo</p>', {
  removeAttributeQuotes: true,
});
result; // '<p title=blah id=moo>foo</p>'
```

See [the origina blog post](http://perfectionkills.com/experimenting-with-html-minifier) for details of [how it works](http://perfectionkills.com/experimenting-with-html-minifier#how_it_works), [description of each option](http://perfectionkills.com/experimenting-with-html-minifier#options), [testing results](http://perfectionkills.com/experimenting-with-html-minifier#field_testing), and [conclusions](http://perfectionkills.com/experimenting-with-html-minifier#cost_and_benefits).

For lint-like capabilities take a look at [HTMLLint](https://github.com/kangax/html-lint).

## Minification comparison

How does HTMLMinifier compare to other solutions — [HTML Minifier from Will Peavy](http://www.willpeavy.com/minifier/) (1st result in [Google search for “html minifier”](https://www.google.com/#q=html+minifier)) as well as [htmlcompressor.com](http://htmlcompressor.com) and [minimize](https://github.com/Swaagie/minimize)?

| Site | Original size (KB) | HTMLMinifier | minimize | htmlcompressor.com |
| --- | --- | --- | --- | --- |
| [Amazon](https://www.amazon.com/) | 6 | **4** | 4 | n/a |
| [BBC](https://www.bbc.co.uk/) | 759 | **699** | 752 | n/a |
| [ECMAScript](https://tc39.es/ecma262/) | 7195 | **6352** | 6571 | n/a |
| [EFF](https://www.eff.org/) | 60 | **51** | 54 | n/a |
| [Eloquent JavaScript](https://eloquentjavascript.net/) | 6 | **5** | 6 | n/a |
| [FAZ](https://www.faz.net/aktuell/) | 1738 | **1614** | 1649 | n/a |
| [Frontend Dogma](https://frontenddogma.com/) | 119 | **115** | 128 | n/a |
| [Google](https://www.google.com/) | 50 | **46** | 50 | n/a |
| [HTMLMinifier](https://github.com/kangax/html-minifier) | 363 | **243** | 341 | n/a |
| [Mastodon](https://mastodon.social/explore) | 22 | **13** | 21 | n/a |
| [NBC](https://www.nbc.com/) | 1204 | **1099** | 1191 | n/a |
| [New York Times](https://www.nytimes.com/) | 900 | **760** | 890 | n/a |
| [United Nations](https://www.un.org/) | 10 | **7** | 8 | n/a |
| [W3C](https://www.w3.org/) | 51 | **36** | 42 | n/a |
| [Wikipedia](https://en.wikipedia.org/wiki/Main_Page) | 114 | **100** | 107 | n/a |

## Options quick reference

Most of the options are disabled by default.

| Option | Description | Default |
| --- | --- | --- |
| `caseSensitive` | Treat attributes in case sensitive manner (useful for custom HTML tags) | `false` |
| `collapseBooleanAttributes` | [Omit attribute values from boolean attributes](http://perfectionkills.com/experimenting-with-html-minifier#collapse_boolean_attributes) | `false` |
| `customFragmentQuantifierLimit` | Set maximum quantifier limit for custom fragments to prevent ReDoS attacks | `1000` |
| `collapseInlineTagWhitespace` | Don’t leave any spaces between `display:inline;` elements when collapsing. Must be used in conjunction with `collapseWhitespace=true` | `false` |
| `collapseWhitespace` | [Collapse white space that contributes to text nodes in a document tree](http://perfectionkills.com/experimenting-with-html-minifier#collapse_whitespace) | `false` |
| `conservativeCollapse` | Always collapse to 1 space (never remove it entirely). Must be used in conjunction with `collapseWhitespace=true` | `false` |
| `continueOnParseError` | [Handle parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) instead of aborting. | `false` |
| `customAttrAssign` | Arrays of regex’es that allow to support custom attribute assign expressions (e.g. `'<div flex?="{{mode != cover}}"></div>'`) | `[ ]` |
| `customAttrCollapse` | Regex that specifies custom attribute to strip newlines from (e.g. `/ng-class/`) | |
| `customAttrSurround` | Arrays of regexes that allow to support custom attribute surround expressions (e.g. `<input {{#if value}}checked="checked"{{/if}}>`) | `[ ]` |
| `customEventAttributes` | Arrays of regexes that allow to support custom event attributes for `minifyJS` (e.g. `ng-click`) | `[ /^on[a-z]{3,}$/ ]` |
| `decodeEntities` | Use direct Unicode characters whenever possible | `false` |
| `html5` | Parse input according to HTML5 specifications | `true` |
| `ignoreCustomComments` | Array of regexes that allow to ignore certain comments, when matched | `[ /^!/, /^\s*#/ ]` |
| `ignoreCustomFragments` | Array of regexes that allow to ignore certain fragments, when matched (e.g. `<?php ... ?>`, `{{ ... }}`, etc.) | `[ /<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/ ]` |
| `includeAutoGeneratedTags` | Insert tags generated by HTML parser | `true` |
| `keepClosingSlash` | Keep the trailing slash on singleton elements | `false` |
| `maxInputLength` | Maximum input length to prevent ReDoS attacks (disabled by default) | `undefined` |
| `maxLineLength` | Specify a maximum line length. Compressed output will be split by newlines at valid HTML split-points |
| `minifyCSS` | Minify CSS in style elements and style attributes (uses [clean-css](https://github.com/jakubpawlowicz/clean-css)) | `false` (could be `true`, `Object`, `Function(text, type)`) |
| `minifyJS` | Minify JavaScript in script elements and event attributes (uses [Terser](https://github.com/terser/terser)) | `false` (could be `true`, `Object`, `Function(text, inline)`) |
| `minifyURLs` | Minify URLs in various attributes (uses [relateurl](https://github.com/stevenvachon/relateurl)) | `false` (could be `String`, `Object`, `Function(text)`) |
| `noNewlinesBeforeTagClose` | Never add a newline before a tag that closes an element | `false` |
| `preserveLineBreaks` | Always collapse to 1 line break (never remove it entirely) when whitespace between tags include a line break. Must be used in conjunction with `collapseWhitespace=true` | `false` |
| `preventAttributesEscaping` | Prevents the escaping of the values of attributes | `false` |
| `processConditionalComments` | Process contents of conditional comments through minifier | `false` |
| `processScripts` | Array of strings corresponding to types of script elements to process through minifier (e.g. `text/ng-template`, `text/x-handlebars-template`, etc.) | `[ ]` |
| `quoteCharacter` | Type of quote to use for attribute values (“'” or “"”) | |
| `removeAttributeQuotes` | [Remove quotes around attributes when possible](http://perfectionkills.com/experimenting-with-html-minifier#remove_attribute_quotes) | `false` |
| `removeComments` | [Strip HTML comments](http://perfectionkills.com/experimenting-with-html-minifier#remove_comments) | `false` |
| `removeEmptyAttributes` | [Remove all attributes with whitespace-only values](http://perfectionkills.com/experimenting-with-html-minifier#remove_empty_or_blank_attributes) | `false` (could be `true`, `Function(attrName, tag)`) |
| `removeEmptyElements` | [Remove all elements with empty contents](http://perfectionkills.com/experimenting-with-html-minifier#remove_empty_elements) | `false` |
| `removeOptionalTags` | [Remove optional tags](http://perfectionkills.com/experimenting-with-html-minifier#remove_optional_tags) | `false` |
| `removeRedundantAttributes` | [Remove attributes when value matches default.](http://perfectionkills.com/experimenting-with-html-minifier#remove_redundant_attributes) | `false` |
| `removeScriptTypeAttributes` | Remove `type="text/javascript"` from `script` tags. Other `type` attribute values are left intact | `false` |
| `removeStyleLinkTypeAttributes`| Remove `type="text/css"` from `style` and `link` tags. Other `type` attribute values are left intact | `false` |
| `removeTagWhitespace` | Remove space between attributes whenever possible. **Note that this will result in invalid HTML!** | `false` |
| `sortAttributes` | [Sort attributes by frequency](#sorting-attributes--style-classes) | `false` |
| `sortClassName` | [Sort style classes by frequency](#sorting-attributes--style-classes) | `false` |
| `trimCustomFragments` | Trim white space around `ignoreCustomFragments`. | `false` |
| `useShortDoctype` | [Replaces the `doctype` with the short (HTML5) doctype](http://perfectionkills.com/experimenting-with-html-minifier#use_short_doctype) | `false` |

### Sorting attributes / style classes

Minifier options like `sortAttributes` and `sortClassName` won’t impact the plain-text size of the output. However, they form long repetitive chains of characters that should improve compression ratio of gzip used in HTTP compression.

## Special cases

### Ignoring chunks of markup

If you have chunks of markup you would like preserved, you can wrap them `<!-- htmlmin:ignore -->`.

### Minifying JSON-LD

You can minify script tags with JSON-LD by setting the option `{ processScripts: ['application/ld+json'] }`. Note that this minification is very rudimentary, it is mainly useful for removing newlines and excessive whitespace. 

### Preserving SVG tags

SVG tags are automatically recognized, and when they are minified, both case-sensitivity and closing-slashes are preserved, regardless of the minification settings used for the rest of the file.

### Working with invalid markup

HTMLMinifier **can’t work with invalid or partial chunks of markup**. This is because it parses markup into a tree structure, then modifies it (removing anything that was specified for removal, ignoring anything that was specified to be ignored, etc.), then it creates a markup out of that tree and returns it.

Input markup (e.g. `<p id="">foo`)

↓

Internal representation of markup in a form of tree (e.g. `{ tag: "p", attr: "id", children: ["foo"] }`)

↓

Transformation of internal representation (e.g. removal of `id` attribute)

↓

Output of resulting markup (e.g. `<p>foo</p>`)

HTMLMinifier can’t know that original markup was only half of the tree; it does its best to try to parse it as a full tree and it loses information about tree being malformed or partial in the beginning. As a result, it can’t create a partial/malformed tree at the time of the output.

## Security

### ReDoS protection

This minifier includes protection against Regular Expression Denial of Service (ReDoS) attacks:

* Custom fragment quantifier limits: The `customFragmentQuantifierLimit` option (default: `1000`) prevents exponential backtracking by using bounded quantifiers instead of unlimited ones (`*` or `+`) in regular expressions.

* Input length limits: The `maxInputLength` option allows you to set a maximum input size to prevent processing of excessively large inputs that could cause performance issues.

* Custom fragment warnings: The minifier will warn you if your custom fragments contain unlimited quantifiers that could be vulnerable to ReDoS attacks.

**Important:** When using custom `ignoreCustomFragments`, ensure your regular expressions don’t contain unlimited quantifiers (`*`, `+`) without bounds, as these can lead to ReDoS vulnerabilities.

(Further improvements are needed. Contributions welcome.)

## Running benchmarks

Benchmarks for minified HTML:

```shell
cd benchmarks
npm install
npm run benchmark
```

## Running local server

```shell
npm run serve
```