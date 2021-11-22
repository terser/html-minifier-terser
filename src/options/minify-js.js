import { minify } from 'terser';

import { defaultContext } from '../context.js';
import defaultOptions from './defaults.js';

const removeComments = (text = '') => {
  const start = text.match(/^\s*<!--.*/);
  return start ? text.slice(start[0].length).replace(/\n\s*-->\s*$/, '') : text;
};

const removeTrailingSemi = (text = '') => {
  return text.replace(/;$/, '');
};

export const minifyJS = async (text = '', inline = false, options = defaultOptions, ctx = defaultContext) => {
  if (!options.minifyJS) {
    return text;
  }

  if (typeof options.minifyJS === 'function') {
    const code = await options.minifyJS(text, inline);
    return code;
  }

  const minifierOptions = {};

  if (typeof options.minifyJS === 'object') {
    Object.assign(minifierOptions, options.minifyJS);
  }

  minifierOptions.parse = {
    ...minifierOptions.parse,
    bare_returns: inline
  };

  let code = removeComments(text);

  const uidPattern = ctx.get('uidPattern');

  if (uidPattern) {
    const ignoredCustomMarkupChunks = ctx.get('ignoredCustomMarkupChunks');
    const uidAttr = ctx.get('uidAttr');

    code = text.replace(uidPattern, function (match, prefix, index) {
      const chunks = ignoredCustomMarkupChunks[+index];
      return chunks[1] + uidAttr + index + uidAttr + chunks[2];
    });
  }

  try {
    const result = await minify(code, minifierOptions);
    code = removeTrailingSemi(result.code);
  } catch (err) {
    code = text;
    options.log(err);
  }

  return code;
};

export default minifyJS;
