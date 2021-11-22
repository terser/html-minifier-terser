import defaultOptions from './defaults';

const SINGLE_QUOTE = '\'';
const DOUBLE_QUOTE = '"';
const DEFAULT_QUOTE_CHARACTER = DOUBLE_QUOTE;

const quoteCharacter = (node, options = defaultOptions) => {
  const { attrs } = node;

  if (!attrs) {
    return;
  }

  node.attrs = attrs.map(attr => {
    if (options.preventAttributesEscaping) {
      if (attr.quote === null) {
        return {
          ...attr,
          quote: ''
        };
      }

      return attr;
    }

    if (typeof attr.quote === 'undefined') {
      return attr;
    }

    let value = attr.value;
    let quote = attr.quote ?? DEFAULT_QUOTE_CHARACTER;

    if (options.quoteCharacter) {
      quote = options.quoteCharacter === SINGLE_QUOTE
        ? SINGLE_QUOTE
        : DOUBLE_QUOTE;
    } else {
      if (attr.quote) {
        const apos = (attr.value.match(/'/g) || []).length;
        const quot = (attr.value.match(/"/g) || []).length;
        quote = apos < quot ? '\'' : '"';
      }
    }

    if (quote === DOUBLE_QUOTE) {
      value = value.replace(/"/g, '&#34;');
    }

    if (quote === SINGLE_QUOTE) {
      value = value.replace(/'/g, '&#39;');
    }

    return {
      ...attr,
      value,
      quote
    };
  });
};

export default quoteCharacter;
