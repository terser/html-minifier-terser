import { DomUtils } from 'htmlparser2';

import defaultOptions from './defaults.js';

const isIgnoredComment = (text = '', ignoreCustomComments = defaultOptions.ignoreCustomComments) => {
  return ignoreCustomComments.some(ignoredCommentRegex => ignoredCommentRegex.test(text));
};

const isConditionalComment = (text) => {
  return /^\[if\s[^\]]+]|\[endif]$/.test(text);
};

const removeComments = (node, options = defaultOptions) => {
  const isIgnored = isIgnoredComment(node.data, options.ignoreCustomComments);

  if (isIgnored) {
    return;
  }

  const isConditional = isConditionalComment(node.data);

  if (isConditional) {
    return;
  }

  DomUtils.removeElement(node);
};

export default removeComments;
