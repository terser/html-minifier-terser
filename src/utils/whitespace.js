const STARTS_WITH_WHITESPACE_REGEX = /^\s/;
const END_WITH_WHITESPACE_REGEX = /\s$/;

export const EMPTY = '';
export const SINGLE_SPACE = ' ';

export const startsWithWitespace = (str = EMPTY) => STARTS_WITH_WHITESPACE_REGEX.test(str);
export const endsWithWhiteSpace = (str = EMPTY) => END_WITH_WHITESPACE_REGEX.test(str);
export const isEmpty = (str = EMPTY) => !(/[^\t\n\r ]/.test(str));

export const collapseWhitespaceAll = (str = EMPTY) => {
  // Non-breaking space is specifically handled inside the replacer function here:
  return str.replace(/[ \n\r\t\f\xA0]+/g, function (spaces) {
    return spaces === '\t' ? '\t' : spaces.replace(/(^|\xA0+)[^\xA0]+/g, '$1 ');
  });
};

export const trimWhitespace = (str = EMPTY) => {
  return str.replace(/^[ \n\r\t\f]+/, EMPTY)
    .replace(/[ \n\r\t\f]+$/, EMPTY);
};

const trimStart = (str = EMPTY, hasLinebreak, conservativeCollapse = false) => {
  return str.replace(/^[ \n\r\t\f\xA0]+/, function (spaces) {
    const conservative = !hasLinebreak && conservativeCollapse;
    if (conservative && spaces === '\t') {
      return '\t';
    }
    return spaces
      .replace(/^[^\xA0]+/, EMPTY)
      .replace(/(\xA0+)[^\xA0]+/g, '$1 ') || (conservative ? SINGLE_SPACE : EMPTY);
  });
};

const trimEnd = (str = EMPTY, hasLinebreak, conservativeCollapse = false) => {
  return str.replace(/[ \n\r\t\f\xA0]+$/, function (spaces) {
    const conservative = !hasLinebreak && conservativeCollapse;
    if (conservative && spaces === '\t') {
      return '\t';
    }
    return spaces
      .replace(/[^\xA0]+(\xA0+)/g, ' $1')
      .replace(/[^\xA0]+$/, EMPTY) || (conservative ? SINGLE_SPACE : EMPTY);
  });
};

const defaultsCollapseOptions = {
  preserveLineBreaks: false,
  conservativeCollapse: false
};

export const collapseWhitespace = (str = EMPTY, opts = {}, trimLeft = false, trimRight = false, collapseAll = false) => {
  let text = str;
  const options = { ...defaultsCollapseOptions, ...opts };

  let lineBreakBefore = '';
  let lineBreakAfter = '';

  if (options.preserveLineBreaks) {
    text = text.replace(/^[ \n\r\t\f]*?[\n\r][ \n\r\t\f]*/, function () {
      lineBreakBefore = '\n';
      return '';
    }).replace(/[ \n\r\t\f]*?[\n\r][ \n\r\t\f]*$/, function () {
      lineBreakAfter = '\n';
      return '';
    });
  }

  if (trimLeft) {
    // Non-breaking space is specifically handled inside the replacer function here:
    text = trimStart(text, lineBreakBefore, options.conservativeCollapse);
  }

  if (trimRight) {
    // Non-breaking space is specifically handled inside the replacer function here:
    text = trimEnd(text, lineBreakAfter, options.conservativeCollapse);
  }

  if (collapseAll) {
    // strip non space whitespace then compress spaces to one
    text = collapseWhitespaceAll(text);
  }

  return lineBreakBefore + text + lineBreakAfter;
};
