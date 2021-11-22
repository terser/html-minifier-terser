import CleanCSS from 'clean-css';

import defaultOptions from './defaults.js';
import minifyURLs from './minify-urls.js';

// Wrap CSS declarations for CleanCSS > 3.x
// See https://github.com/jakubpawlowicz/clean-css/issues/418
const wrapCSS = (text, type) => {
  switch (type) {
    case 'inline':
      return '*{' + text + '}';
    case 'media':
      return '@media ' + text + '{a{top:0}}';
    default:
      return text;
  }
};

const unwrapCSS = (text, type) => {
  let matches;

  switch (type) {
    case 'inline':
      matches = text.match(/^\*\{([\s\S]*)\}$/);
      break;
    case 'media':
      matches = text.match(/^@media ([\s\S]*?)\s*{[\s\S]*}$/);
      break;
  }

  return matches ? matches[1] : text;
};

const minifyCSS = async (text = '', type = '', options = defaultOptions) => {
  if (!options.minifyCSS) {
    return text;
  }

  if (typeof options.minifyCSS === 'function') {
    const code = options.minifyCSS(text, type);
    return code;
  }

  const minifierOptions = {
    returnPromise: true
  };

  if (typeof options.minifyCSS === 'object') {
    Object.assign(minifierOptions, options.minifyCSS);
  }

  const urlMinifiedText = text.replace(/(url\s*\(\s*)("|'|)(.*?)\2(\s*\))/ig, function (match, prefix, quote, url, suffix) {
    return prefix + quote + minifyURLs(url, options) + quote + suffix;
  });

  let code = wrapCSS(urlMinifiedText, type);
  const cleancss = new CleanCSS(minifierOptions);

  try {
    const result = await cleancss.minify(code);
    code = result.styles;
  } catch (errors) {
    errors.forEach(options.log);
  }

  return unwrapCSS(code, type);
};

export default minifyCSS;
