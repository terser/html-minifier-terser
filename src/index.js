import { Parser } from 'htmlparser2';

import defaultOptions from './options/defaults.js';
import preProcessInput from './pre-process-input.js';
import DomHandler from './dom-handler/index.js';
import HTMLMinifier from './html-minifier.js';
import createSorter from './options/sorter.js';
import Serializer from './serializer.js';
import processScripts from './options/process-scripts.js';
import Context, { defaultContext } from './context.js';
import collapseWhitespace from './options/collapse-whitespace.js';

const parseDocument = (data, parserOptions) => {
  const handler = new DomHandler();
  new Parser(handler, parserOptions).end(data);
  return handler.root;
};

const _minify = async (input = '', opts = defaultOptions, ctx = defaultContext) => {
  const options = { ...defaultOptions, ...opts };

  const context = new Context();
  context.extend(ctx);

  const { html, restore } = preProcessInput(input, options, context);

  const parserOptions = {
    recognizeSelfClosing: true,
    decodeEntities: options.decodeEntities,
    lowerCaseAttributeNames: !options.caseSensitive
  };

  const tree = parseDocument(html, parserOptions);

  const htmlMinifier = new HTMLMinifier(options, context);
  await htmlMinifier.minify(tree);

  if (options.sortAttributes || options.sortClassName) {
    const sort = createSorter(tree, options, context);
    sort();
  }

  if (options.processScripts) {
    const minifier = async (text) => {
      return _minify(text, options, context);
    };

    await processScripts(tree, options, minifier);
  }

  if (options.collapseWhitespace) {
    collapseWhitespace(tree, options);
  }

  const serializer = new Serializer(options);
  const output = serializer.render(tree);

  return restore(output);
};

export const minify = async (input = '', options = defaultOptions) => {
  return _minify(input, options);
};
