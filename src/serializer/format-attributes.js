import defaultOptions from '../options/defaults.js';
import { selfClosingTags } from '../utils/tags.js';
import { SINGLE_SPACE } from '../utils/whitespace.js';

const endsWithTrailingSlash = (str = '') => /\/$/.test(str);

const formatAttributes = (elem, options = defaultOptions) => {
  const { attrs } = elem;

  if (!attrs) {
    return;
  }

  return attrs.reduce((attrString, { name, value, quote }, index) => {
    let attr = attrString;

    attr += name;

    if (typeof quote !== 'undefined') {
      attr += `=${quote}${value}${quote}`;
    }

    const isLast = attrs.length === index + 1;

    if (isLast && quote === '' && selfClosingTags.has(elem.name)) {
      attr += SINGLE_SPACE;
    }

    if (options.removeTagWhitespace) {
      if (!isLast && (!quote || value.length === 0)) {
        attr += SINGLE_SPACE;
      }
    } else {
      if (!isLast) {
        attr += SINGLE_SPACE;
      }
    }

    // make sure trailing slash is not interpreted as HTML self-closing tag
    if (!quote && endsWithTrailingSlash(attr)) {
      attr += SINGLE_SPACE;
    }

    return attr;
  }, '');
};

export default formatAttributes;
