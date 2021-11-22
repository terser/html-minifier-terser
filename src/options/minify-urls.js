import RelateUrl from 'relateurl';
import defaultOptions from './defaults.js';

const minifyURLs = (text, options = defaultOptions) => {
  if (!options.minifyURLs) {
    return text;
  }

  if (typeof options.minifyURLs === 'function') {
    return options.minifyURLs(text);
  }

  const relateURLOptions = {};

  if (typeof options.minifyURLs === 'string') {
    relateURLOptions.site = options.minifyURLs;
  }

  if (typeof options.minifyURLs === 'object') {
    Object.assign(relateURLOptions, options.minifyURLs);
  }

  try {
    return RelateUrl.relate(text, relateURLOptions);
  } catch (err) {
    options.log(err);
    return text;
  }
};

export default minifyURLs;
